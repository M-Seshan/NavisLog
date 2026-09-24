const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['fuel_submitted', 'maintenance_reported', 'ai_alert', 'vehicle_assigned', 'driver_registered', 'system', 'maintenance_resolved'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedEntity: { type: mongoose.Schema.Types.ObjectId, default: null },
  relatedEntityType: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
