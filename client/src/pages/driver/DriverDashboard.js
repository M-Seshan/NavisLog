import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { playHoverSound } from '../../utils/audioSynth';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [fuelStats, setFuelStats] = useState(null);
  const [maintStats, setMaintStats] = useState(null);
  const [recentFuel, setRecentFuel] = useState([]);
  const [recentMaint, setRecentMaint] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/fuel/stats'),
      API.get('/maintenance/stats'),
      API.get('/fuel?limit=5'),
      API.get('/maintenance?limit=5'),
      API.get('/notifications?limit=5&isRead=false'),
    ]).then(([fs, ms, fl, ml]) => {
      setFuelStats(fs.data.stats);
      setMaintStats(ms.data.stats);
      setRecentFuel(fl.data.entries || []);
      setRecentMaint(ml.data.records || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Pilot Tactical Cockpit" bgVariant="driver-dashboard">
      <style>{`
        .custom-table-driver {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .custom-table-driver th {
          text-align: left;
          padding: 12px 14px;
          color: #00f0ff;
          border-bottom: 1px solid rgba(0, 240, 255, 0.15);
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
        }

        .custom-table-driver td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
        }

        .custom-table-driver tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● COCKPIT TELEMETRY // PILOT AUTHENTICATED
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
          WELCOME, PILOT {user?.fullName?.toUpperCase()} 👋
        </h2>
      </div>

      {/* Assigned Vehicle Hero Card */}
      <div
        className="hud-bracket hud-glass-panel"
        style={{
          marginBottom: 24,
          borderLeft: '4px solid #00f0ff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 8,
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1.5px solid #00f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
            }}
          >
            🚛
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#00ff9d', letterSpacing: '1px' }}>
              // ASSIGNED FLEET UNIT
            </div>
            {user?.assignedVehicle ? (
              <div>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: '#f1f8ff', margin: '4px 0' }}>
                  {user.assignedVehicle.make} {user.assignedVehicle.model}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <code style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", border: '1px solid rgba(0,240,255,0.3)' }}>
                    {user.assignedVehicle.licensePlate}
                  </code>
                  <span className={`badge ${user.assignedVehicle.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    ● {user.assignedVehicle.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                No active vehicle assigned. Standby for Fleet Commander dispatch.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver Cockpit Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">FUEL LOGGED</div>
          <div className="stat-value" style={{ color: '#00ff9d' }}>
            {(fuelStats?.totalQty || 0).toFixed(0)} L
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>TOTAL INGESTION</div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">TOTAL ENERGY COST</div>
          <div className="stat-value" style={{ color: '#00f0ff' }}>
            ₹{(fuelStats?.totalCost || 0).toLocaleString()}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>EXPENSE LEDGER</div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">MAINTENANCE TICKETS</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>
            {maintStats?.total || 0}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>REPORTED BY PILOT</div>
        </div>
      </div>

      {/* Two Column Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Recent Fuel */}
        <div className="hud-bracket hud-glass-panel">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            ⛽ RECENT REFUEL SESSIONS
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table-driver">
              <thead>
                <tr><th>Date</th><th>Volume</th><th>Cost</th></tr>
              </thead>
              <tbody>
                {recentFuel.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No refuel logs.</td></tr>
                ) : (
                  recentFuel.map((f) => (
                    <tr key={f._id} onMouseEnter={playHoverSound}>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace" }}>{new Date(f.date).toLocaleDateString()}</td>
                      <td style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>{f.fuelQuantity} L</td>
                      <td style={{ color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>₹{f.fuelCost}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="hud-bracket hud-glass-panel">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            🛠️ RECENT DIAGNOSTIC TICKETS
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table-driver">
              <thead>
                <tr><th>Issue</th><th>Severity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentMaint.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No faults logged.</td></tr>
                ) : (
                  recentMaint.map((m) => (
                    <tr key={m._id} onMouseEnter={playHoverSound}>
                      <td style={{ textTransform: 'capitalize' }}>{m.issueType?.replace('_', ' ')}</td>
                      <td><span className="badge badge-warning">{m.severity}</span></td>
                      <td><span className="badge badge-info">{m.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}