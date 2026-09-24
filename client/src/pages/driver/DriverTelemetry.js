import React, { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { playHoverSound, playClickSound, playLockSound, playActionConfirm } from "../../utils/audioSynth";

export default function DriverTelemetry() {
  const { user } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("TRANSPONDER STANDBY");
  const [error, setError] = useState("");

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: 0,
    heading: null,
    timestamp: null,
  });

  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const stopTracking = () => {
    playClickSound();
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    setStatus("TRANSPONDER DISENGAGED");
  };

  const sendTelemetry = async (position) => {
    try {
      const coords = position.coords;
      const latitude = coords.latitude;
      const longitude = coords.longitude;
      const speed = coords.speed !== null ? Math.max(0, coords.speed * 3.6) : 0;
      const heading = coords.heading !== null ? coords.heading : null;
      const accuracy = coords.accuracy;

      setLocation({
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: new Date(),
      });

      const now = Date.now();
      if (now - lastSentRef.current < 5000) {
        return;
      }
      lastSentRef.current = now;

      const payload = {
        latitude,
        longitude,
        speed,
        heading,
        engineStatus: "on",
      };

      await API.post("/telemetry", payload);
      setStatus("SATELLITE BEACON STREAMING LIVE");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to transmit telemetry stream");
    }
  };

  const handleGPSError = (err) => {
    let message = "Unable to lock spatial coordinates.";
    switch (err.code) {
      case 1:
        message = "Geolocation permission denied. Enable browser location services.";
        break;
      case 2:
        message = "Spatial sensor unavailable. Check device antenna.";
        break;
      case 3:
        message = "Satellite handshake timeout.";
        break;
      default:
        message = "Telemetry exception occurred.";
    }
    setError(message);
    setStatus("SENSOR ERROR");
    setTracking(false);
  };

  const startTracking = () => {
    playLockSound();
    setError("");

    if (!navigator.geolocation) {
      setError("Browser spatial sensor unsupported.");
      return;
    }

    setStatus("ACQUIRING SATELLITE CONSTELLATION...");
    setTracking(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        playActionConfirm();
        sendTelemetry(position);
      },
      (err) => {
        handleGPSError(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    const id = navigator.geolocation.watchPosition(
      (position) => {
        sendTelemetry(position);
      },
      (err) => {
        handleGPSError(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = id;
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <AppLayout title="Live Telemetry Matrix" bgVariant="telemetry">
      <style>{`
        .gauge-tactical-cell {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          position: relative;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● LIVE SENSOR MATRIX // TRANSPONDER LINK
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
          PILOT SATELLITE TELEMETRY MATRIX
        </h2>
      </div>

      {/* Main Telemetry Cockpit Panel */}
      <div className="hud-bracket hud-glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: tracking ? '#00ff9d' : '#ffaa00' }}>
              ● STATUS: {status}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              UNIT: <strong>{user?.assignedVehicle?.make || 'Default'} {user?.assignedVehicle?.model || 'Unit'} [{user?.assignedVehicle?.licensePlate || 'STANDBY'}]</strong>
            </div>
          </div>

          <div>
            {tracking ? (
              <button
                onClick={stopTracking}
                onMouseEnter={playHoverSound}
                className="btn btn-danger"
              >
                [ DISENGAGE TELEMETRY LINK ]
              </button>
            ) : (
              <button
                onClick={startTracking}
                onMouseEnter={playHoverSound}
                className="btn btn-primary"
              >
                [ INITIALIZE SATELLITE TELEMETRY LINK ]
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 0, 60, 0.15)', border: '1px solid #ff003c', padding: '12px 16px', borderRadius: 6, color: '#ff003c', fontSize: 13, marginBottom: 20 }}>
            ✕ SENSOR HAZARD: {error}
          </div>
        )}

        {/* Tactical Gauges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Velocity */}
          <div className="gauge-tactical-cell">
            <div className="tech-label">VELOCITY (SPEED)</div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 42,
                fontWeight: 900,
                color: '#00ff9d',
                margin: '8px 0',
                textShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
              }}
            >
              {location.speed !== null ? Number(location.speed).toFixed(1) : '0.0'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#64748b' }}>KM / H</div>
          </div>

          {/* Latitude */}
          <div className="gauge-tactical-cell">
            <div className="tech-label">LATITUDE</div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 24,
                fontWeight: 800,
                color: '#00f0ff',
                margin: '18px 0 10px 0',
              }}
            >
              {location.latitude !== null ? Number(location.latitude).toFixed(6) : '—'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>GPS VECTOR NORTH/SOUTH</div>
          </div>

          {/* Longitude */}
          <div className="gauge-tactical-cell">
            <div className="tech-label">LONGITUDE</div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 24,
                fontWeight: 800,
                color: '#00f0ff',
                margin: '18px 0 10px 0',
              }}
            >
              {location.longitude !== null ? Number(location.longitude).toFixed(6) : '—'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>GPS VECTOR EAST/WEST</div>
          </div>

          {/* Accuracy & Heading */}
          <div className="gauge-tactical-cell">
            <div className="tech-label">SENSOR ACCURACY</div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 24,
                fontWeight: 800,
                color: '#38bdf8',
                margin: '18px 0 10px 0',
              }}
            >
              {location.accuracy !== null ? `±${Math.round(location.accuracy)} m` : '—'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>
              HEADING: {location.heading !== null ? `${Math.round(location.heading)}°` : 'N/A'}
            </div>
          </div>
        </div>

        {location.timestamp && (
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(0, 240, 255, 0.1)', textAlign: 'right', fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#64748b' }}>
            LAST PACKET BROADCAST: {location.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}