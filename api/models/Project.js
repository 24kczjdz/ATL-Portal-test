import mongoose from 'mongoose';
import emailService from '../services/emailService.js';

const ProjectSchema = new mongoose.Schema({
  proj_name: { 
    type: String, 
    required: true 
  },
  proj_type: { 
    type: String, 
    required: true,
    enum: [
      'Research',
      'Development',
      'Art Installation',
      'Workshop',
      'Exhibition',
      'Community Outreach',
      'Other'
    ]
  },
  proj_desc: { 
    type: String, 
    required: true 
  },
  proj_start_date: { 
    type: Date, 
    required: true 
  },
  proj_end_date: { 
    type: Date, 
    required: true 
  },
  proj_status: { 
    type: String, 
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  creator: { 
    type: String, 
    required: true 
  },
  project_leader: { 
    type: String, 
    required: false 
  },
  members: [{ 
    type: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving and handle status changes
ProjectSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Check if status changed
  if (this.isModified('proj_status') && !this.isNew) {
    const oldStatus = this._original?.proj_status;
    
    if (oldStatus && oldStatus !== this.proj_status) {
      try {
        const recordData = {
          project_name: this.proj_name,
          project_type: this.proj_type,
          creator_name: this.creator,
          member_count: this.members.length,
          start_date: this.proj_start_date?.toDateString(),
          end_date: this.proj_end_date?.toDateString(),
          project_description: this.proj_desc,
          user_emails: this.members || []
        };

        const changeData = {
          record_type: 'project',
          record_id: this._id.toString(),
          old_status: oldStatus,
          new_status: this.proj_status,
          action_type: 'status_change'
        };

        // Send notifications asynchronously
        setImmediate(() => {
          emailService.sendStatusChangeNotification(recordData, changeData)
            .catch(error => console.error('Email notification failed:', error));
        });
      } catch (error) {
        console.error('Error preparing email notification:', error);
      }
    }
  }
  
  next();
});

// Store original document for comparison
ProjectSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

// Virtual for member count
ProjectSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Index for efficient queries
ProjectSchema.index({ creator: 1 });
ProjectSchema.index({ members: 1 });
ProjectSchema.index({ proj_status: 1 });

export default mongoose.model('Project', ProjectSchema, 'projects');