import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { playHoverSound, playClickSound } from '../../utils/audioSynth';

const Icon = ({ name }) => {
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    vehicles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
    drivers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    fuel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V6l9-4 9 4v16"/><path d="M12 7v8"/><path d="M8 7h8"/></svg>,
    maintenance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    tracking: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
    ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 8v4l3 3"/></svg>,
    reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    notifications: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    route: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
    issue: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    trips: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name] || null;
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await API.get('/notifications?isRead=false&limit=1');
        setUnread(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminNav = [
    { code: '01', label: 'Fleet Command', icon: 'dashboard', path: '/admin/dashboard' },
    { code: '02', label: 'Vehicle Hangar', icon: 'vehicles', path: '/admin/vehicles' },
    { code: '03', label: 'Driver Network', icon: 'drivers', path: '/admin/drivers' },
    { code: '04', label: 'Mission Control', icon: 'trips', path: '/admin/trips' },
    { code: '05', label: 'Tactical Map', icon: 'tracking', path: '/admin/tracking' },
    { code: '06', label: 'Energy System', icon: 'fuel', path: '/admin/fuel' },
    { code: '07', label: 'Maintenance Core', icon: 'maintenance', path: '/admin/maintenance' },
    { code: '08', label: 'Navis AI Agent', icon: 'ai', path: '/admin/agents' },
    { code: '09', label: 'Intelligence Reports', icon: 'reports', path: '/admin/reports' },
    { code: '10', label: 'Alert Beacons', icon: 'notifications', path: '/admin/notifications', badge: unread },
    { code: '11', label: 'Command Profile', icon: 'profile', path: '/admin/profile' },
  ];

  const driverNav = [
    { code: '01', label: 'Pilot Cockpit', icon: 'dashboard', path: '/driver/dashboard' },
    { code: '02', label: 'Assigned Vehicle', icon: 'vehicles', path: '/driver/vehicle' },
    { code: '03', label: 'Mission Route', icon: 'route', path: '/driver/route' },
    { code: '04', label: 'Energy Entry', icon: 'fuel', path: '/driver/fuel' },
    { code: '05', label: 'Telemetry Link', icon: 'tracking', path: '/driver/telemetry' },
    { code: '06', label: 'Diagnostic Issue', icon: 'issue', path: '/driver/report-issue' },
    { code: '07', label: 'Flight Logs', icon: 'trips', path: '/driver/trips' },
    { code: '08', label: 'AI Beacons', icon: 'notifications', path: '/driver/notifications', badge: unread },
    { code: '09', label: 'Pilot Profile', icon: 'profile', path: '/driver/profile' },
  ];

  const navItems = user?.role === 'admin' ? adminNav : driverNav;

  const handleLogout = () => {
    playClickSound();
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>{`
        .sidebar-tactical-dock {
          width: 260px;
          height: 100vh;
          background: rgba(3, 9, 20, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0, 240, 255, 0.15);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 10px 0 35px rgba(0, 0, 0, 0.7);
        }

        .nav-item-tactical {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 9px 14px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #94a3b8;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          text-align: left;
          margin-bottom: 3px;
        }

        .nav-item-tactical:hover {
          color: #f1f8ff;
          background: rgba(0, 240, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.25);
          padding-left: 18px;
        }

        .nav-item-tactical.active {
          color: #00f0ff;
          font-weight: 700;
          background: linear-gradient(90deg, rgba(0, 240, 255, 0.18) 0%, rgba(0, 240, 255, 0.02) 100%);
          border: 1px solid rgba(0, 240, 255, 0.4);
          border-left: 3px solid #00f0ff;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
        }

        .nav-item-tactical svg {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          color: inherit;
        }

        .nav-code {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #475569;
          letter-spacing: 0.5px;
        }
        .nav-item-tactical.active .nav-code {
          color: #00ff9d;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 240, 255, 0.2);
        }
      `}</style>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 5, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99,
          }}
        />
      )}

      <aside
        className="sidebar-tactical-dock"
        style={{
          transform: isOpen || window.innerWidth > 768 ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Brand Crest Header */}
        <div
          style={{
            padding: '22px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
            background: 'rgba(2, 6, 16, 0.6)',
          }}
        >
          {/* Hexagon Tactical Icon */}
          <div
            style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #00f0ff 0%, #0066ff 100%)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#02050e',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.6)',
            }}
          >
            N
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '1px',
                color: '#f1f8ff',
              }}
            >
              NAVIS<span style={{ color: '#00f0ff' }}>LOG</span>
            </h1>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9,
                color: '#00ff9d',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              ● FLEET COMMAND CORE
            </div>
          </div>
        </div>

        {/* Tactical Station Selector */}
        <nav
          className="sidebar-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 10px',
          }}
        >
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              padding: '0 8px 10px 8px',
            }}
          >
            // COMMAND STATIONS
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-item-tactical ${isActive ? 'active' : ''}`}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  navigate(item.path);
                  if (onClose) onClose();
                }}
              >
                <span className="nav-code">{item.code}</span>
                <Icon name={item.icon} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(255, 0, 60, 0.25)',
                      color: '#ff003c',
                      border: '1px solid #ff003c',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '10px',
                      fontWeight: '700',
                      boxShadow: '0 0 10px rgba(255, 0, 60, 0.5)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'rgba(0, 240, 255, 0.1)', margin: '14px 6px' }} />

          <button
            className="nav-item-tactical"
            onClick={handleLogout}
            onMouseEnter={playHoverSound}
            style={{ color: '#ff003c' }}
          >
            <span className="nav-code" style={{ color: '#ff003c' }}>//</span>
            <Icon name="logout" />
            <span>DISENGAGE (LOGOUT)</span>
          </button>
        </nav>

        {/* Operator Profile Module */}
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(2, 6, 16, 0.85)',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              border: '1px solid #00f0ff',
              background: 'rgba(0, 240, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 12,
              fontWeight: 800,
              color: '#00f0ff',
            }}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#f1f8ff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.fullName || 'Operator'}
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                color: '#00ff9d',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ROLE: {user?.role || 'COMMAND'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}