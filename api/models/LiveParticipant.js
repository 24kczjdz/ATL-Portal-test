import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionIndex: { type: Number, required: true },
  answer: mongoose.Schema.Types.Mixed, // String, Array, or Number
  responseTime: { type: Number, default: 0 }, // milliseconds
  timestamp: { type: Date, default: Date.now },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  questionIndex: { type: Number, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: true },
  likes: { type: Number, default: 0 },
  likedBy: [String] // User IDs
}, { _id: false });

const ReactionSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['like', 'love', 'laugh', 'wow', 'confused', 'clap'],
    required: true 
  },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const LiveParticipantSchema = new mongoose.Schema({
  activityId: { type: String, required: true },
  userId: { type: String }, // null for anonymous participants
  nickname: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  
  // Participation data
  responses: [ResponseSchema],
  comments: [CommentSchema],
  reactions: [ReactionSchema],
  
  // Session info
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  isConnected: { type: Boolean, default: true },
  
  // Analytics
  totalResponseTime: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 }
});

// Create compound index for efficient queries
LiveParticipantSchema.index({ activityId: 1, userId: 1 });
// Optimize queries that fetch responses for a specific question index within an activity
LiveParticipantSchema.index({ activityId: 1, 'responses.questionIndex': 1 });

// Update last activity on save
LiveParticipantSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  
  // Calculate average response time
  if (this.responses.length > 0) {
    this.totalResponseTime = this.responses.reduce((sum, r) => sum + r.responseTime, 0);
    this.averageResponseTime = this.totalResponseTime / this.responses.length;
  }
  
  next();
});

export default mongoose.model('LiveParticipant', LiveParticipantSchema);