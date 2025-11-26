import mongoose from 'mongoose';

const VenueBookingSchema = new mongoose.Schema({
  booking_date: { 
    type: Date, 
    required: true 
  },
  booking_time: { 
    type: String, 
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  booking_duration: { 
    type: Number, 
    required: true,
    min: 1,
    max: 24 // hours
  },
  booking_desc: String,
  total_pay: { 
    type: Number, 
    required: true,
    min: 0 
  },
  venue_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue',
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

// Update the updatedAt field before saving
VenueBookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
VenueBookingSchema.index({ venue_id: 1, booking_date: 1 });
VenueBookingSchema.index({ user_id: 1 });

export default mongoose.model('VenueBooking', VenueBookingSchema, 'venueBookings');