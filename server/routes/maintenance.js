const express = require('express');
const router = express.Router();
const { getMaintenanceRecords, getMaintenanceRecord, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, getMaintenanceStats } = require('../controllers/maintenanceController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', protect, getMaintenanceStats);
router.get('/', protect, getMaintenanceRecords);
router.get('/:id', protect, getMaintenanceRecord);
router.post('/', protect, upload.single('image'), createMaintenanceRecord);
router.put('/:id', protect, adminOnly, upload.single('image'), updateMaintenanceRecord);
router.delete('/:id', protect, adminOnly, deleteMaintenanceRecord);

module.exports = router;
