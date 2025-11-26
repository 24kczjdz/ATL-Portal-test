import mongoose from 'mongoose';

const SigMemberSchema = new mongoose.Schema({
  sigId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentInterestGroup',
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['leader', 'member', 'coordinator'],
    default: 'member'
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
SigMemberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index to ensure unique sig-user combinations
SigMemberSchema.index({ sigId: 1, userId: 1 }, { unique: true });
SigMemberSchema.index({ userId: 1 });
SigMemberSchema.index({ sigId: 1 });

export default mongoose.model('SigMember', SigMemberSchema, 'sigMembers');
