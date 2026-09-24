const FuelLedger = require('../models/FuelLedger');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getFuelEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicleId = '', driverId = '', startDate = '', endDate = '' } = req.query;
    const query = {};

    if (req.user.role === 'driver') query.driver = req.user._id;
    else {
      if (vehicleId) query.vehicle = vehicleId;
      if (driverId) query.driver = driverId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await FuelLedger.countDocuments(query);
    const entries = await FuelLedger.find(query)
      .populate('vehicle', 'make model licensePlate')
      .populate('driver', 'fullName email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, entries, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFuelEntry = async (req, res) => {
  try {
    const entry = await FuelLedger.findById(req.params.id)
      .populate('vehicle', 'make model licensePlate')
      .populate('driver', 'fullName email');
    if (!entry) return res.status(404).json({ success: false, message: 'Fuel entry not found' });
    if (req.user.role === 'driver' && entry.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFuelEntry = async (req, res) => {
  try {
    const { vehicle, fuelQuantity, fuelType, fuelCost, fuelStation, odometer, date, notes } = req.body;
    if (!vehicle || !fuelQuantity || !fuelType || !fuelCost || !fuelStation || !odometer || !date) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    if (req.user.role === 'driver') {
      if (!req.user.assignedVehicle || req.user.assignedVehicle.toString() !== vehicle) {
        return res.status(403).json({ success: false, message: 'You can only log fuel for your assigned vehicle' });
      }
    }

    const entryData = {
      vehicle,
      driver: req.user._id,
      fuelQuantity: parseFloat(fuelQuantity),
      fuelType,
      fuelCost: parseFloat(fuelCost),
      fuelStation,
      odometer: parseFloat(odometer),
      date: new Date(date),
      notes,
    };
    if (req.file) entryData.receiptImage = `/uploads/${req.file.filename}`;

    const entry = await FuelLedger.create(entryData);

    // Update vehicle odometer
    if (parseFloat(odometer) > vehicleDoc.currentOdometer) {
      await Vehicle.findByIdAndUpdate(vehicle, { currentOdometer: parseFloat(odometer) });
    }

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    const driver = await User.findById(req.user._id);
    const notifications = admins.map((a) => ({
      recipient: a._id,
      type: 'fuel_submitted',
      title: 'Fuel Entry Submitted',
      message: `${driver.fullName} submitted a fuel entry for ${vehicleDoc.make} ${vehicleDoc.model} (${vehicleDoc.licensePlate}). Amount: ${fuelQuantity}L / $${fuelCost}`,
      relatedEntity: entry._id,
      relatedEntityType: 'FuelLedger',
      priority: 'normal',
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    const populated = await FuelLedger.findById(entry._id)
      .populate('vehicle', 'make model licensePlate')
      .populate('driver', 'fullName email');

    res.status(201).json({ success: true, entry: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFuelEntry = async (req, res) => {
  try {
    const entry = await FuelLedger.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (req.user.role === 'driver' && entry.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const data = { ...req.body };
    if (req.file) data.receiptImage = `/uploads/${req.file.filename}`;
    const updated = await FuelLedger.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('vehicle', 'make model licensePlate').populate('driver', 'fullName email');
    res.json({ success: true, entry: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFuelEntry = async (req, res) => {
  try {
    const entry = await FuelLedger.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (req.user.role === 'driver' && entry.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await entry.deleteOne();
    res.json({ success: true, message: 'Fuel entry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFuelStats = async (req, res) => {
  try {
    const query = req.user.role === 'driver' ? { driver: req.user._id } : {};
    const totalEntries = await FuelLedger.countDocuments(query);
    const aggr = await FuelLedger.aggregate([
      { $match: query },
      { $group: { _id: null, totalCost: { $sum: '$fuelCost' }, totalQuantity: { $sum: '$fuelQuantity' } } },
    ]);
    const stats = aggr[0] || { totalCost: 0, totalQuantity: 0 };
    res.json({ success: true, stats: { totalEntries, totalCost: stats.totalCost, totalQuantity: stats.totalQuantity } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFuelEntries, getFuelEntry, createFuelEntry, updateFuelEntry, deleteFuelEntry, getFuelStats };
