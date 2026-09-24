const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issueType: {
    type: String,
    enum: ['engine', 'brakes', 'tires', 'electrical', 'transmission', 'fuel_system', 'body_damage', 'ac_heating', 'other'],
    required: true,
  },
  description: { type: String, required: true },
  currentOdometer: { type: Number, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'deferred'],
    default: 'reported',
  },
  image: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolutionNotes: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  aiAnalyzed: { type: Boolean, default: false },
  aiRecommendation: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
