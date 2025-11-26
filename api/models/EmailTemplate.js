import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema({
  template_id: {
    type: String,
    required: true,
    unique: true
  },
  template_name: {
    type: String,
    required: true
  },
  template_type: {
    type: String,
    required: true,
    enum: ['booking_status', 'project_status', 'sig_status']
  },
  recipient_type: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  subject: {
    type: String,
    required: true
  },
  html_content: {
    type: String,
    required: true
  },
  variables: [{
    type: String
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

EmailTemplateSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

EmailTemplateSchema.index({ template_type: 1, recipient_type: 1 });
EmailTemplateSchema.index({ is_active: 1 });

export default mongoose.model('EmailTemplate', EmailTemplateSchema, 'emailTemplates');