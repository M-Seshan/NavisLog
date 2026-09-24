import React, { useEffect, useState, useRef } from 'react';
import { playHoverSound, playClickSound } from '../../utils/audioSynth';

export default function NavisCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [hoverText, setHoverText] = useState('');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const requestRef = useRef(null);
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Detect touch-only device
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const onMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setTargetPos({ x: e.clientX, y: e.clientY });

      // Check if hovering over interactive element
      const target = e.target;
      const interactiveEl = target.closest(
        'button, a, input, select, textarea, [role="button"], .card, .stat-card, .hud-interactive, .vehicle-card-glass, .nav-item-animated, .report-tab-btn, table tbody tr, .leaflet-marker-icon'
      );

      if (interactiveEl) {
        if (!isHovered) {
          setIsHovered(true);
          playHoverSound();
        }
        const dataLabel = interactiveEl.getAttribute('data-hud-label');
        setHoverText(dataLabel || '');
      } else {
        if (isHovered) {
          setIsHovered(false);
          setHoverText('');
        }
      }
    };

    const onMouseDown = () => {
      setIsClicked(true);
      playClickSound();
    };

    const onMouseUp = () => {
      setIsClicked(false);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Smooth Lerp animation for HUD ring
    const animate = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.22;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.22;
      setPosition({ x: posRef.current.x, y: posRef.current.y });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isHovered]);

  if (isTouchDevice) return null;

  return (
    <>
      <style>{`
        /* Hide native cursor for fine pointer devices */
        @media (hover: hover) and (pointer: fine) {
          body, a, button, input, select, textarea, [role="button"] {
            cursor: none !important;
          }
        }

        .navis-cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00f0ff;
          box-shadow: 0 0 8px #00f0ff, 0 0 16px rgba(0, 240, 255, 0.6);
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          transition: transform 0.08s ease, background-color 0.2s ease;
        }

        .navis-cursor-ring {
          position: fixed;
          top: 0;
          left: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(0, 240, 255, 0.45);
          pointer-events: none;
          z-index: 99998;
          transform: translate(-50%, -50%);
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.2s ease,
                      box-shadow 0.2s ease,
                      background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Rotating HUD scan arc */
        .navis-cursor-ring::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: #00ff9d;
          animation: cursorHudSpin 2.4s linear infinite;
        }

        /* Crosshair targeting ticks */
        .navis-cursor-ring::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1px dashed rgba(0, 240, 255, 0.3);
        }

        @keyframes cursorHudSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Hover Expansion State */
        .navis-cursor-ring.hovered {
          width: 54px;
          height: 54px;
          border-color: #00ff9d;
          background: rgba(0, 255, 157, 0.06);
          box-shadow: 0 0 20px rgba(0, 255, 157, 0.35), inset 0 0 10px rgba(0, 255, 157, 0.15);
        }

        .navis-cursor-dot.hovered {
          transform: translate(-50%, -50%) scale(1.6);
          background: #00ff9d;
          box-shadow: 0 0 12px #00ff9d;
        }

        /* Click State */
        .navis-cursor-ring.clicked {
          transform: translate(-50%, -50%) scale(0.75);
          border-color: #ffaa00;
          box-shadow: 0 0 25px rgba(255, 170, 0, 0.6);
        }

        /* Micro HUD target label below cursor */
        .navis-cursor-label {
          position: fixed;
          top: 0;
          left: 0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #00f0ff;
          letter-spacing: 1px;
          text-transform: uppercase;
          pointer-events: none;
          z-index: 99998;
          transform: translate(22px, 16px);
          white-space: nowrap;
          text-shadow: 0 0 6px rgba(0, 240, 255, 0.8);
          opacity: 0.85;
        }
      `}</style>

      {/* Target Reticle Dot (Instant) */}
      <div
        className={`navis-cursor-dot ${isHovered ? 'hovered' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ left: `${targetPos.x}px`, top: `${targetPos.y}px` }}
      />

      {/* Outer HUD Targeting Ring (Smoothed) */}
      <div
        className={`navis-cursor-ring ${isHovered ? 'hovered' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />

      {/* Optional micro label */}
      {hoverText && (
        <div
          className="navis-cursor-label"
          style={{ left: `${targetPos.x}px`, top: `${targetPos.y}px` }}
        >
          [{hoverText}]
        </div>
      )}
    </>
  );
}
