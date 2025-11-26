import mongoose from 'mongoose';

const VenueSchema = new mongoose.Schema({
  venue_type: { 
    type: String, 
    required: true 
  },
  venue_unit: { 
    type: String, 
    required: true,
    unique: true 
  },
  venue_fixed_equipment: [String],
  venue_access_right: [{ 
    type: String,
    enum: [
      'ATL_ADMIN',
      'ATL_Member_HKU_Staff',
      'ATL_Member_HKU_Student',
      'ATL_Member_General',
      'Non_ATL_HKU_Staff'
    ]
  }],
  venue_capacity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  venue_desc: String,
  venue_status: { 
    type: String, 
    enum: ['available', 'maintenance', 'out_of_order'],
    default: 'available'
  },
  venue_hourly_rate: { 
    type: Number, 
    required: true,
    min: 0 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
VenueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Venue', VenueSchema, 'venues');