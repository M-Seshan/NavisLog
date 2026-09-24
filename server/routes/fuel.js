const express = require('express');
const router = express.Router();
const { getFuelEntries, getFuelEntry, createFuelEntry, updateFuelEntry, deleteFuelEntry, getFuelStats } = require('../controllers/fuelController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', protect, getFuelStats);
router.get('/', protect, getFuelEntries);
router.get('/:id', protect, getFuelEntry);
router.post('/', protect, upload.single('receiptImage'), createFuelEntry);
router.put('/:id', protect, upload.single('receiptImage'), updateFuelEntry);
router.delete('/:id', protect, deleteFuelEntry);

module.exports = router;
