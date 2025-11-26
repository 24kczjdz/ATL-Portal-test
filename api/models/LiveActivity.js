import mongoose from 'mongoose';

// Response schema for question responses and poll votes
const ResponseSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  nickname: { type: String, required: true },
  response: { type: String, required: true }, // Can be option text or free text
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['MultiChoice', 'MultiVote', 'OpenText', 'Rating'],
    required: true
  },
  text: { type: String, required: true },
  description: { type: String }, // Optional description
  options: [String], // For multiple choice and polls
  
  // Question state and timing
  isActive: { type: Boolean, default: false },
  isPoll: { type: Boolean, default: false }, // Distinguishes live polls from pre-defined questions
  createdBy: { type: String }, // Host user ID who created this question/poll
  createdAt: { type: Date, default: Date.now },
  
  // Responses/votes
  responses: [ResponseSchema],
  
  // Settings
  settings: {
    timeLimit: { type: Number, default: 0 }, // seconds, 0 = no limit
    allowMultiple: { type: Boolean, default: false },
    required: { type: Boolean, default: true },
    duration: { type: Number, default: 300 }, // For live polls (seconds)
    expiresAt: { type: Date }, // For live polls
    showResultsLive: { type: Boolean, default: true }
  }
}, { _id: false });

const LiveActivitySchema = new mongoose.Schema({
  Act_ID: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  pin: { type: String, required: true, unique: true },
  hostIds: [{ type: String, required: true }], // User IDs who can host
  
  // Activity state
  isLive: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 0 },
  
  // Questions
  questions: [QuestionSchema],
  
  // Settings
  settings: {
    allowAnonymous: { type: Boolean, default: true },
    allowComments: { type: Boolean, default: true },
    allowQuestions: { type: Boolean, default: true },
    showResultsLive: { type: Boolean, default: true },
    moderateQA: { type: Boolean, default: false }
  },
  
  // Analytics
  analytics: {
    totalParticipants: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
LiveActivitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique PIN
LiveActivitySchema.statics.generatePin = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Instance method to add a live poll as a question
LiveActivitySchema.methods.addLivePoll = function(hostId, questionData) {
  const expiresAt = new Date(Date.now() + (questionData.duration || 300) * 1000);
  const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const pollQuestion = {
    id: pollId, // required by QuestionSchema (_id disabled)
    type: questionData.type || 'MultiChoice',
    text: questionData.question,
    description: questionData.description || '',
    options: questionData.options || [],
    isActive: true,
    isPoll: true,
    createdBy: hostId,
    createdAt: new Date(),
    responses: [],
    settings: {
      allowMultiple: questionData.allowMultiple || false,
      duration: questionData.duration || 300,
      expiresAt: expiresAt,
      showResultsLive: true,
      required: false
    }
  };
  
  this.questions.push(pollQuestion);
  return this.save().then(() => pollQuestion);
};

// Instance method to add response to a question/poll
LiveActivitySchema.methods.addResponse = function(questionId, participantId, nickname, response) {
  // Subdocuments have _id disabled; find by custom id
  const question = this.questions.find(q => q.id === questionId);
  if (!question) {
    console.error('Question not found for ID:', questionId);
    console.error('Available questions:', this.questions.map(q => ({ id: q.id, text: q.text })));
    throw new Error('Question not found');
  }
  
  // Check if question/poll is active
  if (question.isPoll) {
    if (!question.isActive || (question.settings.expiresAt && new Date() > question.settings.expiresAt)) {
      throw new Error('Poll is no longer active');
    }
  }
  
  // Check if option is valid for multiple choice
  if (['MultiChoice', 'MultiVote'].includes(question.type) && !question.options.includes(response)) {
    throw new Error('Invalid option selected');
  }
  
  // Remove existing response if single response only
  if (!question.settings.allowMultiple) {
    question.responses = question.responses.filter(r => r.participantId !== participantId);
  }
  
  // Add new response
  question.responses.push({
    participantId,
    nickname,
    response,
    timestamp: new Date()
  });
  
  return this.save();
};

// Instance method to get question results
LiveActivitySchema.methods.getQuestionResults = function(questionId) {
  // Subdocuments have _id disabled; find by custom id
  const question = this.questions.find(q => q.id === questionId);
  if (!question) {
    console.error('Question not found for ID:', questionId);
    console.error('Available questions:', this.questions.map(q => ({ id: q.id, text: q.text })));
    throw new Error('Question not found');
  }
  
  const results = {};
  
  if (question.type === 'OpenText') {
    // For text-based questions, return individual responses
    return {
      questionId: question.id,
      question: question.text,
      type: question.type,
      isPoll: question.isPoll,
      totalResponses: question.responses.length,
      responses: question.responses.map(r => ({
        text: r.response,
        nickname: r.nickname,
        timestamp: r.timestamp
      })),
      isActive: question.isActive && (!question.settings.expiresAt || new Date() <= question.settings.expiresAt)
    };
  }
  
  // For MultiChoice, MultiVote, and Rating questions, group by option
  // Initialize results for all options
  question.options.forEach(option => {
    results[option] = {
      count: 0,
      percentage: 0,
      responses: []
    };
  });
  
  // Count responses
  question.responses.forEach(response => {
    if (results[response.response]) {
      results[response.response].count++;
      results[response.response].responses.push({
        nickname: response.nickname,
        timestamp: response.timestamp
      });
    }
  });
  
  // Calculate percentages
  const totalResponses = question.responses.length;
  Object.keys(results).forEach(option => {
    results[option].percentage = totalResponses > 0 
      ? Math.round((results[option].count / totalResponses) * 100)
      : 0;
  });
  
  return {
    questionId: question.id,
    question: question.text,
    type: question.type,
    isPoll: question.isPoll,
    totalResponses,
    results,
    isActive: question.isActive && (!question.settings.expiresAt || new Date() <= question.settings.expiresAt)
  };
};

// Instance method to expire old polls
LiveActivitySchema.methods.expireOldPolls = function() {
  const now = new Date();
  let modified = false;
  
  this.questions.forEach(question => {
    if (question.isPoll && question.isActive && question.settings.expiresAt && now > question.settings.expiresAt) {
      question.isActive = false;
      modified = true;
    }
  });
  
  if (modified) {
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to navigate to specific question
LiveActivitySchema.methods.navigateToQuestion = function(questionIndex) {
  if (questionIndex < 0 || questionIndex >= this.questions.length) {
    throw new Error('Invalid question index');
  }
  
  this.currentQuestionIndex = questionIndex;
  return this.save();
};

// Instance method to get current question
LiveActivitySchema.methods.getCurrentQuestion = function() {
  if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) {
    return null;
  }
  
  return this.questions[this.currentQuestionIndex];
};

export default mongoose.model('LiveActivity', LiveActivitySchema);