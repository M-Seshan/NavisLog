const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const FuelLedger = require('../models/FuelLedger');
const Maintenance = require('../models/Maintenance');
const Trip = require('../models/Trip');

const getDashboardStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: 'active' });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'maintenance' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const activeDrivers = await User.countDocuments({ role: 'driver', isActive: true });

    const fuelAggr = await FuelLedger.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$fuelCost' }, totalQty: { $sum: '$fuelQuantity' }, count: { $sum: 1 } } },
    ]);
    const fuelStats = fuelAggr[0] || { totalCost: 0, totalQty: 0, count: 0 };

    const openMaintenance = await Maintenance.countDocuments({ status: { $in: ['reported', 'acknowledged', 'in_progress'] } });
    const criticalMaintenance = await Maintenance.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } });

    // Monthly fuel cost for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyFuel = await FuelLedger.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, cost: { $sum: '$fuelCost' }, qty: { $sum: '$fuelQuantity' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Vehicle status distribution
    const vehiclesByStatus = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Recent activities
    const recentFuel = await FuelLedger.find().populate('vehicle', 'make model licensePlate').populate('driver', 'fullName').sort({ createdAt: -1 }).limit(5);
    const recentMaintenance = await Maintenance.find().populate('vehicle', 'make model licensePlate').populate('reportedBy', 'fullName').sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalVehicles, activeVehicles, maintenanceVehicles,
        totalDrivers, activeDrivers,
        fuelStats, openMaintenance, criticalMaintenance,
        monthlyFuel, vehiclesByStatus,
        recentFuel, recentMaintenance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVehicleReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const vehicles = await Vehicle.find().populate('assignedDriver', 'fullName email');
    const report = [];

    for (const v of vehicles) {
      const fuelQuery = { vehicle: v._id };
      if (startDate) fuelQuery.date = { $gte: new Date(startDate) };
      if (endDate) fuelQuery.date = { ...fuelQuery.date, $lte: new Date(endDate) };

      const fuelAggr = await FuelLedger.aggregate([
        { $match: fuelQuery },
        { $group: { _id: null, totalCost: { $sum: '$fuelCost' }, totalQty: { $sum: '$fuelQuantity' }, count: { $sum: 1 } } },
      ]);
      const maintenanceCount = await Maintenance.countDocuments({ vehicle: v._id });
      const tripCount = await Trip.countDocuments({ vehicle: v._id });

      report.push({
        vehicle: v,
        fuel: fuelAggr[0] || { totalCost: 0, totalQty: 0, count: 0 },
        maintenanceCount,
        tripCount,
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDriverReport = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).populate('assignedVehicle', 'make model licensePlate');
    const report = [];

    for (const d of drivers) {
      const fuelAggr = await FuelLedger.aggregate([
        { $match: { driver: d._id } },
        { $group: { _id: null, totalCost: { $sum: '$fuelCost' }, totalQty: { $sum: '$fuelQuantity' }, count: { $sum: 1 } } },
      ]);
      const maintenanceCount = await Maintenance.countDocuments({ reportedBy: d._id });
      const tripCount = await Trip.countDocuments({ driver: d._id });
      report.push({ driver: d, fuel: fuelAggr[0] || { totalCost: 0, totalQty: 0, count: 0 }, maintenanceCount, tripCount });
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getVehicleReport, getDriverReport };
