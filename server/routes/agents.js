const express = require('express');
const router = express.Router();
const { runAgent, getAgentHistory, getAgentSession } = require('../controllers/agentController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/history', protect, adminOnly, getAgentHistory);
router.get('/session/:id', protect, adminOnly, getAgentSession);
router.post('/run/:agentType', protect, adminOnly, runAgent);

module.exports = router;
