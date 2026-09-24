import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BackgroundCanvas from '../shared/BackgroundCanvas';
import NavisCursor from '../shared/NavisCursor';
import NavisLogBootSequence from '../shared/NavisLogBootSequence';

export default function AppLayout({ title, bgVariant = 'dashboard', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBoot, setShowBoot] = useState(() => {
    return !sessionStorage.getItem('navislog_boot_done');
  });

  return (
    <>
      <style>{`
        @keyframes pageContentReveal {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.99);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .hud-ambient-frame {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 80;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.08);
        }

        .hud-corner-tick {
          position: fixed;
          width: 24px;
          height: 24px;
          pointer-events: none;
          z-index: 85;
        }
        .hud-corner-tick.tl { top: 8px; left: 8px; border-top: 2px solid #00f0ff; border-left: 2px solid #00f0ff; }
        .hud-corner-tick.tr { top: 8px; right: 8px; border-top: 2px solid #00f0ff; border-right: 2px solid #00f0ff; }
        .hud-corner-tick.bl { bottom: 8px; left: 8px; border-bottom: 2px solid #00f0ff; border-left: 2px solid #00f0ff; }
        .hud-corner-tick.br { bottom: 8px; right: 8px; border-bottom: 2px solid #00f0ff; border-right: 2px solid #00f0ff; }

        .app-layout-root {
          display: flex;
          min-height: 100vh;
          background: transparent;
          color: #f1f8ff;
          position: relative;
        }

        .main-wrapper-tactical {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 2;
        }

        @media (min-width: 769px) {
          .main-wrapper-tactical {
            margin-left: 260px;
          }
        }

        .page-content-hologram {
          flex: 1;
          padding: 24px 28px;
          animation: pageContentReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
          z-index: 2;
        }

        @media (max-width: 768px) {
          .page-content-hologram {
            padding: 16px;
          }
        }
      `}</style>

      {/* Boot Experience (First Load Only, Skippable) */}
      {showBoot && <NavisLogBootSequence onComplete={() => setShowBoot(false)} />}

      {/* Custom Tactical Reticle Cursor */}
      <NavisCursor />

      {/* Ambient HUD Framing */}
      <div className="hud-ambient-frame hud-scanlines" />
      <div className="hud-corner-tick tl" />
      <div className="hud-corner-tick tr" />
      <div className="hud-corner-tick bl" />
      <div className="hud-corner-tick br" />

      {/* Live Page-Specific Background Canvas */}
      <BackgroundCanvas variant={bgVariant} />

      <div className="app-layout app-layout-root">
        {/* Tactical Command Dock / Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Command View Area */}
        <div className="main-wrapper main-wrapper-tactical">
          <TopNav title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className="page-content page-content-hologram">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}