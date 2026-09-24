const express = require('express');
const router = express.Router();
const { getDashboardStats, getVehicleReport, getDriverReport } = require('../controllers/reportsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/vehicles', protect, adminOnly, getVehicleReport);
router.get('/drivers', protect, adminOnly, getDriverReport);

module.exports = router;
