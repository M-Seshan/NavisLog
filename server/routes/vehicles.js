const express = require('express');
const router = express.Router();
const { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, assignDriver, getVehicleStats } = require('../controllers/vehicleController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', protect, adminOnly, getVehicleStats);
router.get('/', protect, getVehicles);
router.get('/:id', protect, getVehicle);
router.post('/', protect, adminOnly, upload.single('image'), createVehicle);
router.put('/:id', protect, adminOnly, upload.single('image'), updateVehicle);
router.delete('/:id', protect, adminOnly, deleteVehicle);
router.put('/:id/assign-driver', protect, adminOnly, assignDriver);

module.exports = router;
