const Telemetry = require('../models/Telemetry');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const getTelemetry = async (req, res) => {
  try {
    const { vehicleId, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'driver') {
      const user = await User.findById(req.user._id);
      if (!user.assignedVehicle) return res.json({ success: true, telemetry: [] });
      query.vehicle = user.assignedVehicle;
    } else if (vehicleId) {
      query.vehicle = vehicleId;
    }

    const telemetry = await Telemetry.find(query)
      .populate('vehicle', 'make model licensePlate')
      .populate('driver', 'fullName')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, telemetry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLatestTelemetry = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).select('_id make model licensePlate status');
    const result = [];
    for (const v of vehicles) {
      const latest = await Telemetry.findOne({ vehicle: v._id }).sort({ timestamp: -1 }).populate('driver', 'fullName');
      result.push({ vehicle: v, telemetry: latest || null });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitTelemetry = async (req, res) => {
  try {
    const {
      vehicle,
      speed,
      odometer,
      fuelLevel,
      engineTemp,
      latitude,
      longitude,
      heading,
      engineStatus,
      rpm,
      batteryVoltage
    } = req.body;

    let vehicleId = vehicle;

    // Driver → always use assigned vehicle
    if (req.user.role === 'driver') {
      const user = await User.findById(req.user._id).populate('assignedVehicle');

      if (!user || !user.assignedVehicle) {
        return res.status(400).json({
          success: false,
          message: 'No vehicle assigned to this driver'
        });
      }

      vehicleId = user.assignedVehicle._id;
    }

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle required'
      });
    }

    const vehicleDoc = await Vehicle.findById(vehicleId);

    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Validate GPS coordinates if provided
    if (
      latitude !== undefined &&
      latitude !== null &&
      (latitude < -90 || latitude > 90)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude'
      });
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      (longitude < -180 || longitude > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude'
      });
    }

    const entry = await Telemetry.create({
      vehicle: vehicleId,
      driver: req.user._id,

      speed: speed !== undefined ? Number(speed) : 0,

      // GPS tracking doesn't require odometer
      odometer:
        odometer !== undefined && odometer !== null && odometer !== ''
          ? Number(odometer)
          : vehicleDoc.currentOdometer || 0,

      fuelLevel:
        fuelLevel !== undefined && fuelLevel !== null
          ? Number(fuelLevel)
          : null,

      engineTemp:
        engineTemp !== undefined && engineTemp !== null
          ? Number(engineTemp)
          : null,

      latitude:
        latitude !== undefined && latitude !== null
          ? Number(latitude)
          : null,

      longitude:
        longitude !== undefined && longitude !== null
          ? Number(longitude)
          : null,

      heading:
        heading !== undefined && heading !== null
          ? Number(heading)
          : null,

      engineStatus: engineStatus || 'on',

      rpm:
        rpm !== undefined && rpm !== null
          ? Number(rpm)
          : null,

      batteryVoltage:
        batteryVoltage !== undefined && batteryVoltage !== null
          ? Number(batteryVoltage)
          : null,

      timestamp: new Date()
    });

    // Update vehicle odometer only when actual odometer is supplied
    if (
      odometer !== undefined &&
      odometer !== null &&
      odometer !== ''
    ) {
      const newOdometer = Number(odometer);

      if (newOdometer > vehicleDoc.currentOdometer) {
        await Vehicle.findByIdAndUpdate(vehicleId, {
          currentOdometer: newOdometer
        });
      }
    }

    res.status(201).json({
      success: true,
      telemetry: entry
    });

  } catch (err) {
    console.error('TELEMETRY ERROR:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const submitPhoneGPS = async (req, res) => {
  try {
    const {
      driverId,
      latitude,
      longitude,
      speed,
      heading
    } = req.body;

    // Basic validation
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'driverId required'
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required'
      });
    }

    // Find driver
    const driver = await User.findById(driverId).populate('assignedVehicle');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check assigned vehicle
    if (!driver.assignedVehicle) {
      return res.status(400).json({
        success: false,
        message: 'No vehicle assigned to this driver'
      });
    }

    // Validate GPS
    if (
      Number(latitude) < -90 ||
      Number(latitude) > 90
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude'
      });
    }

    if (
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude'
      });
    }

    // Save telemetry
    const entry = await Telemetry.create({
      vehicle: driver.assignedVehicle._id,
      driver: driver._id,

      speed:
        speed !== undefined && speed !== null
          ? Number(speed)
          : 0,

      odometer: driver.assignedVehicle.currentOdometer || 0,

      latitude: Number(latitude),
      longitude: Number(longitude),

      heading:
        heading !== undefined && heading !== null
          ? Number(heading)
          : null,

      engineStatus: 'on',

      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Phone GPS received',
      telemetry: entry
    });

  } catch (err) {
    console.error('PHONE GPS ERROR:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  getTelemetry,
  getLatestTelemetry,
  submitTelemetry,
  submitPhoneGPS
};