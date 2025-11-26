import mongoose from 'mongoose';

const PollVoteSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  nickname: { type: String, required: true },
  option: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const LivePollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activityId: { type: String, required: true },
  createdBy: { type: String, required: true }, // Host user ID
  
  // Poll content
  question: { type: String, required: true },
  description: { type: String }, // Optional description
  type: { type: String, enum: ['MultiChoice', 'MultiVote', 'OpenText', 'Rating'], default: 'MultiChoice' },
  options: [{ type: String, required: true }],
  
  // Poll state
  isActive: { type: Boolean, default: true },
  allowMultipleVotes: { type: Boolean, default: false },
  
  // Votes
  votes: [PollVoteSchema],
  
  // Timing
  duration: { type: Number, default: 300 }, // seconds
  expiresAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes
LivePollSchema.index({ activityId: 1, isActive: 1 });
LivePollSchema.index({ expiresAt: 1 });

// Set expiration time before saving
LivePollSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + this.duration * 1000);
  }
  this.updatedAt = new Date();
  next();
});

// Instance method to add vote
LivePollSchema.methods.addVote = function(participantId, nickname, option) {
  // Check if option is valid
  if (!this.options.includes(option)) {
    throw new Error('Invalid option');
  }
  
  // Check if poll is still active
  if (!this.isActive || new Date() > this.expiresAt) {
    throw new Error('Poll is no longer active');
  }
  
  // Remove existing vote if single vote only
  if (!this.allowMultipleVotes) {
    this.votes = this.votes.filter(vote => vote.participantId !== participantId);
  }
  
  // Add new vote
  this.votes.push({
    participantId,
    nickname,
    option,
    timestamp: new Date()
  });
  
  return this.save();
};

// Instance method to get results
LivePollSchema.methods.getResults = function() {
  const results = {};
  
  if (this.type === 'OpenText') {
    // For text-based polls, return individual responses
    return {
      totalVotes: this.votes.length,
      responses: this.votes.map(vote => ({
        text: vote.option,
        nickname: vote.nickname,
        timestamp: vote.timestamp
      })),
      isActive: this.isActive && new Date() <= this.expiresAt,
      type: this.type
    };
  }
  
  // For MultiChoice, MultiVote, and Rating polls, group by option
  // Initialize results for all options
  this.options.forEach(option => {
    results[option] = {
      count: 0,
      percentage: 0,
      votes: []
    };
  });
  
  // Count votes
  this.votes.forEach(vote => {
    if (results[vote.option]) {
      results[vote.option].count++;
      results[vote.option].votes.push({
        nickname: vote.nickname,
        timestamp: vote.timestamp
      });
    }
  });
  
  // Calculate percentages
  const totalVotes = this.votes.length;
  Object.keys(results).forEach(option => {
    results[option].percentage = totalVotes > 0 
      ? Math.round((results[option].count / totalVotes) * 100)
      : 0;
  });
  
  return {
    totalVotes,
    results,
    isActive: this.isActive && new Date() <= this.expiresAt,
    type: this.type
  };
};

// Static method to expire old polls
LivePollSchema.statics.expireOldPolls = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { isActive: true, expiresAt: { $lte: now } },
    { $set: { isActive: false, updatedAt: now } }
  );
  return result.modifiedCount;
};

export default mongoose.model('LivePoll', LivePollSchema);