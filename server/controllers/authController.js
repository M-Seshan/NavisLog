const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const register = async (req, res) => {
  try {
    const { fullName, email, password, role, phone, address } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ fullName, email: email.toLowerCase(), password, role: role || 'driver', phone, address });

    // Notify all admins of new driver registration
    if (user.role === 'driver') {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        type: 'driver_registered',
        title: 'New Driver Registered',
        message: `${user.fullName} has registered as a new driver.`,
        relatedEntity: user._id,
        relatedEntityType: 'User',
        priority: 'normal',
      }));
      if (notifications.length) await Notification.insertMany(notifications);
    }

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, phone: user.phone, address: user.address, profilePhoto: user.profilePhoto },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, phone: user.phone, address: user.address, profilePhoto: user.profilePhoto, assignedVehicle: user.assignedVehicle },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedVehicle', 'make model licensePlate status');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const update = { fullName, phone, address };
    if (req.file) update.profilePhoto = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
