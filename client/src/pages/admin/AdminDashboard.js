import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import API from '../../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { playHoverSound } from '../../utils/audioSynth';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = { active: '#00ff9d', maintenance: '#ffaa00', inactive: '#ff003c', retired: '#00f0ff' };

function TacticalStatCard({ icon, label, value, color, sub, code }) {
  return (
    <div
      className="hud-bracket stat-card-tactical"
      onMouseEnter={playHoverSound}
      data-hud-label={label}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#475569' }}>
            [{code}]
          </span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {label}
          </span>
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: `${color}18`,
            border: `1px solid ${color}45`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '26px',
          fontWeight: '900',
          color: '#f1f8ff',
          letterSpacing: '0.5px',
          marginBottom: '4px',
          textShadow: `0 0 12px ${color}40`,
        }}
      >
        {value ?? '—'}
      </div>
      {sub ? (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#64748b' }}>
          {sub}
        </div>
      ) : (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
          LIVE MATRIX
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/reports/dashboard')
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats?.monthlyFuel?.map((m) => ({
    name: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    cost: m.cost,
    qty: m.qty,
  })) || [];

  const pieData = stats?.vehiclesByStatus?.map((s) => ({
    name: s._id?.toUpperCase(),
    value: s.count,
  })) || [];

  if (loading) return (
    <AppLayout title="Fleet Command Core" bgVariant="dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 110, borderRadius: 8, background: 'rgba(5, 14, 28, 0.6)', border: '1px solid rgba(0, 240, 255, 0.1)' }} />
        ))}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Fleet Command Core" bgVariant="dashboard">
      <style>{`
        .dashboard-grid-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card-tactical {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.18);
          border-radius: 8px;
          padding: 16px 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stat-card-tactical:hover {
          transform: translateY(-3px);
          border-color: #00f0ff;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.2), 0 15px 35px rgba(0, 0, 0, 0.8);
        }

        .chart-panel-tactical {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.18);
          border-radius: 10px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .dashboard-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 992px) {
          .dashboard-two-col {
            grid-template-columns: 1fr;
          }
        }

        .custom-table-dash {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .custom-table-dash th {
          text-align: left;
          padding: 10px 14px;
          color: #00f0ff;
          border-bottom: 1px solid rgba(0, 240, 255, 0.15);
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
        }

        .custom-table-dash td {
          padding: 11px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
          font-size: 12px;
        }

        .custom-table-dash tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Top Stats Overview Grid */}
      <div className="dashboard-grid-stats">
        <TacticalStatCard code="01" icon="🚛" label="Total Fleet" value={stats?.totalVehicles ?? 0} color="#00f0ff" />
        <TacticalStatCard code="02" icon="⚡" label="Active Units" value={stats?.activeVehicles ?? 0} color="#00ff9d" />
        <TacticalStatCard code="03" icon="🔧" label="Under Service" value={stats?.maintenanceVehicles ?? 0} color="#ffaa00" />
        <TacticalStatCard code="04" icon="👤" label="Driver Roster" value={stats?.totalDrivers ?? 0} color="#38bdf8" />
        <TacticalStatCard code="05" icon="🟢" label="Drivers Online" value={stats?.activeDrivers ?? 0} color="#00ff9d" />
        <TacticalStatCard
          code="06"
          icon="⛽"
          label="Energy Burn (₹)"
          value={stats?.fuelStats?.totalCost ? `₹${stats.fuelStats.totalCost.toLocaleString()}` : '₹0'}
          color="#ffaa00"
          sub={`${stats?.fuelStats?.count ?? 0} entries log`}
        />
        <TacticalStatCard code="07" icon="⚠️" label="Open Issues" value={stats?.openMaintenance ?? 0} color="#ffaa00" />
        <TacticalStatCard code="08" icon="🚨" label="Critical Alerts" value={stats?.criticalMaintenance ?? 0} color="#ff003c" />
      </div>

      {/* Charts Section */}
      <div className="dashboard-two-col">
        {/* Monthly Fuel Cost Chart */}
        <div className="hud-bracket chart-panel-tactical">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
              📈 MONTHLY ENERGY EXPENDITURE (₹)
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00f0ff' }}>
              // TELEMETRY TREND
            </span>
          </div>

          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
              NO CONSUMPTION LOGS RECORDED.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Share Tech Mono' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Share Tech Mono' }} />
                <Tooltip contentStyle={{ background: '#050c18', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '6px', color: '#fff', fontSize: '12px', fontFamily: 'Share Tech Mono' }} />
                <Area type="monotone" dataKey="cost" stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#fuelGradient)" name="Energy (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Vehicle Status Pie Chart */}
        <div className="hud-bracket chart-panel-tactical">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
              📊 FLEET OPERATIONAL STATUS
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00ff9d' }}>
              // STATUS MATRIX
            </span>
          </div>

          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
              NO FLEET VEHICLE RECORDS.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name?.toLowerCase()] || '#38bdf8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#050c18', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '6px', color: '#fff', fontSize: '12px', fontFamily: 'Share Tech Mono' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables Section */}
      <div className="dashboard-two-col">
        {/* Recent Fuel Entries */}
        <div className="hud-bracket chart-panel-tactical">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
              ⛽ RECENT ENERGY LOGS
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#ffaa00' }}>
              // LIVE TELEMETRY
            </span>
          </div>

          {stats?.recentFuel?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
              NO RECENT TRANSACTIONS.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table-dash">
                <thead>
                  <tr><th>Vehicle</th><th>Pilot</th><th>Volume</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  {stats?.recentFuel?.map((e) => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: '600', color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        {e.vehicle?.make} {e.vehicle?.model}
                      </td>
                      <td>{e.driver?.fullName}</td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff9d' }}>{e.fuelQuantity} L</td>
                      <td style={{ color: '#00f0ff', fontWeight: '700', fontFamily: "'Share Tech Mono', monospace" }}>₹{e.fuelCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Maintenance Issues */}
        <div className="hud-bracket chart-panel-tactical">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: '800', color: '#f1f8ff', margin: 0 }}>
              🛠️ SYSTEM MAINTENANCE LOGS
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#ff003c' }}>
              // ALERT QUEUE
            </span>
          </div>

          {stats?.recentMaintenance?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
              NO FAULTS DETECTED.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table-dash">
                <thead>
                  <tr><th>Vehicle</th><th>Issue</th><th>Severity</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats?.recentMaintenance?.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: '600', color: '#f1f8ff', fontFamily: "'Rajdhani', sans-serif" }}>
                        {r.vehicle?.make} {r.vehicle?.model}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{r.issueType?.replace('_', ' ')}</td>
                      <td>
                        <span className={`badge badge-${r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'info'}`}>
                          {r.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${r.status === 'resolved' ? 'success' : 'warning'}`}>
                          {r.status}
                        </span>
                      </td>
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