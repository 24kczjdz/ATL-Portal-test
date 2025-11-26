import mongoose from 'mongoose';

const BookingLogSchema = new mongoose.Schema({
  // Reference to the original booking
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'EquipmentBooking',
    required: true 
  },
  // Type of booking (equipment or venue)
  booking_type: {
    type: String,
    enum: ['equipment', 'venue'],
    default: 'equipment'
  },
  // Equipment reference
  equipment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment'
  },
  // User who made the booking
  user_id: { 
    type: String, 
    ref: 'USER',
    required: true 
  },
  // Admin who performed the action
  admin_id: { 
    type: String, 
    ref: 'USER'
  },
  // Action type
  action: {
    type: String,
    enum: ['created', 'confirmed', 'cancelled', 'completed', 'returned'],
    required: true
  },
  // Previous status (for tracking changes)
  previous_status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', null],
    default: null
  },
  // New status after action
  new_status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    required: true
  },
  // Additional notes/comments
  notes: {
    type: String,
    default: ''
  },
  // Booking details snapshot (for historical reference)
  booking_details: {
    eqm_booking_date: Date,
    eqm_booking_time: String,
    eqm_booking_duration: Number,
    equipment_name: String,
    equipment_category: String,
    equipment_type: String,
    location: String
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
BookingLogSchema.index({ booking_id: 1 });
BookingLogSchema.index({ equipment_id: 1 });
BookingLogSchema.index({ user_id: 1 });
BookingLogSchema.index({ admin_id: 1 });
BookingLogSchema.index({ action: 1 });
BookingLogSchema.index({ createdAt: -1 });

export default mongoose.model('BookingLog', BookingLogSchema, 'bookingLogs');

