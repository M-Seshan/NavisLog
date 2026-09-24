const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  speed: { type: Number, default: 0 },
  odometer: { type: Number, required: true },
  fuelLevel: { type: Number, default: null },
  engineTemp: { type: Number, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  heading: { type: Number, default: null },
  engineStatus: { type: String, enum: ['on', 'off', 'idle'], default: 'off' },
  timestamp: { type: Date, default: Date.now },
  batteryVoltage: { type: Number, default: null },
  rpm: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Telemetry', telemetrySchema);
