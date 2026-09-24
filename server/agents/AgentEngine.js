const AgentMemory = require('../models/AgentMemory');
const { v4: uuidv4 } = require('crypto');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Simple UUID via crypto
function generateSessionId() {
  const arr = new Uint8Array(16);
  for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

class AgentEngine {
  constructor(agentType) {
    this.agentType = agentType;
    this.sessionId = generateSessionId();
    this.memory = null;
    this.sseRes = null;
  }

  async initialize(inputData, triggeredBy) {
    this.memory = await AgentMemory.create({
      agentType: this.agentType,
      sessionId: this.sessionId,
      inputData,
      status: 'running',
      triggeredBy: triggeredBy || null,
      reasoning: [],
    });
    return this;
  }

  setSSE(res) {
    this.sseRes = res;
    return this;
  }

  async think(step, thought, delayMs = 800) {
    await sleep(delayMs);
    const entry = { step, thought, timestamp: new Date() };

    if (this.memory) {
      this.memory.reasoning.push(entry);
      await this.memory.save();
    }

    if (this.sseRes) {
      this.sseRes.write(`data: ${JSON.stringify({ type: 'reasoning', step, thought, sessionId: this.sessionId })}\n\n`);
    }
  }

  async complete(decision, recommendation, confidence = 85) {
    if (this.memory) {
      this.memory.decision = decision;
      this.memory.recommendation = recommendation;
      this.memory.confidence = confidence;
      this.memory.status = 'completed';
      await this.memory.save();
    }

    if (this.sseRes) {
      this.sseRes.write(`data: ${JSON.stringify({
        type: 'complete',
        decision,
        recommendation,
        confidence,
        sessionId: this.sessionId,
      })}\n\n`);
    }
  }

  async fail(error) {
    if (this.memory) {
      this.memory.status = 'failed';
      this.memory.decision = `Error: ${error}`;
      await this.memory.save();
    }

    if (this.sseRes) {
      this.sseRes.write(`data: ${JSON.stringify({ type: 'error', message: error, sessionId: this.sessionId })}\n\n`);
    }
  }
}

module.exports = AgentEngine;
