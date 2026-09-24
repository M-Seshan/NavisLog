import React, { useState, useEffect } from 'react';
import { playBootDrone, playClickSound, playActionConfirm } from '../../utils/audioSynth';

const DIAGNOSTIC_LINES = [
  'INITIALIZING FLEET CORE...',
  'VEHICLE NETWORK ........ ONLINE',
  'DRIVER NETWORK ......... ONLINE',
  'GPS TELEMETRY .......... ONLINE',
  'MISSION CONTROL ........ ONLINE',
  'FLEET AI ............... ONLINE',
  'DATABASE LINK .......... ONLINE',
  'SYSTEM STATUS: READY',
];

export default function NavisLogBootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    playBootDrone();

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < DIAGNOSTIC_LINES.length) {
        const nextLine = DIAGNOSTIC_LINES[currentIndex];
        setLines((prev) => [...prev, nextLine]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 220);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    playActionConfirm();
    setIsExiting(true);
    setTimeout(() => {
      sessionStorage.setItem('navislog_boot_done', 'true');
      if (onComplete) onComplete();
    }, 600);
  };

  const handleSkip = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => {
      sessionStorage.setItem('navislog_boot_done', 'true');
      if (onComplete) onComplete();
    }, 200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#02050e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f1f8ff',
        fontFamily: "'Share Tech Mono', monospace",
        overflow: 'hidden',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.08)' : 'scale(1)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes bootGlowPulse {
          0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 15px rgba(0, 240, 255, 0.5)); }
          50% { opacity: 1; filter: drop-shadow(0 0 35px rgba(0, 240, 255, 0.85)); }
        }

        @keyframes scanlineAnim {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }

        .boot-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 240, 255, 0.08) 50%, transparent 100%);
          animation: scanlineAnim 4s linear infinite;
          pointer-events: none;
        }

        .boot-btn-enter {
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 2px;
          color: #00f0ff;
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid #00f0ff;
          border-radius: 4px;
          padding: 14px 36px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.25), inset 0 0 15px rgba(0, 240, 255, 0.1);
          text-transform: uppercase;
        }

        .boot-btn-enter:hover {
          background: #00f0ff;
          color: #02050e;
          box-shadow: 0 0 45px rgba(0, 240, 255, 0.8);
          transform: translateY(-2px);
        }

        .boot-skip-btn {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          transition: color 0.2s ease;
          margin-top: 16px;
        }

        .boot-skip-btn:hover {
          color: #94a3b8;
        }
      `}</style>

      {/* Atmospheric Scanline */}
      <div className="boot-scanline" />

      {/* Outer Tactical Reticle Frame */}
      <div
        style={{
          position: 'relative',
          width: '92%',
          maxWidth: '680px',
          padding: '44px 36px',
          background: 'rgba(5, 12, 24, 0.75)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '8px',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(0, 240, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Chamfer HUD Corner Brackets */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 18, height: 18, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
        <div style={{ position: 'absolute', top: -1, right: -1, width: 18, height: 18, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 18, height: 18, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />

        {/* Top Protocol Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 255, 157, 0.4)',
            background: 'rgba(0, 255, 157, 0.08)',
            color: '#00ff9d',
            fontSize: '11px',
            letterSpacing: '2px',
            marginBottom: '20px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 6px #00ff9d' }} />
          AUTONOMOUS SPATIAL COMMAND V2.1
        </div>

        {/* Brand Header */}
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 900,
            letterSpacing: '6px',
            margin: 0,
            lineHeight: 1.1,
            animation: 'bootGlowPulse 3s ease-in-out infinite',
          }}
        >
          <span style={{ color: '#f1f8ff' }}>NAVIS</span>
          <span style={{ color: '#00f0ff', textShadow: '0 0 20px #00f0ff' }}>LOG</span>
        </h1>

        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginTop: '8px',
            marginBottom: '32px',
          }}
        >
          AUTONOMOUS FLEET OPERATIONS SYSTEM
        </div>

        {/* Diagnostic Terminal Lines */}
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            minHeight: '180px',
            background: 'rgba(2, 6, 16, 0.85)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            borderRadius: '4px',
            padding: '16px 20px',
            textAlign: 'left',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#94a3b8',
            marginBottom: '32px',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
          }}
        >
          {lines.map((line, i) => {
            const isDone = line.includes('ONLINE') || line.includes('READY');
            return (
              <div key={i} style={{ color: isDone ? '#00ff9d' : '#38bdf8' }}>
                <span style={{ color: '#64748b', marginRight: '6px' }}>&gt;</span>
                {line}
              </div>
            );
          })}
          {!isReady && (
            <span style={{ display: 'inline-block', width: '8px', height: '14px', background: '#00f0ff', marginLeft: '4px', verticalAlign: 'middle', animation: 'cursorBlink 0.8s infinite' }} />
          )}
        </div>

        {/* Enter CTA / Action Button */}
        {isReady ? (
          <button className="boot-btn-enter" onClick={handleEnter}>
            [ ENTER FLEET COMMAND ]
          </button>
        ) : (
          <div style={{ height: '48px', display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '12px' }}>
            INITIALIZING CORE MATRIX...
          </div>
        )}

        <button className="boot-skip-btn" onClick={handleSkip}>
          [ SKIP INITIALIZATION &gt; ]
        </button>
      </div>
    </div>
  );
}
