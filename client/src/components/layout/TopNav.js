import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMuted, toggleAudio, subscribeAudioChange, playHoverSound, playClickSound } from '../../utils/audioSynth';

export default function TopNav({ title, onMenuClick, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [audioMuted, setAudioMuted] = useState(isMuted());
  const [timeStr, setTimeStr] = useState('');
  const dropdownRef = useRef(null);

  const profilePath = user?.role === 'admin' ? '/admin/profile' : '/driver/profile';
  const notifPath = user?.role === 'admin' ? '/admin/notifications' : '/driver/notifications';

  // Digital Mission Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC' + (now.getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(now.getTimezoneOffset() / 60));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio mute subscription
  useEffect(() => {
    return subscribeAudioChange((muted) => setAudioMuted(muted));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        .topnav-tactical {
          height: 64px;
          background: rgba(3, 9, 20, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 240, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .topnav-btn-tactical {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 1px solid rgba(0, 240, 255, 0.2);
          background: rgba(5, 14, 28, 0.6);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .topnav-btn-tactical:hover {
          color: #00f0ff;
          border-color: #00f0ff;
          background: rgba(0, 240, 255, 0.12);
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .hud-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 4px;
          background: rgba(0, 255, 157, 0.08);
          border: 1px solid rgba(0, 255, 157, 0.35);
          color: #00ff9d;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
      `}</style>

      <header className="topnav-tactical">
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => { playClickSound(); if (onMenuClick) onMenuClick(); }}
            onMouseEnter={playHoverSound}
            className="topnav-btn-tactical"
            style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}
            aria-label="Open Navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#f1f8ff',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {title || 'FLEET COMMAND'}
              </h2>
              <span className="hud-status-chip" style={{ display: window.innerWidth > 900 ? 'inline-flex' : 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 6px #00ff9d' }} />
                OPERATIONAL
              </span>
            </div>
          </div>
        </div>

        {/* Right: Digital Clock, Audio Mute Toggle, Notifications & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mission Digital Clock */}
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px',
              color: '#38bdf8',
              letterSpacing: '1px',
              display: window.innerWidth > 640 ? 'block' : 'none',
              padding: '4px 10px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '4px',
            }}
          >
            SYS TIME: {timeStr}
          </div>

          {/* Web Audio Mute / Unmute Toggle */}
          <button
            onClick={() => { toggleAudio(); }}
            onMouseEnter={playHoverSound}
            className="topnav-btn-tactical"
            title={audioMuted ? 'Unmute Tactical Audio' : 'Mute Tactical Audio'}
          >
            {audioMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Notifications Beacon */}
          <button
            onClick={() => { playClickSound(); navigate(notifPath); }}
            onMouseEnter={playHoverSound}
            className="topnav-btn-tactical"
            title="Alert Beacons"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ff003c',
                  boxShadow: '0 0 8px #ff003c',
                }}
              />
            )}
          </button>

          {/* User Command Avatar Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => { playClickSound(); setShowProfile(!showProfile); }}
              onMouseEnter={playHoverSound}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                background: 'rgba(5, 14, 28, 0.7)',
                color: '#f1f8ff',
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #00f0ff, #0066ff)',
                  color: '#02050e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 11,
                }}
              >
                {user?.fullName?.charAt(0) || 'C'}
              </div>
              <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>
                {user?.fullName?.split(' ')[0] || 'Operator'}
              </span>
            </button>

            {showProfile && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 220,
                  background: 'rgba(5, 14, 28, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 240, 255, 0.15)',
                  padding: '12px',
                  zIndex: 999,
                }}
              >
                <div style={{ padding: '6px 8px 10px', borderBottom: '1px solid rgba(0, 240, 255, 0.15)' }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#f1f8ff', fontSize: '14px' }}>
                    {user?.fullName}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d' }}>
                    {user?.role?.toUpperCase()} CREDENTIALS
                  </div>
                </div>

                <div style={{ padding: '8px 0' }}>
                  <button
                    onClick={() => { playClickSound(); setShowProfile(false); navigate(profilePath); }}
                    onMouseEnter={playHoverSound}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>👤</span> View Tactical Profile
                  </button>

                  <button
                    onClick={() => { playClickSound(); setShowProfile(false); logout(); navigate('/login'); }}
                    onMouseEnter={playHoverSound}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff003c',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>⚡</span> Disengage Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}