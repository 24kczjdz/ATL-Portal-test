import mongoose from 'mongoose';
import emailService from '../services/emailService.js';

const EquipmentBookingSchema = new mongoose.Schema({
  eqm_booking_date: { 
    type: Date, 
    required: true 
  },
  eqm_booking_time: { 
    type: String, 
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  eqm_booking_duration: { 
    type: Number, 
    required: true,
    min: 1,
    max: 24 // hours
  },
  equipment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment',
    required: true 
  },
  user_id: { 
    type: String, 
    ref: 'USER',
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving and handle status changes
EquipmentBookingSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Check if status changed
  if (this.isModified('status') && !this.isNew) {
    const oldStatus = this._original?.status;
    
    if (oldStatus && oldStatus !== this.status) {
      // Prepare notification data
      try {
        const recordData = {
          booking_id: this._id,
          equipment_name: this.equipment_id?.name || 'Unknown Equipment',
          user_name: this.user_id,
          user_email: this.user_id,
          user_emails: [this.user_id],
          booking_date: this.eqm_booking_date?.toDateString(),
          booking_time: this.eqm_booking_time,
          duration: this.eqm_booking_duration
        };

        const changeData = {
          record_type: 'booking',
          record_id: this._id.toString(),
          old_status: oldStatus,
          new_status: this.status,
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
EquipmentBookingSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

// Index for efficient queries
EquipmentBookingSchema.index({ equipment_id: 1, eqm_booking_date: 1 });
EquipmentBookingSchema.index({ user_id: 1 });

export default mongoose.model('EquipmentBooking', EquipmentBookingSchema, 'equipmentBookings');