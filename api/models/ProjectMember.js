import mongoose from 'mongoose';

const ProjectMemberSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project',
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['leader', 'member', 'contributor'],
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
ProjectMemberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index to ensure unique project-user combinations
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
ProjectMemberSchema.index({ userId: 1 });
ProjectMemberSchema.index({ projectId: 1 });

export default mongoose.model('ProjectMember', ProjectMemberSchema, 'projectMembers');
