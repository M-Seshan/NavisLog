const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true, unique: true, trim: true, uppercase: true },
  vin: { type: String, trim: true, default: '' },
  type: {
    type: String,
    enum: ['truck', 'van', 'car', 'motorcycle', 'heavy_vehicle', 'other'],
    default: 'truck',
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'retired'],
    default: 'active',
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
    default: 'diesel',
  },
  currentOdometer: { type: Number, default: 0 },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  color: { type: String, default: '' },
  insuranceExpiry: { type: Date, default: null },
  registrationExpiry: { type: Date, default: null },
  lastServiceDate: { type: Date, default: null },
  nextServiceDue: { type: Number, default: null },
  notes: { type: String, default: '' },
  image: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
