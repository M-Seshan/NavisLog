const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getMaintenanceRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicleId = '', severity = '', status = '' } = req.query;
    const query = {};
    if (req.user.role === 'driver') query.reportedBy = req.user._id;
    else {
      if (vehicleId) query.vehicle = vehicleId;
    }
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const total = await Maintenance.countDocuments(query);
    const records = await Maintenance.find(query)
      .populate('vehicle', 'make model licensePlate')
      .populate('reportedBy', 'fullName email')
      .populate('resolvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('vehicle', 'make model licensePlate')
      .populate('reportedBy', 'fullName email')
      .populate('resolvedBy', 'fullName');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role === 'driver' && record.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createMaintenanceRecord = async (req, res) => {
  try {
    const { vehicle, issueType, description, currentOdometer, severity } = req.body;
    if (!vehicle || !issueType || !description || !currentOdometer || !severity) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    if (req.user.role === 'driver') {
      const userDoc = await User.findById(req.user._id);
      if (!userDoc.assignedVehicle || userDoc.assignedVehicle.toString() !== vehicle) {
        return res.status(403).json({ success: false, message: 'You can only report issues for your assigned vehicle' });
      }
    }

    const data = { vehicle, reportedBy: req.user._id, issueType, description, currentOdometer: parseFloat(currentOdometer), severity };
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    const record = await Maintenance.create(data);

    // Update vehicle status if critical or high
    if (severity === 'critical' || severity === 'high') {
      await Vehicle.findByIdAndUpdate(vehicle, { status: 'maintenance' });
    }

    // Notify admins
    const vehicleDoc = await Vehicle.findById(vehicle);
    const reporter = await User.findById(req.user._id);
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map((a) => ({
      recipient: a._id,
      type: 'maintenance_reported',
      title: `Maintenance Issue Reported (${severity.toUpperCase()})`,
      message: `${reporter.fullName} reported a ${issueType} issue on ${vehicleDoc.make} ${vehicleDoc.model}: ${description.substring(0, 80)}...`,
      relatedEntity: record._id,
      relatedEntityType: 'Maintenance',
      priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'normal',
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    const populated = await Maintenance.findById(record._id)
      .populate('vehicle', 'make model licensePlate')
      .populate('reportedBy', 'fullName email');

    res.status(201).json({ success: true, record: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    if (data.status === 'resolved' && record.status !== 'resolved') {
      data.resolvedAt = new Date();
      data.resolvedBy = req.user._id;
      // If resolved, set vehicle back to active if no other open critical/high issues
      const openCritical = await Maintenance.countDocuments({
        vehicle: record.vehicle, status: { $nin: ['resolved', 'deferred'] }, severity: { $in: ['critical', 'high'] },
        _id: { $ne: record._id },
      });
      if (openCritical === 0) {
        await Vehicle.findByIdAndUpdate(record.vehicle, { status: 'active', lastServiceDate: new Date() });
      }
      // Notify reporter
      await Notification.create({
        recipient: record.reportedBy,
        type: 'maintenance_resolved',
        title: 'Issue Resolved',
        message: `Your reported issue has been resolved. Notes: ${data.resolutionNotes || 'N/A'}`,
        relatedEntity: record._id,
        relatedEntityType: 'Maintenance',
      });
    }

    const updated = await Maintenance.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('vehicle', 'make model licensePlate')
      .populate('reportedBy', 'fullName email')
      .populate('resolvedBy', 'fullName');

    res.json({ success: true, record: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    await record.deleteOne();
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMaintenanceStats = async (req, res) => {
  try {
    const query = req.user.role === 'driver' ? { reportedBy: req.user._id } : {};
    const total = await Maintenance.countDocuments(query);
    const open = await Maintenance.countDocuments({ ...query, status: { $in: ['reported', 'acknowledged', 'in_progress'] } });
    const resolved = await Maintenance.countDocuments({ ...query, status: 'resolved' });
    const critical = await Maintenance.countDocuments({ ...query, severity: 'critical', status: { $ne: 'resolved' } });
    res.json({ success: true, stats: { total, open, resolved, critical } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMaintenanceRecords, getMaintenanceRecord, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, getMaintenanceStats };
