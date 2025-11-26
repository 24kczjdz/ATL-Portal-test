import mongoose from 'mongoose';

const EquipmentSchema = new mongoose.Schema({
  eqm_name: { 
    type: String, 
    required: true 
  },
  eqm_cat: { 
    type: String, 
    required: true 
  },
  eqm_type: { 
    type: String, 
    required: true 
  },
  eqm_access_right: [{ 
    type: String,
    enum: [
      'ATL_ADMIN',
      'ATL_Member_HKU_Staff',
      'ATL_Member_HKU_Student',
      'ATL_Member_General',
      'Non_ATL_HKU_Staff'
    ]
  }],
  eqm_status: { 
    type: String, 
    enum: ['available', 'maintenance', 'out_of_order'],
    default: 'available'
  },
  eqm_description: String,
  location: String,
  serial_number: String,
  warranty_end: Object,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
EquipmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Equipment', EquipmentSchema, 'equipment');