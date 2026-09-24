import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playLockSound, playActionConfirm } from '../../utils/audioSynth';

/* -------------------------------------------------------------------------- */
/* SHARED HUD STYLES FOR DRIVER PAGES                                         */
/* -------------------------------------------------------------------------- */
const commonStyles = `
  .glass-panel-driver-sub {
    background: rgba(5, 14, 28, 0.78);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 240, 255, 0.18);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  }

  .input-dark-driver {
    width: 100%;
    padding: 10px 14px;
    border-radius: 6px;
    border: 1px solid rgba(0, 240, 255, 0.2);
    background: rgba(4, 12, 24, 0.75);
    color: #f1f8ff;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .input-dark-driver:focus {
    border-color: #00f0ff;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
  }

  .input-dark-driver:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .custom-table-driver-sub {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .custom-table-driver-sub th {
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

  .custom-table-driver-sub td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.05);
    color: #cbd5e1;
  }

  .custom-table-driver-sub tr:hover td {
    background: rgba(0, 240, 255, 0.04);
    color: #ffffff;
  }

  .btn-glow-driver {
    background: linear-gradient(135deg, #00f0ff 0%, #0066ff 100%);
    color: #02050e;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 1px;
    padding: 12px 20px;
    border-radius: 6px;
    border: 1px solid rgba(0, 240, 255, 0.5);
    cursor: pointer;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
    transition: all 0.25s ease;
    text-transform: uppercase;
  }

  .btn-glow-driver:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 35px rgba(0, 240, 255, 0.6);
  }

  .btn-danger-driver {
    background: linear-gradient(135deg, #ff003c 0%, #b91c1c 100%);
    color: #ffffff;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 1px;
    padding: 12px 20px;
    border-radius: 6px;
    border: 1px solid rgba(255, 0, 60, 0.5);
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255, 0, 60, 0.3);
    transition: all 0.25s ease;
    text-transform: uppercase;
  }

  .btn-danger-driver:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(255, 0, 60, 0.6);
  }
`;

