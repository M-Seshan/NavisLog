const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;
    const query = {};
    if (search) query.$or = [
      { make: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { licensePlate: { $regex: search, $options: 'i' } },
    ];
    if (status) query.status = status;
    if (type) query.type = type;

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('assignedDriver', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, vehicles, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('assignedDriver', 'fullName email phone');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const vehicle = await Vehicle.create(data);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('assignedDriver', 'fullName email');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (vehicle.assignedDriver) {
      await User.findByIdAndUpdate(vehicle.assignedDriver, { assignedVehicle: null });
    }
    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Unassign previous driver
    if (vehicle.assignedDriver) {
      await User.findByIdAndUpdate(vehicle.assignedDriver, { assignedVehicle: null });
    }

    // Unassign from any other vehicle the new driver was on
    if (driverId) {
      await Vehicle.updateMany({ assignedDriver: driverId }, { assignedDriver: null });
      await User.findByIdAndUpdate(driverId, { assignedVehicle: vehicle._id });
    }

    vehicle.assignedDriver = driverId || null;
    await vehicle.save();

    // Notify driver
    if (driverId) {
      await Notification.create({
        recipient: driverId,
        type: 'vehicle_assigned',
        title: 'Vehicle Assigned',
        message: `You have been assigned to ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}).`,
        relatedEntity: vehicle._id,
        relatedEntityType: 'Vehicle',
      });
    }

    const updated = await Vehicle.findById(vehicle._id).populate('assignedDriver', 'fullName email phone');
    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVehicleStats = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const active = await Vehicle.countDocuments({ status: 'active' });
    const maintenance = await Vehicle.countDocuments({ status: 'maintenance' });
    const inactive = await Vehicle.countDocuments({ status: 'inactive' });
    res.json({ success: true, stats: { total, active, maintenance, inactive } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, assignDriver, getVehicleStats };
