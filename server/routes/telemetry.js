// telemetry.js

const express = require('express');

const router = express.Router();

const {
  getTelemetry,
  getLatestTelemetry,
  submitTelemetry,
  submitPhoneGPS
} = require('../controllers/telemetryController');

const { protect, adminOnly } = require('../middleware/auth');

// Existing routes
router.get('/latest', protect, getLatestTelemetry);

router.get('/', protect, getTelemetry);

router.post('/', protect, submitTelemetry);

// Phone GPS route
router.post('/phone-gps', submitPhoneGPS);

module.exports = router;