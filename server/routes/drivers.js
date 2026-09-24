const express = require('express');
const router = express.Router();
const { getDrivers, getDriver, createDriver, updateDriver, deleteDriver, toggleDriverStatus } = require('../controllers/driverController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, adminOnly, getDrivers);
router.get('/:id', protect, adminOnly, getDriver);
router.post('/', protect, adminOnly, upload.single('profilePhoto'), createDriver);
router.put('/:id', protect, adminOnly, upload.single('profilePhoto'), updateDriver);
router.delete('/:id', protect, adminOnly, deleteDriver);
router.put('/:id/toggle-status', protect, adminOnly, toggleDriverStatus);

module.exports = router;
