const DispatchAgent = require('../agents/DispatchAgent');
const MaintenanceAgent = require('../agents/MaintenanceAgent');
const AuditAgent = require('../agents/AuditAgent');
const AgentMemory = require('../models/AgentMemory');

const runAgent = async (req, res) => {
  const { agentType } = req.params;
  const inputData = req.body || {};

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  let agent;
  try {
    switch (agentType) {
      case 'dispatch':
        agent = new DispatchAgent();
        break;
      case 'maintenance':
        agent = new MaintenanceAgent();
        break;
      case 'audit':
        agent = new AuditAgent();
        break;
      default:
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Unknown agent type' })}\n\n`);
        return res.end();
    }

    agent.setSSE(res);
    await agent.run(inputData, req.user._id);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
  } finally {
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

const getAgentHistory = async (req, res) => {
  try {
    const { agentType, page = 1, limit = 10 } = req.query;
    const query = agentType ? { agentType } : {};
    const total = await AgentMemory.countDocuments(query);
    const sessions = await AgentMemory.find(query)
      .populate('triggeredBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, sessions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAgentSession = async (req, res) => {
  try {
    const session = await AgentMemory.findById(req.params.id).populate('triggeredBy', 'fullName email');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { runAgent, getAgentHistory, getAgentSession };
