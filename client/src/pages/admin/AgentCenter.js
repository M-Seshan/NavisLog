import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playLockSound, playActionConfirm } from '../../utils/audioSynth';

const AGENTS = [
  { id: 'dispatch', name: 'DISPATCH CORE AGENT', icon: '🚚', code: 'AGT-01', desc: 'Analyzes fleet status, driver assignments, and active trips to optimize dispatch operations.' },
  { id: 'maintenance', name: 'DIAGNOSTIC CORE AGENT', icon: '🔧', code: 'AGT-02', desc: 'Reviews open maintenance issues, severity levels, and service schedules to generate repair recommendations.' },
  { id: 'audit', name: 'ENERGY AUDIT AGENT', icon: '📊', code: 'AGT-03', desc: 'Audits fuel ledger entries for anomalies, price spikes, type mismatches, and spending trends.' },
];

export default function AgentCenter() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const terminalRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    API.get('/agents/history?limit=10')
      .then(({ data }) => setHistory(data.sessions || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const runAgent = (agentId) => {
    playLockSound();
    setActiveAgent(agentId);
    setLines([]);
    setResult(null);
    setRunning(true);

    const token = localStorage.getItem('navislog_token');
    const controller = new AbortController();

    fetch(`/api/agents/run/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
      signal: controller.signal,
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === 'reasoning') {
              setLines((prev) => [...prev, { type: 'step', text: `[${msg.step}] ${msg.thought}` }]);
            } else if (msg.type === 'complete') {
              playActionConfirm();
              setResult({ decision: msg.decision, recommendation: msg.recommendation, confidence: msg.confidence });
              setLines((prev) => [...prev, { type: 'complete', text: `✓ DECISION MATRIX: ${msg.decision}` }]);
            } else if (msg.type === 'error') {
              setLines((prev) => [...prev, { type: 'error', text: `✕ REASONING ERROR: ${msg.message}` }]);
            } else if (msg.type === 'end') {
              setRunning(false);
              API.get('/agents/history?limit=10').then(({ data }) => setHistory(data.sessions || [])).catch(() => {});
            }
          } catch {}
        }
      }
      setRunning(false);
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        toast.error('Failed to connect to agent neural node');
        setRunning(false);
      }
    });

    return () => controller.abort();
  };

  return (
    <AppLayout title="Navis AI — Fleet Intelligence" bgVariant="ai">
      <style>{`
        .agent-tactical-card {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 8px;
          padding: 22px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .agent-tactical-card:hover {
          transform: translateY(-3px);
          border-color: #00f0ff;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.25);
        }

        .agent-terminal-box {
          background: #020610;
          border: 1px solid rgba(0, 240, 255, 0.25);
          border-radius: 8px;
          padding: 18px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          height: 240px;
          overflow-y: auto;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
          line-height: 1.6;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● SYNAPTIC CORE // AUTONOMOUS REASONING ENGINE
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
          NAVIS AI — FLEET INTELLIGENCE MATRIX
        </h2>
      </div>

      {/* 3 Autonomous Agents Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="hud-bracket agent-tactical-card"
            onMouseEnter={playHoverSound}
            data-hud-label={agent.name}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d' }}>
                  {agent.code}
                </span>
                <span style={{ fontSize: '24px' }}>{agent.icon}</span>
              </div>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800', color: '#f1f8ff', margin: '0 0 8px 0' }}>
                {agent.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {agent.desc}
              </p>
            </div>

            <button
              onClick={() => { playClickSound(); runAgent(agent.id); }}
              disabled={running}
              onMouseEnter={playHoverSound}
              className={`btn ${activeAgent === agent.id && running ? 'btn-secondary' : 'btn-primary'}`}
              style={{ marginTop: '20px', width: '100%' }}
            >
              {activeAgent === agent.id && running ? 'PROCESSING REASONING...' : `INITIALIZE ${agent.code}`}
            </button>
          </div>
        ))}
      </div>

      {/* Active Agent Diagnostic Stream Terminal */}
      <div className="hud-bracket hud-glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: running ? '#00f0ff' : '#00ff9d', boxShadow: running ? '0 0 8px #00f0ff' : '0 0 8px #00ff9d' }} />
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
              {activeAgent ? `NEURAL EXECUTION: ${activeAgent.toUpperCase()}` : 'AI TELEMETRY STREAM CONSOLE'}
            </h3>
          </div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#38bdf8' }}>
            STATUS: {running ? 'STREAMING REASONING' : 'IDLE / READY'}
          </span>
        </div>

        <div className="agent-terminal-box" ref={terminalRef}>
          {lines.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: '60px 0' }}>
              &gt; SELECT AN AGENT ABOVE TO ENGAGE AUTONOMOUS FLEET REASONING...
            </div>
          ) : (
            lines.map((l, i) => (
              <div
                key={i}
                style={{
                  color: l.type === 'complete' ? '#00ff9d' : l.type === 'error' ? '#ff003c' : '#38bdf8',
                  marginBottom: 4,
                }}
              >
                {l.text}
              </div>
            ))
          )}
          {running && (
            <div style={{ color: '#00f0ff', marginTop: 4 }}>
              &gt; GENERATING SYNAPTIC THOUGHT VECTOR<span style={{ animation: 'cursorBlink 0.8s infinite' }}>_</span>
            </div>
          )}
        </div>

        {/* Decision & Recommendation Result Display */}
        {result && (
          <div
            style={{
              marginTop: '18px',
              padding: '18px',
              borderRadius: '6px',
              background: 'rgba(0, 255, 157, 0.08)',
              border: '1px solid rgba(0, 255, 157, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: '800', color: '#00ff9d' }}>
                AUTONOMOUS FLEET DECISION: {result.decision?.toUpperCase()}
              </div>
              {result.confidence && (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#00f0ff' }}>
                  CONFIDENCE: {result.confidence}%
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {result.recommendation}
            </p>
          </div>
        )}
      </div>

      {/* Reasoning History */}
      <div className="hud-bracket hud-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
            HISTORICAL INTELLIGENCE SESSIONS
          </h3>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00ff9d' }}>
            // ARCHIVE
          </span>
        </div>

        {histLoading ? (
          <div style={{ color: '#00f0ff', textAlign: 'center', padding: '30px', fontFamily: "'Share Tech Mono', monospace" }}>
            QUERYING NEURAL ARCHIVE...
          </div>
        ) : history.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '30px', fontFamily: "'Share Tech Mono', monospace" }}>
            NO PAST AGENT SESSIONS RECORDED.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((s) => (
              <div
                key={s._id}
                style={{
                  background: 'rgba(2, 6, 16, 0.65)',
                  border: '1px solid rgba(0, 240, 255, 0.12)',
                  borderRadius: 6,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <strong style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: '#f1f8ff' }}>
                    {s.agentType?.toUpperCase()} AGENT
                  </strong>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.decision}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success">COMPLETED</span>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}