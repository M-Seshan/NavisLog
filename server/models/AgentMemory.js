const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema({
  agentType: {
    type: String,
    enum: ['dispatch', 'maintenance', 'audit'],
    required: true,
  },
  sessionId: { type: String, required: true },
  reasoning: [
    {
      step: { type: String },
      thought: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  inputData: { type: mongoose.Schema.Types.Mixed, default: {} },
  decision: { type: String, default: '' },
  recommendation: { type: String, default: '' },
  confidence: { type: Number, default: 0 },
  relatedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  relatedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
