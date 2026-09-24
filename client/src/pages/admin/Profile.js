import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { playHoverSound, playClickSound, playActionConfirm } from '../../utils/audioSynth';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || '');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      playClickSound();
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.fullName) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      if (photo) fd.append('profilePhoto', photo);
      const { data } = await API.put('/auth/profile', fd);
      playActionConfirm();
      updateUser(data.user);
      toast.success('Operator profile credentials updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('All security fields required'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passcodes do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Passcode must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      playActionConfirm();
      toast.success('Security passcode rotated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Tactical Command Profile" bgVariant="dashboard">
      <style>{`
        .input-dark-profile {
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

        .input-dark-profile:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .tab-btn-profile {
          padding: 10px 22px;
          border-radius: 6px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .tab-btn-profile.active {
          background: #00f0ff;
          color: #02050e;
          border-color: #00f0ff;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .tab-btn-profile.inactive {
          background: rgba(5, 14, 28, 0.7);
          color: #94a3b8;
        }

        .tab-btn-profile.inactive:hover {
          color: #f1f8ff;
          border-color: #00f0ff;
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Operator Identity Banner */}
        <div className="hud-bracket hud-glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f0ff, #0066ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: '#02050e',
                overflow: 'hidden',
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
                border: '2px solid #00f0ff',
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              {photoPreview ? <img src={photoPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.fullName?.[0] || 'O'}
            </div>

            <label
              htmlFor="photo-input"
              onMouseEnter={playHoverSound}
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                background: '#00f0ff',
                border: '2px solid #02050e',
                borderRadius: '4px',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ✏️
              <input id="photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </label>
          </div>

          <div>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00ff9d', letterSpacing: '1px' }}>
              ● ACTIVE OPERATOR DOSSIER
            </span>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: '#f1f8ff', margin: '4px 0 2px 0' }}>
              {user?.fullName}
            </h2>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#94a3b8' }}>
              {user?.email}
            </div>
            <span
              className="badge badge-info"
              style={{ marginTop: 8 }}
            >
              ROLE: {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className={`tab-btn-profile ${tab === 'profile' ? 'active' : 'inactive'}`}
            onClick={() => { playClickSound(); setTab('profile'); }}
            onMouseEnter={playHoverSound}
          >
            👤 EDIT DOSSIER
          </button>
          <button
            className={`tab-btn-profile ${tab === 'security' ? 'active' : 'inactive'}`}
            onClick={() => { playClickSound(); setTab('security'); }}
            onMouseEnter={playHoverSound}
          >
            🔒 ROTATE PASSCODE
          </button>
        </div>

        {/* Tab Content 1: Profile Information */}
        {tab === 'profile' && (
          <div className="hud-bracket hud-glass-panel">
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
              PERSONAL SPECIFICATIONS
            </h3>

            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Operator Name *</label>
                  <input
                    className="input-dark-profile"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secure Comms / Phone</label>
                  <input
                    className="input-dark-profile"
                    placeholder="+91 00000 00000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Station / Base Sector</label>
                  <input
                    className="input-dark-profile"
                    placeholder="Terminal 1"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Network ID (Read Only)</label>
                  <input
                    className="input-dark-profile"
                    value={user?.email || ''}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Transmitting...' : 'Update Dossier'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 2: Change Password */}
        {tab === 'security' && (
          <div className="hud-bracket hud-glass-panel">
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 800, color: '#f1f8ff', margin: '0 0 16px 0' }}>
              ROTATE SECURITY PASSCODE
            </h3>

            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Current Passcode *</label>
                  <input
                    type="password"
                    className="input-dark-profile"
                    placeholder="••••••••"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>New Passcode *</label>
                  <input
                    type="password"
                    className="input-dark-profile"
                    placeholder="Min. 6 alphanumeric chars"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Passcode *</label>
                  <input
                    type="password"
                    className="input-dark-profile"
                    placeholder="Repeat new passcode"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Encrypting...' : 'Commit Passcode Rotation'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
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