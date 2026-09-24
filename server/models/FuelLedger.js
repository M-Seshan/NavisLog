const mongoose = require('mongoose');

const fuelLedgerSchema = new mongoose.Schema({
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
  fuelQuantity: { type: Number, required: true },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
    required: true,
  },
  fuelCost: { type: Number, required: true },
  fuelStation: { type: String, required: true, trim: true },
  odometer: { type: Number, required: true },
  receiptImage: { type: String, default: '' },
  date: { type: Date, required: true },
  notes: { type: String, default: '' },
  pricePerUnit: { type: Number, default: 0 },
  aiAnalyzed: { type: Boolean, default: false },
  aiFlag: { type: String, default: '' },
}, { timestamps: true });

fuelLedgerSchema.pre('save', function (next) {
  if (this.fuelQuantity > 0) {
    this.pricePerUnit = parseFloat((this.fuelCost / this.fuelQuantity).toFixed(4));
  }
  next();
});

module.exports = mongoose.model('FuelLedger', fuelLedgerSchema);
