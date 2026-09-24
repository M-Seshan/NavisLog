const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

const getDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive = '' } = req.query;
    const query = { role: 'driver' };
    if (search) query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (isActive !== '') query.isActive = isActive === 'true';

    const total = await User.countDocuments(query);
    const drivers = await User.find(query)
      .populate('assignedVehicle', 'make model licensePlate status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDriver = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id).populate('assignedVehicle', 'make model licensePlate status type');
    if (!driver || driver.role !== 'driver') return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDriver = async (req, res) => {
  try {
    const { fullName, email, password, phone, address, licenseNumber, licenseExpiry } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const driver = await User.create({ fullName, email: email.toLowerCase(), password, role: 'driver', phone, address, licenseNumber, licenseExpiry });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map((a) => ({
      recipient: a._id,
      type: 'driver_registered',
      title: 'New Driver Created',
      message: `Admin created driver account for ${driver.fullName}.`,
      relatedEntity: driver._id,
      relatedEntityType: 'User',
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { fullName, phone, address, licenseNumber, licenseExpiry, isActive } = req.body;
    const update = { fullName, phone, address, licenseNumber, licenseExpiry, isActive };
    if (req.file) update.profilePhoto = `/uploads/${req.file.filename}`;
    const driver = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('assignedVehicle', 'make model licensePlate');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ success: false, message: 'Driver not found' });
    if (driver.assignedVehicle) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicle, { assignedDriver: null });
    }
    await driver.deleteOne();
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleDriverStatus = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ success: false, message: 'Driver not found' });
    driver.isActive = !driver.isActive;
    await driver.save();
    res.json({ success: true, driver, message: `Driver ${driver.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDrivers, getDriver, createDriver, updateDriver, deleteDriver, toggleDriverStatus };
