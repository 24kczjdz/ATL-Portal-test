import mongoose from 'mongoose';
import emailService from '../services/emailService.js';

const StudentInterestGroupSchema = new mongoose.Schema({
  sig_name: { 
    type: String, 
    required: true 
  },
  sig_abbrev: { 
    type: String, 
    required: true,
    unique: true,
    maxlength: 10,
    uppercase: true
  },
  sig_desc: { 
    type: String, 
    required: true 
  },
  sig_status: { 
    type: String, 
    enum: ['recruiting', 'active', 'inactive'],
    default: 'recruiting'
  },
  members: [{ 
    type: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving and handle status changes
StudentInterestGroupSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Check if status changed
  if (this.isModified('sig_status') && !this.isNew) {
    const oldStatus = this._original?.sig_status;
    
    if (oldStatus && oldStatus !== this.sig_status) {
      try {
        const recordData = {
          sig_name: this.sig_name,
          sig_abbrev: this.sig_abbrev,
          member_count: this.members.length,
          sig_description: this.sig_desc,
          user_emails: this.members || []
        };

        const changeData = {
          record_type: 'sig',
          record_id: this._id.toString(),
          old_status: oldStatus,
          new_status: this.sig_status,
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
StudentInterestGroupSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

// Virtual for member count
StudentInterestGroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Index for efficient queries
StudentInterestGroupSchema.index({ members: 1 });
StudentInterestGroupSchema.index({ sig_status: 1 });

export default mongoose.model('StudentInterestGroup', StudentInterestGroupSchema, 'studentInterestGroups');