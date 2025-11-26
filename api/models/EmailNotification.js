import mongoose from 'mongoose';

const EmailNotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true
  },
  record_id: {
    type: String,
    required: true
  },
  record_type: {
    type: String,
    required: true,
    enum: ['booking', 'project', 'sig']
  },
  action_type: {
    type: String,
    required: true,
    enum: ['status_change', 'created', 'updated', 'deleted']
  },
  old_status: {
    type: String
  },
  new_status: {
    type: String
  },
  recipient_email: {
    type: String,
    required: true
  },
  recipient_type: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  template_used: {
    type: String,
    ref: 'EmailTemplate'
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  error_message: {
    type: String
  },
  additional_data: {
    type: mongoose.Schema.Types.Mixed
  }
});

EmailNotificationSchema.index({ record_id: 1, record_type: 1 });
EmailNotificationSchema.index({ recipient_email: 1 });
EmailNotificationSchema.index({ sent_at: 1 });
EmailNotificationSchema.index({ status: 1 });

export default mongoose.model('EmailNotification', EmailNotificationSchema, 'emailNotifications');