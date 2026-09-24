import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

export default function MaintenanceManagement() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ vehicleId: '', severity: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [resolveRecord, setResolveRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', resolutionNotes: '', actualCost: '' });
  const toast = useToast();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...filters });
      const [recRes, statsRes] = await Promise.all([
        API.get(`/maintenance?${params}`),
        API.get('/maintenance/stats'),
      ]);
      setRecords(recRes.data.records || []);
      setTotal(recRes.data.total || 0);
      setPages(recRes.data.pages || 1);
      setStats(statsRes.data.stats || null);
    } catch {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    API.get('/vehicles?limit=100')
      .then(({ data }) => setVehicles(data.vehicles || []))
      .catch(() => {});
  }, []);

  const handleResolve = async () => {
    if (!resolveForm.resolutionNotes) {
      toast.error('Resolution diagnostics required');
      return;
    }
    try {
      await API.put(`/maintenance/${resolveRecord._id}`, resolveForm);
      playActionConfirm();
      toast.success('Maintenance cleared');
      setResolveRecord(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Purge this maintenance record from the system?')) return;
    try {
      await API.delete(`/maintenance/${id}`);
      playActionConfirm();
      toast.success('Record purged');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout title="Vehicle Maintenance Core" bgVariant="maintenance">
      <style>{`
        .input-dark-maint {
          padding: 9px 12px;
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

        .input-dark-maint:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .custom-table-maint {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .custom-table-maint th {
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

        .custom-table-maint td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
        }

        .custom-table-maint tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#ffaa00", letterSpacing: "1.5px" }}>
          ● MECHANICAL DIAGNOSTIC MATRIX // FAULT TICKETS: {total}
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
          VEHICLE MAINTENANCE CORE
        </h2>
      </div>

      {/* Maintenance Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">TOTAL FAULT LOGS</div>
          <div className="stat-value" style={{ color: '#00f0ff' }}>
            {stats?.total || 0}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>ALL-TIME DIAGNOSTICS</div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">OPEN WORK ORDERS</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>
            {stats?.open || 0}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#ffaa00' }}>PENDING RESOLUTION</div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">CRITICAL HAZARDS</div>
          <div className="stat-value" style={{ color: '#ff003c' }}>
            {stats?.critical || 0}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#ff003c' }}>URGENT GROUNDING</div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">TOTAL REPAIR EXPENSE</div>
          <div className="stat-value" style={{ color: '#00ff9d' }}>
            ₹{(stats?.totalCost || 0).toLocaleString()}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>RESOLVED BILLING</div>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div style={{ minWidth: '180px' }}>
          <select
            className="input-dark-maint"
            style={{ width: '100%' }}
            value={filters.vehicleId}
            onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
          >
            <option value="">ALL FLEET UNITS</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.make} {v.model} ({v.licensePlate})
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <select
            className="input-dark-maint"
            style={{ width: '100%' }}
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="">ALL SEVERITIES</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
            <option value="critical">CRITICAL</option>
          </select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <select
            className="input-dark-maint"
            style={{ width: '100%' }}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">ALL STATUSES</option>
            <option value="reported">REPORTED</option>
            <option value="in_progress">IN PROGRESS</option>
            <option value="resolved">RESOLVED</option>
          </select>
        </div>

        {(filters.vehicleId || filters.severity || filters.status) && (
          <button
            onClick={() => setFilters({ vehicleId: '', severity: '', status: '' })}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Maintenance Records Table */}
      <div className="hud-bracket hud-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
            MECHANICAL DIAGNOSTIC TICKETS
          </h3>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00f0ff' }}>
            // SERVICE QUEUE
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table-maint">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Issue Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported On</th>
                <th>Repair Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                    CALIBRATING DIAGNOSTIC CORE...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                    NO ACTIVE FAULTS IN MAINTENANCE QUEUE.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} onMouseEnter={playHoverSound}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        {r.vehicle?.make} {r.vehicle?.model}
                      </div>
                      <code style={{ fontSize: '11px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                        {r.vehicle?.licensePlate}
                      </code>
                    </td>

                    <td style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                      {r.issueType?.replace('_', ' ')}
                    </td>

                    <td>
                      <span className={`badge badge-${r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'info'}`}>
                        ● {r.severity}
                      </span>
                    </td>

                    <td>
                      <span className={`badge badge-${r.status === 'resolved' ? 'success' : 'warning'}`}>
                        {r.status}
                      </span>
                    </td>

                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
                      {new Date(r.reportedDate || r.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff9d', fontWeight: '700' }}>
                      {r.actualCost ? `₹${r.actualCost.toLocaleString()}` : r.estimatedCost ? `₹${r.estimatedCost.toLocaleString()} (Est)` : '—'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status !== 'resolved' && (
                          <button
                            onClick={() => { playClickSound(); setResolveRecord(r); }}
                            onMouseEnter={playHoverSound}
                            className="btn btn-success btn-sm"
                          >
                            RESOLVE
                          </button>
                        )}
                        <button
                          onClick={() => { playClickSound(); setViewRecord(r); }}
                          onMouseEnter={playHoverSound}
                          className="btn btn-secondary btn-sm"
                        >
                          INSPECT
                        </button>
                        <button
                          onClick={() => { playClickSound(); handleDelete(r._id); }}
                          onMouseEnter={playHoverSound}
                          className="btn btn-danger btn-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveRecord && (
        <div
          onClick={(e) => e.target === e.currentTarget && setResolveRecord(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2, 5, 14, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
        >
          <div className="hud-bracket" style={{ width: '100%', maxWidth: '480px', background: 'rgba(5, 14, 28, 0.95)', border: '1px solid #00ff9d', borderRadius: 8, padding: 24, color: '#f1f8ff' }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#00ff9d' }}>
              SIGN OFF REPAIR CLEARANCE
            </h3>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Resolution Diagnostics / Work Notes *</label>
              <textarea
                className="input-dark-maint"
                rows={3}
                style={{ width: '100%', resize: 'none' }}
                placeholder="Details of parts replaced, service inspection completed..."
                value={resolveForm.resolutionNotes}
                onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Final Cost (₹)</label>
              <input
                type="number"
                className="input-dark-maint"
                style={{ width: '100%' }}
                placeholder="Total expenditure"
                value={resolveForm.actualCost}
                onChange={(e) => setResolveForm({ ...resolveForm, actualCost: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setResolveRecord(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResolve} className="btn btn-success">Authorize Clearance</button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Detail Modal */}
      {viewRecord && (
        <div
          onClick={(e) => e.target === e.currentTarget && setViewRecord(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2, 5, 14, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
        >
          <div className="hud-bracket" style={{ width: '100%', maxWidth: '520px', background: 'rgba(5, 14, 28, 0.95)', border: '1px solid #00f0ff', borderRadius: 8, padding: 26, color: '#f1f8ff' }}>
            <h3 style={{ margin: '0 0 14px 0', fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#00f0ff' }}>
              MAINTENANCE DIAGNOSTIC DOSSIER
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 20 }}>
              <div>UNIT: <strong>{viewRecord.vehicle?.make} {viewRecord.vehicle?.model} [{viewRecord.vehicle?.licensePlate}]</strong></div>
              <div>ISSUE TYPE: <strong style={{ textTransform: 'capitalize' }}>{viewRecord.issueType?.replace('_', ' ')}</strong></div>
              <div>SEVERITY: <span className="badge badge-warning">{viewRecord.severity}</span></div>
              <div>STATUS: <span className="badge badge-info">{viewRecord.status}</span></div>
              <div>FAULT DESCRIPTION: <p style={{ color: '#cbd5e1', marginTop: 4, background: 'rgba(2,6,16,0.6)', padding: 10, borderRadius: 6 }}>{viewRecord.description || 'No detailed log provided.'}</p></div>
              {viewRecord.resolutionNotes && (
                <div>RESOLUTION NOTES: <p style={{ color: '#00ff9d', marginTop: 4, background: 'rgba(0,255,157,0.06)', border: '1px solid rgba(0,255,157,0.2)', padding: 10, borderRadius: 6 }}>{viewRecord.resolutionNotes}</p></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewRecord(null)} className="btn btn-primary">Close Dossier</button>
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