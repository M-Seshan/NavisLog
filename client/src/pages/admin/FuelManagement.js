import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

export default function FuelManagement() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({ vehicleId: '', driverId: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...filters });
      const [entriesRes, statsRes] = await Promise.all([
        API.get(`/fuel?${params}`),
        API.get('/fuel/stats'),
      ]);
      setEntries(entriesRes.data.entries || []);
      setTotal(entriesRes.data.total || 0);
      setPages(entriesRes.data.pages || 1);
      setStats(statsRes.data.stats || null);
    } catch {
      toast.error('Failed to load energy ledger');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    Promise.all([
      API.get('/vehicles?limit=100'),
      API.get('/drivers?limit=100'),
    ]).then(([v, d]) => {
      setVehicles(v.data.vehicles || []);
      setDrivers(d.data.drivers || []);
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Purge this energy transaction from the ledger?')) return;
    try {
      await API.delete(`/fuel/${id}`);
      playActionConfirm();
      toast.success('Energy log deleted');
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout title="Fleet Energy System" bgVariant="fuel">
      <style>{`
        .input-dark-fuel {
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

        .input-dark-fuel:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .custom-table-fuel {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .custom-table-fuel th {
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

        .custom-table-fuel td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
        }

        .custom-table-fuel tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● ENERGY PROPULSION LOGS // TOTAL TRANSACTIONS: {total}
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
          FLEET ENERGY & FUEL MATRIX
        </h2>
      </div>

      {/* Energy Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">TOTAL ENERGY EXPENDITURE</div>
          <div className="stat-value" style={{ color: '#00f0ff' }}>
            ₹{(stats?.totalCost || 0).toLocaleString()}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>
            {stats?.count || 0} TOTAL REFUELED SESSIONS
          </div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">TOTAL VOLUME CONSUMED</div>
          <div className="stat-value" style={{ color: '#00ff9d' }}>
            {(stats?.totalQty || 0).toLocaleString()} L
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>
            FLEET PROPULSION INGESTION
          </div>
        </div>

        <div className="hud-bracket stat-card" onMouseEnter={playHoverSound}>
          <div className="tech-label">AVG UNIT RATE</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>
            ₹{(stats?.avgCostPerLitre || 0).toFixed(2)} / L
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>
            BENCHMARK CONSUMPTION INDEX
          </div>
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
            className="input-dark-fuel"
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

        <div style={{ minWidth: '180px' }}>
          <select
            className="input-dark-fuel"
            style={{ width: '100%' }}
            value={filters.driverId}
            onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
          >
            <option value="">ALL PILOTS</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>{d.fullName}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            className="input-dark-fuel"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div>
          <input
            type="date"
            className="input-dark-fuel"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        {(filters.vehicleId || filters.driverId || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ vehicleId: '', driverId: '', startDate: '', endDate: '' })}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Energy Ledger Table */}
      <div className="hud-bracket hud-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '15px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
            ENERGY EXCHANGE LEDGER
          </h3>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00f0ff' }}>
            // TELEMETRY LOGS
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table-fuel">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Unit</th>
                <th>Pilot</th>
                <th>Volume</th>
                <th>Total Cost</th>
                <th>Odometer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                    SYNCHRONIZING ENERGY LEDGER...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                    NO ENERGY LOGS RECORDED.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} onMouseEnter={playHoverSound}>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
                      {new Date(entry.date).toLocaleDateString()}{' '}
                      <span style={{ color: '#00f0ff' }}>
                        {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        {entry.vehicle?.make} {entry.vehicle?.model}
                      </div>
                      <code style={{ fontSize: '11px', color: '#00f0ff', fontFamily: "'Share Tech Mono', monospace" }}>
                        {entry.vehicle?.licensePlate}
                      </code>
                    </td>

                    <td style={{ color: '#f1f8ff' }}>
                      👤 {entry.driver?.fullName || '—'}
                    </td>

                    <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff9d', fontWeight: '700' }}>
                      {entry.fuelQuantity} L
                    </td>

                    <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00f0ff', fontWeight: '800' }}>
                      ₹{entry.fuelCost?.toLocaleString()}
                    </td>

                    <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#cbd5e1' }}>
                      {entry.odometerReading ? `${entry.odometerReading.toLocaleString()} km` : '—'}
                    </td>

                    <td>
                      <button
                        onClick={() => { playClickSound(); handleDelete(entry._id); }}
                        onMouseEnter={playHoverSound}
                        className="btn btn-danger btn-sm"
                      >
                        PURGE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </AppLayout>
  );
}