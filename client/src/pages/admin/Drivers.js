import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

/* -------------------------------------------------------------------------- */
/* 1. HOLOGRAPHIC DRIVER REGISTRATION MODAL                                   */
/* -------------------------------------------------------------------------- */
function DriverModal({ driver, onClose, onSave }) {
  const [form, setForm] = useState(
    driver || {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      licenseNumber: '',
      licenseExpiry: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!driver?._id && !form.password) {
      toast.error('Password is required for new driver');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (driver?._id) {
        const { password, email, ...update } = form;
        res = await API.put(`/drivers/${driver._id}`, update);
      } else {
        res = await API.post('/drivers', form);
      }
      playActionConfirm();
      toast.success(driver?._id ? 'Driver dossier updated' : 'Driver identity registered');
      onSave(res.data.driver);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 5, 14, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
    >
      <div
        className="hud-bracket"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(5, 14, 28, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '8px',
          padding: '28px',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 240, 255, 0.15)',
          color: '#f1f8ff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d' }}>
              // PERSONNEL BIOMETRICS
            </span>
            <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: '800' }}>
              {driver?._id ? 'EDIT PILOT DOSSIER' : 'REGISTER FLEET PILOT'}
            </h3>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontFamily: 'monospace' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input className="input-dark-drv" placeholder="e.g. John Doe" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Comms / Phone</label>
                <input className="input-dark-drv" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Access Email *</label>
              <input className="input-dark-drv" type="email" placeholder="pilot@navislog.org" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!driver?._id} />
            </div>

            {!driver?._id && (
              <div>
                <label style={labelStyle}>Access Passcode *</label>
                <input className="input-dark-drv" type="password" placeholder="Min. 6 alphanumeric chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Base Sector / Address</label>
              <input className="input-dark-drv" placeholder="Terminal 4, Logistics Hub" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Pilot License ID</label>
                <input className="input-dark-drv" placeholder="DL-IND-99482" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>License Expiration</label>
                <input className="input-dark-drv" type="date" value={form.licenseExpiry ? form.licenseExpiry.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={() => { playClickSound(); onClose(); }} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Transmitting...' : 'Commit Personnel Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. DRIVERS NETWORK MODULE                                                  */
/* -------------------------------------------------------------------------- */
export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const toast = useToast();

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        search,
        ...(activeFilter !== '' && { isActive: activeFilter }),
      });
      const { data } = await API.get(`/drivers?${params}`);
      setDrivers(data.drivers || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleToggle = async (id) => {
    try {
      const { data } = await API.put(`/drivers/${id}/toggle-status`);
      playActionConfirm();
      toast.success(data.message);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/drivers/${deleteId}`);
      playActionConfirm();
      toast.success('Driver record purged');
      setDeleteId(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout title="Driver Network" bgVariant="drivers">
      <style>{`
        .input-dark-drv {
          width: 100%;
          padding: 10px 14px;
          border-radius: 6px;
          border: 1px solid rgba(0, 240, 255, 0.2);
          background: rgba(4, 12, 24, 0.75);
          color: #f1f8ff;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .input-dark-drv:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .driver-dossier-card {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.18);
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .driver-dossier-card::after {
          content: '';
          position: absolute;
          top: -100%;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(180deg, transparent, rgba(0, 240, 255, 0.12), transparent);
          pointer-events: none;
          transition: transform 0.6s ease;
        }

        .driver-dossier-card:hover::after {
          transform: translateY(200%);
        }

        .driver-dossier-card:hover {
          transform: translateY(-3px);
          border-color: #00f0ff;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.25), 0 15px 35px rgba(0, 0, 0, 0.8);
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d', letterSpacing: '1.5px' }}>
            ● DRIVER PERSONNEL NETWORK // REGISTERED PILOTS: {total}
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
            OPERATIONAL PILOT NETWORK
          </h2>
        </div>

        <button
          onClick={() => { playClickSound(); setEditDriver(null); setShowModal(true); }}
          onMouseEnter={playHoverSound}
          className="btn btn-primary"
        >
          + Enlist New Pilot
        </button>
      </div>

      {/* Search and Status Filters */}
      <div
        className="hud-bracket"
        style={{
          background: 'rgba(5, 14, 28, 0.75)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            className="input-dark-drv"
            placeholder="🔍 Search Pilot Name, Email, License Number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            className="input-dark-drv"
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          >
            <option value="">ALL STATUSES</option>
            <option value="true">ACTIVE PILOTS</option>
            <option value="false">INACTIVE PILOTS</option>
          </select>
        </div>
      </div>

      {/* Drivers Grid / Dossiers */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 220, borderRadius: 8, background: 'rgba(5, 14, 28, 0.6)', border: '1px solid rgba(0, 240, 255, 0.1)' }} />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
          NO PILOTS FOUND IN CURRENT NETWORK PARAMETERS.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {drivers.map((d) => (
            <div
              key={d._id}
              className="hud-bracket driver-dossier-card"
              onMouseEnter={playHoverSound}
              data-hud-label={d.fullName}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  {/* Holographic Avatar with Biometric Border */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 102, 255, 0.3))',
                      border: '1.5px solid #00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 900,
                      fontSize: 16,
                      color: '#00f0ff',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                    }}
                  >
                    {d.fullName?.charAt(0) || 'P'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: 15,
                          fontWeight: 800,
                          color: '#f1f8ff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {d.fullName}
                      </h3>
                      <span className={`badge ${d.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {d.isActive ? '● ONLINE' : '○ STANDBY'}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                      {d.email}
                    </div>
                  </div>
                </div>

                {/* Dossier Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
                  <div style={{ color: '#94a3b8' }}>
                    PHONE: <strong style={{ color: '#cbd5e1' }}>{d.phone || '—'}</strong>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    LICENSE: <strong style={{ color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>{d.licenseNumber || '—'}</strong>
                  </div>
                  <div style={{ color: '#94a3b8', gridColumn: 'span 2' }}>
                    ASSIGNED VEHICLE:{' '}
                    {d.assignedVehicle ? (
                      <span style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>
                        {d.assignedVehicle.make} {d.assignedVehicle.model} [{d.assignedVehicle.licensePlate}]
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>UNASSIGNED</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(0, 240, 255, 0.1)', paddingTop: 14 }}>
                <button
                  onClick={() => { playClickSound(); handleToggle(d._id); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  {d.isActive ? 'STANDBY' : 'ACTIVATE'}
                </button>
                <button
                  onClick={() => { playClickSound(); setEditDriver(d); setShowModal(true); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-secondary btn-sm"
                >
                  EDIT
                </button>
                <button
                  onClick={() => { playClickSound(); setDeleteId(d._id); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-danger btn-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => { playClickSound(); setPage(i + 1); }}
              className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: 36 }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <DriverModal
          driver={editDriver}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchDrivers(); }}
        />
      )}

      {deleteId && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2, 5, 14, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
        >
          <div className="hud-bracket" style={{ width: '100%', maxWidth: '380px', background: 'rgba(5, 14, 28, 0.95)', border: '1px solid #ff003c', borderRadius: 8, padding: 24, color: '#f1f8ff' }}>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#ff003c' }}>PURGE PILOT DOSSIER?</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0' }}>This will permanently remove the driver credentials from the network roster.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Confirm Purge</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

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