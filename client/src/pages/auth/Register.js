import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import BackgroundCanvas from '../../components/shared/BackgroundCanvas';
import NavisCursor from '../../components/shared/NavisCursor';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'driver',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('All credential fields required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passcodes do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Passcode must be at least 6 characters');
      return;
    }
    setLoading(true);
    playClickSound();

    try {
      const { confirmPassword, ...data } = form;
      const user = await register(data);
      playActionConfirm();
      toast.success('Personnel credentials established!');
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/driver/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavisCursor />
      <BackgroundCanvas variant="auth" />

      <div
        className="auth-page"
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 16px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          className="hud-bracket auth-card"
          style={{
            width: '100%',
            maxWidth: '520px',
            background: 'rgba(5, 14, 28, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '8px',
            padding: '36px 32px',
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)',
            color: '#f1f8ff',
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '20px',
                background: 'rgba(0, 255, 157, 0.08)',
                border: '1px solid rgba(0, 255, 157, 0.35)',
                color: '#00ff9d',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '10px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 6px #00ff9d' }} />
              PERSONNEL ENLISTMENT PROTOCOL
            </div>

            <h1
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '2px',
                margin: 0,
                color: '#f1f8ff',
              }}
            >
              ENLIST // <span style={{ color: '#00f0ff' }}>NAVISLOG</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  className="form-control"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Access Role</label>
                <select
                  className="form-control"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="driver">PILOT (DRIVER)</option>
                  <option value="admin">COMMANDER (ADMIN)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Official Network Email *</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="personnel@navislog.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Passcode *</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Min. 6 chars"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm Passcode *</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Repeat passcode"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={labelStyle}>Comms / Phone</label>
                <input
                  className="form-control"
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Base Sector</label>
                <input
                  className="form-control"
                  placeholder="Terminal 1"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={playHoverSound}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '14px', letterSpacing: '1.5px' }}
            >
              {loading ? 'ENCRYPTING & COMMITTING...' : '[ ESTABLISH PERSONNEL CREDENTIALS ]'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(0, 240, 255, 0.12)' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Already enlisted? </span>
            <Link
              to="/login"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#00f0ff',
                textDecoration: 'none',
                letterSpacing: '0.5px',
              }}
            >
              AUTHENTICATE HERE ➔
            </Link>
          </div>
        </div>
      </div>
    </>
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