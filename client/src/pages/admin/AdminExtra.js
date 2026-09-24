import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

const TYPE_ICONS = {
  fuel_submitted: '⛽',
  maintenance_reported: '🔧',
  ai_alert: '🤖',
  vehicle_assigned: '🚛',
  driver_registered: '👤',
  system: '⚙️',
  maintenance_resolved: '✅',
};

/* -------------------------------------------------------------------------- */
/* 1. ADMIN NOTIFICATIONS MODULE (ALERT BEACONS)                              */
/* -------------------------------------------------------------------------- */
export function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/notifications?page=${page}&limit=20`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setPages(data.pages || 1);
    } catch {
      toast.error('Failed to load alert beacons');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    playActionConfirm();
    fetchNotifications();
  };

  const markAllRead = async () => {
    await API.put('/notifications/read-all');
    playActionConfirm();
    toast.success('All alert beacons cleared');
    fetchNotifications();
  };

  const deleteNotif = async (id) => {
    await API.delete(`/notifications/${id}`);
    playClickSound();
    fetchNotifications();
  };

  return (
    <AppLayout title="System Activity & Alert Beacons" bgVariant="dashboard">
      <style>{`
        .notif-item-tactical {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.08);
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.25s ease;
        }
        .notif-item-tactical:hover {
          background: rgba(0, 240, 255, 0.04);
        }
        .notif-unread-tactical {
          background: rgba(0, 240, 255, 0.06) !important;
          border-left: 3px solid #00f0ff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#ffaa00', letterSpacing: '1.5px' }}>
            ● INCIDENT & SYSTEM DISPATCH FEED // UNREAD: {unreadCount}
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
            TACTICAL ALERT BEACONS
          </h2>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => { playClickSound(); markAllRead(); }}
            onMouseEnter={playHoverSound}
            className="btn btn-secondary"
          >
            ✓ ACKNOWLEDGE ALL BEACONS
          </button>
        )}
      </div>

      <div className="hud-bracket hud-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
            SCANNING ALERT FREQUENCIES...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>📡</span>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", color: '#f1f8ff', margin: '0 0 6px 0', fontSize: '16px' }}>
              ALL SECTORS NOMINAL
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No unresolved tactical alert beacons detected.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-item-tactical ${!n.isRead ? 'notif-unread-tactical' : ''}`}
              onMouseEnter={playHoverSound}
            >
              <span
                style={{
                  fontSize: 22,
                  flexShrink: 0,
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                {TYPE_ICONS[n.type] || '🔔'}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f8ff' }}>
                    {n.title}
                  </span>
                  <span
                    className={`badge ${
                      n.priority === 'urgent' ? 'badge-danger' : n.priority === 'high' ? 'badge-warning' : 'badge-info'
                    }`}
                  >
                    ● {n.priority}
                  </span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n._id)}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Purge
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => { playClickSound(); setPage(i + 1); }}
              className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: 34 }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. FALLBACK LIVE TRACKING ROUTE (FOR SAFETY)                               */
/* -------------------------------------------------------------------------- */
export function LiveTracking() {
  return <div style={{ color: '#00f0ff' }}>Redirecting to tactical tracking...</div>;
}

/* -------------------------------------------------------------------------- */
/* 3. ADMIN REPORTS MODULE (FLEET INTELLIGENCE REPORT)                        */
/* -------------------------------------------------------------------------- */
export function AdminReports() {
  const [vehicleReport, setVehicleReport] = useState([]);
  const [driverReport, setDriverReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      API.get('/reports/vehicles'),
      API.get('/reports/drivers'),
    ])
      .then(([v, d]) => {
        setVehicleReport(v.data.report || []);
        setDriverReport(d.data.report || []);
      })
      .catch(() => toast.error('Failed to load intelligence reports'))
      .finally(() => setLoading(false));
  }, []);

  const downloadCSV = (data, filename) => {
    if (!data.length) {
      toast.error('No data to export');
      return;
    }
    playActionConfirm();
    const headers = Object.keys(data[0]);
    const rows = data.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Holographic intelligence report exported');
  };

  return (
    <AppLayout title="Fleet Intelligence Report" bgVariant="reports">
      <style>{`
        .report-tab-btn-tactical {
          padding: 10px 22px;
          border-radius: 6px;
          border: 1px solid rgba(0, 240, 255, 0.2);
          background: rgba(5, 14, 28, 0.7);
          color: #94a3b8;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .report-tab-btn-tactical.active {
          background: #00f0ff;
          color: #02050e;
          border-color: #00f0ff;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .report-table-tactical {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .report-table-tactical th {
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

        .report-table-tactical td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
        }

        .report-table-tactical tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d', letterSpacing: '1.5px' }}>
            ● ANALYTICAL DATA ENGINE // FLEET PERFORMANCE AUDIT
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
            FLEET INTELLIGENCE REPORTS
          </h2>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className={`report-tab-btn-tactical ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => { playClickSound(); setActiveTab('vehicles'); }}
          onMouseEnter={playHoverSound}
        >
          🚛 FLEET VEHICLE ANALYTICS
        </button>
        <button
          className={`report-tab-btn-tactical ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => { playClickSound(); setActiveTab('drivers'); }}
          onMouseEnter={playHoverSound}
        >
          👤 PILOT PERFORMANCE AUDIT
        </button>
      </div>

      {/* Vehicle Report Tab */}
      {activeTab === 'vehicles' && (
        <div className="hud-bracket hud-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 800, color: '#f1f8ff', margin: 0 }}>
              VEHICLE EFFICIENCY METRICS
            </h3>
            <button
              onClick={() => downloadCSV(vehicleReport, 'fleet-vehicle-report.csv')}
              onMouseEnter={playHoverSound}
              className="btn btn-primary btn-sm"
            >
              ⬇ EXPORT CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="report-table-tactical">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th>Status</th>
                  <th>Pilot</th>
                  <th>Fuel Expense</th>
                  <th>Fuel Ingestion</th>
                  <th>Faults</th>
                  <th>Missions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                      AGGREGATING TELEMETRY AUDIT...
                    </td>
                  </tr>
                ) : vehicleReport.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                      NO AUDIT DATA AVAILABLE.
                    </td>
                  </tr>
                ) : (
                  vehicleReport.map((r) => (
                    <tr key={r.vehicle._id} onMouseEnter={playHoverSound}>
                      <td style={{ fontWeight: 700, color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        {r.vehicle.make} {r.vehicle.model}
                      </td>
                      <td>
                        <code style={{ color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                          {r.vehicle.licensePlate}
                        </code>
                      </td>
                      <td>
                        <span className={`badge ${r.vehicle.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          ● {r.vehicle.status}
                        </span>
                      </td>
                      <td>{r.vehicle.assignedDriver?.fullName || '—'}</td>
                      <td style={{ color: '#00f0ff', fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}>
                        ₹{(r.fuel?.totalCost || 0).toLocaleString()}
                      </td>
                      <td style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>
                        {(r.fuel?.totalQty || 0).toFixed(1)} L
                      </td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace" }}>{r.maintenanceCount}</td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace" }}>{r.tripCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Report Tab */}
      {activeTab === 'drivers' && (
        <div className="hud-bracket hud-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 800, color: '#f1f8ff', margin: 0 }}>
              PILOT CONDUCT & PRODUCTIVITY METRICS
            </h3>
            <button
              onClick={() => downloadCSV(driverReport, 'pilot-performance-report.csv')}
              onMouseEnter={playHoverSound}
              className="btn btn-primary btn-sm"
            >
              ⬇ EXPORT CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="report-table-tactical">
              <thead>
                <tr>
                  <th>Pilot Name</th>
                  <th>License ID</th>
                  <th>Status</th>
                  <th>Missions Completed</th>
                  <th>Energy Logged</th>
                  <th>Total Expenditure</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                      AGGREGATING PILOT PERFORMANCE...
                    </td>
                  </tr>
                ) : driverReport.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                      NO PILOT REPORT DATA.
                    </td>
                  </tr>
                ) : (
                  driverReport.map((r) => (
                    <tr key={r.driver._id} onMouseEnter={playHoverSound}>
                      <td style={{ fontWeight: 700, color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        👤 {r.driver.fullName}
                      </td>
                      <td>
                        <code style={{ color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                          {r.driver.licenseNumber || '—'}
                        </code>
                      </td>
                      <td>
                        <span className={`badge ${r.driver.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {r.driver.isActive ? '● ONLINE' : '○ STANDBY'}
                        </span>
                      </td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff9d', fontWeight: 700 }}>
                        {r.completedTrips || 0}
                      </td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {(r.totalFuelQuantity || 0).toFixed(1)} L
                      </td>
                      <td style={{ color: '#00f0ff', fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}>
                        ₹{(r.totalFuelCost || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}