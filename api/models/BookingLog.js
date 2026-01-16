import mongoose from 'mongoose';

const BookingLogSchema = new mongoose.Schema({
  // Reference to the original booking
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
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
  // Venue reference
  venue_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue'
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
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'returned'],
    required: true
  },
  // Additional notes/comments
  notes: {
    type: String,
    default: ''
  },
  // Booking details snapshot (for historical reference)
  booking_details: {
    // Equipment booking details
    eqm_booking_date: Date,
    eqm_booking_time: String,
    eqm_booking_duration: Number,
    equipment_name: String,
    equipment_category: String,
    equipment_type: String,
    location: String,
    // Venue booking details
    venue_booking_date: Date,
    venue_booking_time: String,
    venue_booking_duration: Number,
    venue_unit: String,
    venue_type: String,
    venue_capacity: Number,
    booking_desc: String,
    total_pay: Number
  },
  // Status change timestamp (when the status was changed)
  status_changed_at: { type: Date, default: Date.now },
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

