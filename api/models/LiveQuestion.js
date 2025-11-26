import mongoose from 'mongoose';

const QAQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activityId: { type: String, required: true },
  participantId: { type: String }, // null for anonymous
  nickname: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false }, // Whether this question is anonymous
  
  question: { type: String, required: true },
  
  // Threading support
  parentQuestionId: { type: String, default: null }, // null for top-level questions
  isReply: { type: Boolean, default: false },
  
  // Status and moderation
  status: { 
    type: String, 
    enum: ['pending', 'answered', 'dismissed'],
    default: 'pending'
  },
  
  // Community interaction
  upvotes: [String], // Array of participant IDs
  upvoteCount: { type: Number, default: 0 },
  
  // Answer from host
  answer: {
    text: String,
    answeredBy: String, // Host user ID
    answeredAt: Date
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for efficient queries
QAQuestionSchema.index({ activityId: 1, status: 1 });
QAQuestionSchema.index({ activityId: 1, createdAt: -1 });

// Update upvote count and updatedAt on save
QAQuestionSchema.pre('save', function(next) {
  this.upvoteCount = this.upvotes.length;
  this.updatedAt = new Date();
  next();
});

// Instance method to add upvote
QAQuestionSchema.methods.addUpvote = function(participantId) {
  if (!this.upvotes.includes(participantId)) {
    this.upvotes.push(participantId);
  }
  return this.save();
};

// Instance method to remove upvote
QAQuestionSchema.methods.removeUpvote = function(participantId) {
  this.upvotes = this.upvotes.filter(id => id !== participantId);
  return this.save();
};

// Static method to get popular questions
QAQuestionSchema.statics.getPopularQuestions = function(activityId, limit = 10) {
  return this.find({ activityId, status: { $ne: 'dismissed' } })
    .sort({ upvoteCount: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get questions with replies (threaded view)
QAQuestionSchema.statics.getThreadedQuestions = function(activityId) {
  return this.find({ activityId, parentQuestionId: null })
    .sort({ upvoteCount: -1, createdAt: -1 });
};

// Static method to get replies for a question
QAQuestionSchema.statics.getReplies = function(questionId) {
  return this.find({ parentQuestionId: questionId })
    .sort({ createdAt: 1 });
};

// Instance method to get reply count
QAQuestionSchema.methods.getReplyCount = function() {
  return this.constructor.countDocuments({ parentQuestionId: this.id });
};

export default mongoose.model('LiveQAQuestion', QAQuestionSchema);