const labelStyle = {
  display: 'block',
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: '11px',
  fontWeight: '700',
  color: '#94a3b8',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

/* -------------------------------------------------------------------------- */
/* 1. DRIVER FUEL ENTRY MODULE                                                */
/* -------------------------------------------------------------------------- */
export function DriverFuelEntry() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    vehicle: user?.assignedVehicle?._id || user?.assignedVehicle || '',
    fuelQuantity: '',
    fuelType: 'diesel',
    fuelCost: '',
    fuelStation: '',
    odometer: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const { data } = await API.get('/fuel?limit=10');
      setHistory(data.entries || []);
    } catch {} finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle) {
      toast.error('No vehicle assigned to profile');
      return;
    }
    if (!form.fuelQuantity || !form.fuelCost || !form.fuelStation || !form.odometer) {
      toast.error('All required fields must be filled');
      return;
    }
    setLoading(true);
    playClickSound();

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (receipt) fd.append('receiptImage', receipt);
      await API.post('/fuel', fd);
      playActionConfirm();
      toast.success('Energy log transmitted successfully!');
      setForm({ ...form, fuelQuantity: '', fuelCost: '', fuelStation: '', odometer: '', notes: '' });
      setReceipt(null);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Pilot Fuel Entry" bgVariant="fuel">
      <style>{commonStyles}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Form Card */}
        <div className="hud-bracket glass-panel-driver-sub">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            ⛽ TRANSMIT ENERGY REFUEL LOG
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Volume (Litres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 85.5"
                    className="input-dark-driver"
                    value={form.fuelQuantity}
                    onChange={(e) => setForm({ ...form, fuelQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Total Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 7850"
                    className="input-dark-driver"
                    value={form.fuelCost}
                    onChange={(e) => setForm({ ...form, fuelCost: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Fuel Type *</label>
                  <select
                    className="input-dark-driver"
                    value={form.fuelType}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  >
                    <option value="diesel">DIESEL</option>
                    <option value="petrol">PETROL</option>
                    <option value="electric">ELECTRIC</option>
                    <option value="cng">CNG</option>
                    <option value="lpg">LPG</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Odometer Readout (km) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45200"
                    className="input-dark-driver"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Fuel Station / Terminal Node *</label>
                <input
                  placeholder="e.g. IndianOil Node Sector 4"
                  className="input-dark-driver"
                  value={form.fuelStation}
                  onChange={(e) => setForm({ ...form, fuelStation: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Receipt Voucher (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-dark-driver"
                  onChange={(e) => setReceipt(e.target.files[0])}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onMouseEnter={playHoverSound}
                className="btn-glow-driver"
                style={{ marginTop: 8 }}
              >
                {loading ? 'TRANSMITTING...' : 'TRANSMIT REFUEL RECORD'}
              </button>
            </div>
          </form>
        </div>

        {/* History Card */}
        <div className="hud-bracket glass-panel-driver-sub">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            📜 RECENT TRANSMISSIONS
          </h3>

          {histLoading ? (
            <div style={{ color: '#00f0ff', padding: 20, fontFamily: "'Share Tech Mono', monospace" }}>SYNCING...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>No transactions recorded.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table-driver-sub">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Station</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Odometer</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((e) => (
                    <tr key={e._id} onMouseEnter={playHoverSound}>
                      <td style={{ fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>{new Date(e.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{e.fuelStation}</td>
                      <td style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>{e.fuelQuantity} L</td>
                      <td style={{ color: '#00f0ff', fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}>₹{e.fuelCost}</td>
                      <td style={{ fontSize: 11, color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>{e.odometer?.toLocaleString()} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. DRIVER REPORT ISSUE MODULE                                              */
/* -------------------------------------------------------------------------- */
export function DriverReportIssue() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    vehicle: user?.assignedVehicle?._id || user?.assignedVehicle || '',
    issueType: 'engine',
    description: '',
    currentOdometer: '',
    severity: 'medium',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get('/maintenance?limit=10').then(({ data }) => setHistory(data.records || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle) { toast.error('No vehicle assigned'); return; }
    if (!form.description || !form.currentOdometer) { toast.error('Description and odometer are required'); return; }
    setLoading(true);
    playClickSound();

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await API.post('/maintenance', fd);
      playActionConfirm();
      toast.success('Diagnostic hazard reported! Fleet Command notified.');
      setForm({ ...form, description: '', currentOdometer: '' });
      setImage(null);
      const { data } = await API.get('/maintenance?limit=10');
      setHistory(data.records || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Report Diagnostic Hazard" bgVariant="maintenance">
      <style>{commonStyles}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <div className="hud-bracket glass-panel-driver-sub">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            🚨 REPORT MECHANICAL HAZARD
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Fault Category *</label>
                <select className="input-dark-driver" value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}>
                  {['engine', 'brakes', 'tires', 'electrical', 'transmission', 'fuel_system', 'body_damage', 'ac_heating', 'other'].map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Hazard Severity *</label>
                <select className="input-dark-driver" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="critical">CRITICAL (GROUNDING)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Odometer Readout *</label>
                <input
                  type="number"
                  placeholder="e.g. 45300"
                  className="input-dark-driver"
                  value={form.currentOdometer}
                  onChange={(e) => setForm({ ...form, currentOdometer: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Detailed Fault Description *</label>
                <textarea
                  className="input-dark-driver"
                  rows={3}
                  style={{ resize: 'none' }}
                  placeholder="Describe abnormal sounds, smoke, loss of power..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Damage Telemetry Photo (Optional)</label>
                <input type="file" accept="image/*" className="input-dark-driver" onChange={(e) => setImage(e.target.files[0])} />
              </div>

              <button type="submit" disabled={loading} onMouseEnter={playHoverSound} className="btn-danger-driver">
                {loading ? 'TRANSMITTING HAZARD...' : 'TRANSMIT HAZARD TICKET'}
              </button>
            </div>
          </form>
        </div>

        {/* History */}
        <div className="hud-bracket glass-panel-driver-sub">
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            🛠️ SUBMITTED TICKETS
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table-driver-sub">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No faults logged.</td></tr>
                ) : (
                  history.map((r) => (
                    <tr key={r._id} onMouseEnter={playHoverSound}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{r.issueType?.replace('_', ' ')}</td>
                      <td><span className="badge badge-warning">{r.severity}</span></td>
                      <td><span className="badge badge-info">{r.status}</span></td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
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

/* -------------------------------------------------------------------------- */
/* 3. DRIVER MY VEHICLE MODULE                                                */
/* -------------------------------------------------------------------------- */
export function DriverMyVehicle() {
  const { user } = useAuth();

  return (
    <AppLayout title="Assigned Fleet Unit" bgVariant="vehicles">
      <style>{commonStyles}</style>

      {!user?.assignedVehicle ? (
        <div className="hud-bracket glass-panel-driver-sub" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 500, margin: '40px auto' }}>
          <span style={{ fontSize: 50, display: 'block', marginBottom: 10 }}>🚛</span>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", color: '#f1f8ff', margin: '0 0 6px 0' }}>NO UNIT ASSIGNED</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>Contact Fleet Command to bind a vehicle module to your profile.</p>
        </div>
      ) : (
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div className="hud-bracket glass-panel-driver-sub">
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚛</div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: '#f1f8ff', marginBottom: 4 }}>
              {user.assignedVehicle.make} {user.assignedVehicle.model}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <code style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '4px 10px', borderRadius: 4, fontSize: 14, fontFamily: "'Share Tech Mono', monospace", border: '1px solid rgba(0,240,255,0.3)' }}>
                {user.assignedVehicle.licensePlate}
              </code>
              <span className="badge badge-success">● {user.assignedVehicle.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Vehicle Category', user.assignedVehicle.type],
                ['Engine Propulsion', user.assignedVehicle.fuelType],
                ['Operational Status', user.assignedVehicle.status],
              ].map(([k, v]) => v && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0, 240, 255, 0.1)', fontSize: 13 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: '#f1f8ff', fontWeight: 700, textTransform: 'capitalize' }}>{v?.replace?.('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. DRIVER TRIP HISTORY MODULE                                              */
/* -------------------------------------------------------------------------- */
export function DriverTripHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);

    API.get(`/trips/driver/${user._id}`)
      .then(({ data }) => {
        const filteredTrips = data.filter((trip) => trip.status !== 'Declined');
        setTrips(filteredTrips);
      })
      .catch((err) => {
        toast.error('Failed to load trips');
      })
      .finally(() => setLoading(false));
  }, [user, toast]);

  const completeTrip = async (id) => {
    playLockSound();
    try {
      await API.put(`/trips/complete/${id}`);
      playActionConfirm();
      alert('Mission Completed Successfully!');
      window.location.reload();
    } catch (error) {
      alert('Failed to complete mission');
    }
  };

  return (
    <AppLayout title="Flight Logbook" bgVariant="trips">
      <style>{commonStyles}</style>

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● PILOT LOGBOOK // COMPLETED VECTORS
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
          MISSION FLIGHT LOGS
        </h2>
      </div>

      <div className="hud-bracket glass-panel-driver-sub">
        {loading ? (
          <div style={{ padding: 24, color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
            LOADING FLIGHT HISTORY...
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🗺️</span>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", color: '#f1f8ff', margin: '0 0 6px 0', fontSize: 16 }}>NO MISSIONS COMPLETED</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Your dispatched route history will be archived here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table-driver-sub">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>Pickup</th>
                  <th>Drop Location</th>
                  <th>Distance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t._id} onMouseEnter={playHoverSound}>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}>
                      {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'} {t.startTime}
                    </td>
                    <td style={{ fontWeight: 600, color: '#f1f8ff' }}>{t.pickupLocation || t.startLocation || '-'}</td>
                    <td style={{ fontWeight: 600, color: '#f1f8ff' }}>{t.dropLocation || t.endLocation || '-'}</td>
                    <td style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>
                      {t.distanceCovered > 0 ? `${t.distanceCovered} km` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${t.status?.toLowerCase() === 'completed' ? 'badge-success' : 'badge-info'}`}>
                        ● {t.status}
                      </span>
                    </td>
                    <td>
                      {t.status === 'Accepted' && (
                        <button
                          onClick={() => completeTrip(t._id)}
                          onMouseEnter={playHoverSound}
                          className="btn btn-success btn-sm"
                        >
                          [ COMPLETE MISSION ]
                        </button>
                      )}
                      {t.status === 'Completed' && (
                        <span style={{ color: '#00ff9d', fontWeight: 700, fontSize: 12 }}>✓ Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. DRIVER NOTIFICATIONS MODULE                                             */
/* -------------------------------------------------------------------------- */
export function DriverNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/notifications?limit=30');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    playActionConfirm();
    fetchNotifs();
  };

  const markAll = async () => {
    await API.put('/notifications/read-all');
    playActionConfirm();
    toast.success('All beacons cleared');
    fetchNotifs();
  };

  return (
    <AppLayout title="AI Tactical Alerts" bgVariant="dashboard">
      <style>{commonStyles}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#ffaa00", letterSpacing: "1.5px" }}>
            ● INCOMING ALERTS // UNREAD: {unreadCount}
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
            TACTICAL AI BEACONS
          </h2>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} onMouseEnter={playHoverSound} className="btn btn-secondary btn-sm">
            Mark All Read
          </button>
        )}
      </div>

      <div className="hud-bracket glass-panel-driver-sub">
        {loading ? (
          <div style={{ padding: 20, color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>SYNCING...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            No incoming alerts recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: 16,
                  borderRadius: 6,
                  border: '1px solid rgba(0, 240, 255, 0.12)',
                  background: n.isRead ? 'rgba(5, 14, 28, 0.5)' : 'rgba(0, 240, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>🔔</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f8ff', fontSize: 14 }}>{n.title}</div>
                    <p style={{ fontSize: 13, color: '#cbd5e1', margin: '2px 0 4px 0' }}>{n.message}</p>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} onMouseEnter={playHoverSound} className="btn btn-primary btn-sm">
                    ✓ Clear
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. DRIVER ROUTE DISPATCH MODULE (TODAY'S MISSION)                          */
/* -------------------------------------------------------------------------- */
export function DriverRoute() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (!user?._id) return;
        const { data } = await API.get(`/trips/driver/${user._id}`);
        setTrips(data || []);
      } catch (error) {
        console.log('TRIP FETCH ERROR:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [user]);

  const handleAccept = async (tripId) => {
    playLockSound();
    try {
      await API.put(`/trips/accept/${tripId}`);
      playActionConfirm();
      alert('TARGET LOCK: Mission Accepted!');
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDecline = async (tripId) => {
    playClickSound();
    try {
      await API.put(`/trips/decline/${tripId}`);
      alert('Mission Declined');
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AppLayout title="Assigned Mission Vectors" bgVariant="driver-route">
      <style>{commonStyles}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="hud-bracket glass-panel-driver-sub">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: '#f1f8ff', margin: '0 0 16px 0' }}>
            TODAY'S ASSIGNED MISSION VECTORS
          </h2>

          {loading ? (
            <p style={{ color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>Fetching live mission assignments...</p>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              No active trip vectors assigned today.
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip._id}
                style={{
                  background: 'rgba(2, 6, 16, 0.75)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: 8,
                  padding: 20,
                  marginTop: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, color: '#00f0ff', margin: 0 }}>
                    📍 {trip.pickupLocation} ➔ {trip.dropLocation}
                  </h3>
                  <span className="badge badge-warning">● {trip.status}</span>
                </div>

                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 6 }}>
                  SCHEDULED LAUNCH: <strong>{trip.startTime || '—'}</strong>
                </div>

                {trip.status === 'Assigned' && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button
                      onClick={() => handleAccept(trip._id)}
                      onMouseEnter={playHoverSound}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      [ TARGET LOCK // ACCEPT MISSION ]
                    </button>

                    <button
                      onClick={() => handleDecline(trip._id)}
                      onMouseEnter={playHoverSound}
                      className="btn btn-danger"
                      style={{ flex: 1 }}
                    >
                      DECLINE MISSION
                    </button>
                  </div>
                )}

                {trip.vehicle && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                    ASSIGNED UNIT: {trip.vehicle.vehicleNumber || trip.vehicle.licensePlate}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}