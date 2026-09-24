import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

const VEHICLE_TYPES = ['truck','van','car','motorcycle','heavy_vehicle','other'];
const FUEL_TYPES = ['diesel','petrol','electric','hybrid','cng','lpg','gasoline'];
const STATUSES = ['active','maintenance','inactive','retired'];

/* -------------------------------------------------------------------------- */
/* 1. HOLOGRAPHIC VEHICLE MODAL (CREATE / EDIT)                               */
/* -------------------------------------------------------------------------- */
function VehicleModal({ vehicle, drivers, onClose, onSave }) {
  const [form, setForm] = useState(
    vehicle || {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vin: '',
      type: 'truck',
      status: 'active',
      fuelType: 'diesel',
      currentOdometer: 0,
      color: '',
      notes: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.licensePlate) {
      toast.error('Make, model and license plate are required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      let res;
      if (vehicle?._id) res = await API.put(`/vehicles/${vehicle._id}`, fd);
      else res = await API.post('/vehicles', fd);
      playActionConfirm();
      toast.success(vehicle?._id ? 'Vehicle updated' : 'Vehicle created');
      onSave(res.data.vehicle);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
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
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
              // HANGAR DOCK CONFIG
            </span>
            <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: '800', color: '#f1f8ff' }}>
              {vehicle?._id ? 'EDIT VEHICLE MODULE' : 'REGISTER NEW FLEET UNIT'}
            </h3>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00f0ff',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Make / Manufacturer *</label>
                <input className="input-dark-veh" placeholder="e.g. Tata / BharatBenz" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Model Specification *</label>
                <input className="input-dark-veh" placeholder="e.g. Prima 5530" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Manufacturing Year</label>
                <input className="input-dark-veh" type="number" min="1990" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>License Plate (Reg) *</label>
                <input className="input-dark-veh" placeholder="TN57AB1234" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>VIN (Vehicle Identification)</label>
                <input className="input-dark-veh" placeholder="VIN-XXXXXXXXX" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Chassis / Body Color</label>
                <input className="input-dark-veh" placeholder="e.g. Arctic White" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Vehicle Classification</label>
                <select className="input-dark-veh" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Propulsion / Fuel Type</label>
                <select className="input-dark-veh" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{f.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Operational Status</label>
                <select className="input-dark-veh" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Current Odometer (km)</label>
                <input className="input-dark-veh" type="number" min="0" value={form.currentOdometer} onChange={(e) => setForm({ ...form, currentOdometer: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Insurance Expiry</label>
                <input className="input-dark-veh" type="date" value={form.insuranceExpiry ? form.insuranceExpiry.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Registration Expiry</label>
                <input className="input-dark-veh" type="date" value={form.registrationExpiry ? form.registrationExpiry.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, registrationExpiry: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Next Service Threshold (km)</label>
              <input className="input-dark-veh" type="number" min="0" placeholder="e.g. 150000" value={form.nextServiceDue || ''} onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Technical Remarks</label>
              <textarea className="input-dark-veh" rows={2} style={{ resize: 'none' }} placeholder="Maintenance notes or equipment..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => { playClickSound(); onClose(); }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Transmitting...' : 'Commit Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. ASSIGN DRIVER MODAL                                                     */
/* -------------------------------------------------------------------------- */
function AssignDriverModal({ vehicle, drivers, onClose, onSave }) {
  const [driverId, setDriverId] = useState(vehicle.assignedDriver?._id || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAssign = async () => {
    setLoading(true);
    try {
      const res = await API.put(`/vehicles/${vehicle._id}/assign-driver`, { driverId: driverId || null });
      playActionConfirm();
      toast.success('Pilot assignment updated');
      onSave(res.data.vehicle);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign driver');
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
          maxWidth: '440px',
          background: 'rgba(5, 14, 28, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9)',
          color: '#f1f8ff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00ff9d' }}>
              // ASSIGNMENT PROTOCOL
            </span>
            <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800' }}>
              LINK PILOT TO UNIT
            </h3>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Target Unit: <strong style={{ color: '#00f0ff' }}>{vehicle.make} {vehicle.model} [{vehicle.licensePlate}]</strong>
        </p>

        <div>
          <label style={labelStyle}>Authorized Drivers</label>
          <select className="input-dark-veh" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">— Unassigned (Standby) —</option>
            {drivers.filter((d) => d.isActive).map((d) => (
              <option key={d._id} value={d._id}>{d.fullName} ({d.email})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button onClick={() => { playClickSound(); onClose(); }} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAssign} disabled={loading} className="btn btn-primary">
            {loading ? 'Linking...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. CINEMATIC VEHICLE INTELLIGENCE DOSSIER                                  */
/* -------------------------------------------------------------------------- */
function VehicleIntelligenceModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 5, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 250,
        padding: '20px',
      }}
    >
      <div
        className="hud-bracket"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'rgba(5, 14, 28, 0.95)',
          border: '1px solid #00f0ff',
          borderRadius: '8px',
          padding: '28px',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.25), 0 20px 50px rgba(0, 0, 0, 0.9)',
          color: '#f1f8ff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d', letterSpacing: '1px' }}>
              ● HOLOGRAPHIC VEHICLE DOSSIER // UNIT TELEMETRY
            </div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 900, margin: '4px 0 0 0', color: '#f1f8ff' }}>
              {vehicle.make} {vehicle.model}
            </h2>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid #00f0ff', color: '#00f0ff', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="intel-pill">
            <span className="intel-lbl">REGISTRATION</span>
            <span className="intel-val" style={{ color: '#00f0ff' }}>{vehicle.licensePlate}</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">STATUS</span>
            <span className="intel-val" style={{ color: vehicle.status === 'active' ? '#00ff9d' : '#ffaa00' }}>
              ● {vehicle.status?.toUpperCase()}
            </span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">PROPULSION</span>
            <span className="intel-val">{vehicle.fuelType?.toUpperCase()}</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">ODOMETER</span>
            <span className="intel-val">{(vehicle.currentOdometer || 0).toLocaleString()} KM</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">ASSIGNED DRIVER</span>
            <span className="intel-val">{vehicle.assignedDriver?.fullName || 'UNASSIGNED'}</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">VIN NUMBER</span>
            <span className="intel-val">{vehicle.vin || 'CLASSIFIED'}</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">CLASS TYPE</span>
            <span className="intel-val">{vehicle.type?.toUpperCase()}</span>
          </div>

          <div className="intel-pill">
            <span className="intel-lbl">NEXT SERVICE</span>
            <span className="intel-val">
              {vehicle.nextServiceDue ? `${vehicle.nextServiceDue.toLocaleString()} KM` : 'NOMINAL'}
            </span>
          </div>
        </div>

        {vehicle.notes && (
          <div style={{ background: 'rgba(2, 6, 16, 0.6)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
              OPERATIONAL LOGS / REMARKS:
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{vehicle.notes}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { playClickSound(); onClose(); }} className="btn btn-primary">
            [ CLOSE TELEMETRY DOSSIER ]
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. MAIN VEHICLES HANGAR MODULE                                             */
/* -------------------------------------------------------------------------- */
export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [assignVehicle, setAssignVehicle] = useState(null);
  const [inspectVehicle, setInspectVehicle] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const toast = useToast();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, search, status: statusFilter });
      const { data } = await API.get(`/vehicles?${params}`);
      setVehicles(data.vehicles || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    API.get('/drivers?limit=100')
      .then(({ data }) => setDrivers(data.drivers || []))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    try {
      await API.delete(`/vehicles/${deleteId}`);
      playActionConfirm();
      toast.success('Vehicle purged from registry');
      setDeleteId(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout title="Vehicle Command Deck" bgVariant="vehicles">
      <style>{`
        .input-dark-veh {
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

        .input-dark-veh:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .vehicle-card-module {
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
        }

        .vehicle-card-module:hover {
          transform: translateY(-3px);
          border-color: #00f0ff;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.25), 0 15px 35px rgba(0, 0, 0, 0.8);
        }

        .intel-pill {
          background: rgba(2, 6, 16, 0.6);
          border: 1px solid rgba(0, 240, 255, 0.12);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .intel-lbl {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #64748b;
          letter-spacing: 1px;
        }

        .intel-val {
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #f1f8ff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#00ff9d', letterSpacing: '1.5px' }}>
            ● HANGAR INVENTORY // TOTAL UNITS: {total}
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#f1f8ff' }}>
            FLEET VEHICLE REGISTRY
          </h2>
        </div>

        <button
          onClick={() => { playClickSound(); setEditVehicle(null); setShowModal(true); }}
          onMouseEnter={playHoverSound}
          className="btn btn-primary"
        >
          + Commission New Unit
        </button>
      </div>

      {/* Filter and Search Bar */}
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
            className="input-dark-veh"
            placeholder="🔍 Search Make, Model, License Plate, VIN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            className="input-dark-veh"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">ALL STATUSES</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Grid / Holographic Modules */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 210, borderRadius: 8, background: 'rgba(5, 14, 28, 0.6)', border: '1px solid rgba(0, 240, 255, 0.1)' }} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
          NO FLEET UNITS DETECTED IN SECTOR.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="hud-bracket vehicle-card-module"
              onMouseEnter={playHoverSound}
              data-hud-label={v.licensePlate}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, margin: 0, color: '#f1f8ff' }}>
                      {v.make} {v.model}
                    </h3>
                    <code
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 12,
                        color: '#00f0ff',
                        background: 'rgba(0, 240, 255, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginTop: 4,
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                      }}
                    >
                      {v.licensePlate}
                    </code>
                  </div>

                  <span className={`badge badge-${v.status === 'active' ? 'success' : v.status === 'maintenance' ? 'warning' : 'danger'}`}>
                    ● {v.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
                  <div style={{ color: '#94a3b8' }}>
                    PROPULSION: <strong style={{ color: '#f1f8ff' }}>{v.fuelType?.toUpperCase()}</strong>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    ODOMETER: <strong style={{ color: '#00ff9d', fontFamily: "'Share Tech Mono', monospace" }}>{(v.currentOdometer || 0).toLocaleString()} KM</strong>
                  </div>
                  <div style={{ color: '#94a3b8', gridColumn: 'span 2' }}>
                    PILOT: <strong style={{ color: '#f1f8ff' }}>{v.assignedDriver?.fullName || 'UNASSIGNED'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(0, 240, 255, 0.1)', paddingTop: 14 }}>
                <button
                  onClick={() => { playClickSound(); setInspectVehicle(v); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, borderColor: '#00f0ff', color: '#00f0ff' }}
                >
                  INSPECT
                </button>
                <button
                  onClick={() => { playClickSound(); setAssignVehicle(v); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-secondary btn-sm"
                >
                  ASSIGN
                </button>
                <button
                  onClick={() => { playClickSound(); setEditVehicle(v); setShowModal(true); }}
                  onMouseEnter={playHoverSound}
                  className="btn btn-secondary btn-sm"
                >
                  EDIT
                </button>
                <button
                  onClick={() => { playClickSound(); setDeleteId(v._id); }}
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

      {/* Pagination Controls */}
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
        <VehicleModal
          vehicle={editVehicle}
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchVehicles(); }}
        />
      )}

      {assignVehicle && (
        <AssignDriverModal
          vehicle={assignVehicle}
          drivers={drivers}
          onClose={() => setAssignVehicle(null)}
          onSave={() => { setAssignVehicle(null); fetchVehicles(); }}
        />
      )}

      {inspectVehicle && (
        <VehicleIntelligenceModal
          vehicle={inspectVehicle}
          onClose={() => setInspectVehicle(null)}
        />
      )}

      {deleteId && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2, 5, 14, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
        >
          <div className="hud-bracket" style={{ width: '100%', maxWidth: '380px', background: 'rgba(5, 14, 28, 0.95)', border: '1px solid #ff003c', borderRadius: 8, padding: 24, color: '#f1f8ff' }}>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#ff003c' }}>PURGE UNIT RECORD?</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0' }}>This will permanently remove the vehicle module from the fleet registry.</p>
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