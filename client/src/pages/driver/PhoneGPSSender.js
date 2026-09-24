import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { playHoverTick, playActionConfirm, playAlertBeep } from '../../utils/audioSynth';
import BackgroundCanvas from '../../components/shared/BackgroundCanvas';

const API_URL = "http://10.125.35.139:5000/api";

function PhoneGPSSender() {
  const [driverId, setDriverId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("STANDBY");
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: 0,
    heading: null,
  });
  const [packetsSent, setPacketsSent] = useState(0);

  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const sendGPS = async (position) => {
    try {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const speedKmh = speed !== null && speed !== undefined ? Math.max(0, speed * 3.6) : 0;

      setLocation({
        latitude,
        longitude,
        accuracy,
        speed: speedKmh,
        heading,
      });

      const now = Date.now();
      // Send every 5 seconds
      if (now - lastSentRef.current < 5000) {
        return;
      }

      lastSentRef.current = now;

      if (!driverId) {
        setStatus("ID REQUIRED");
        return;
      }

      const payload = {
        driverId,
        latitude,
        longitude,
        speed: speedKmh,
        heading,
      };

      await axios.post(`${API_URL}/telemetry/phone-gps`, payload);
      setPacketsSent((prev) => prev + 1);
      setStatus("TELEMETRY TRANSMITTING // ACTIVE");
    } catch (error) {
      console.error("PHONE GPS ERROR:", error);
      setStatus(error.response?.data?.message || "TRANSMISSION LINK FAILED");
    }
  };

  const handleGPSError = (error) => {
    console.error("GPS ERROR:", error);
    setTracking(false);
    playAlertBeep();

    switch (error.code) {
      case 1:
        setStatus("GEO-PERM DENIED");
        break;
      case 2:
        setStatus("POSITION UNAVAILABLE");
        break;
      case 3:
        setStatus("GPS SYNC TIMEOUT");
        break;
      default:
        setStatus("HARDWARE SENSOR ERROR");
    }
  };

  const startTracking = () => {
    if (!driverId) {
      setStatus("ENTER OPERATOR ID");
      playAlertBeep();
      return;
    }

    if (!navigator.geolocation) {
      setStatus("GEOLOCATION UNSUPPORTED");
      playAlertBeep();
      return;
    }

    playActionConfirm();
    setStatus("INITIALIZING SATELLITE LOCK...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTracking(true);
        setStatus("ORBITAL LINK ESTABLISHED");
        sendGPS(position);

        const watchId = navigator.geolocation.watchPosition(
          sendGPS,
          handleGPSError,
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000,
          }
        );

        watchIdRef.current = watchId;
      },
      handleGPSError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    playAlertBeep();
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
    setStatus("TRANSMISSION TERMINATED");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        background: "radial-gradient(circle at top, #060b14 0%, #020408 100%)",
        color: "#f8fafc",
        fontFamily: "'Share Tech Mono', monospace",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <BackgroundCanvas variant="driver-gps" />
      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

      <div
        className="hud-bracket"
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(6, 11, 20, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.08)",
          padding: "28px 24px",
          position: "relative",
        }}
      >
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 12px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              background: "rgba(0, 240, 255, 0.05)",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 24, animation: tracking ? "radar-pulse 2s infinite ease-in-out" : "none" }}>
              📡
            </span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#00f0ff", textTransform: "uppercase" }}>
            NAVISLOG SATELLITE BEACON
          </div>
          <h1
            style={{
              fontSize: 20,
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 800,
              margin: "6px 0 0 0",
              letterSpacing: "0.08em",
              color: "#ffffff",
              textShadow: "0 0 10px rgba(0, 240, 255, 0.4)",
            }}
          >
            TACTICAL GPS STREAMER
          </h1>
          <p style={{ color: "#64748b", fontSize: 11, marginTop: 4, margin: 0 }}>
            DISPATCH UPLINK // FREQ: 5.0s SYNC
          </p>
        </div>

        {/* Input Field */}
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 11,
            color: "#94a3b8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          OPERATOR MONGO ID TOKEN
        </label>

        <input
          type="text"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          placeholder="ENTER DRIVER ID TOKEN"
          disabled={tracking}
          onMouseEnter={() => playHoverTick()}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "rgba(2, 6, 23, 0.8)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            color: "#00f0ff",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 20,
            opacity: tracking ? 0.6 : 1,
          }}
        />

        {/* Action Button */}
        {!tracking ? (
          <button
            onClick={startTracking}
            onMouseEnter={() => playHoverTick()}
            style={{
              width: "100%",
              padding: 14,
              border: "1px solid #00f0ff",
              background: "rgba(0, 240, 255, 0.15)",
              color: "#00f0ff",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)",
              transition: "all 0.2s ease",
            }}
          >
            INITIALIZE GPS BEACON
          </button>
        ) : (
          <button
            onClick={stopTracking}
            onMouseEnter={() => playHoverTick()}
            style={{
              width: "100%",
              padding: 14,
              border: "1px solid #ff0055",
              background: "rgba(255, 0, 85, 0.15)",
              color: "#ff0055",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(255, 0, 85, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            TERMINATE GPS TRANSMISSION
          </button>
        )}

        {/* Telemetry Status Monitor Box */}
        <div
          style={{
            marginTop: 24,
            padding: 18,
            background: "rgba(0, 240, 255, 0.02)",
            border: "1px solid rgba(0, 240, 255, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 10,
              borderBottom: "1px solid rgba(0, 240, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.15em" }}>BEACON STATUS</span>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tracking ? "#00f0ff" : "#ffaa00",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: tracking ? "#00f0ff" : "#ffaa00",
                  boxShadow: tracking ? "0 0 8px #00f0ff" : "none",
                }}
              />
              {status}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>LATITUDE:</span>
            <strong style={{ color: "#f8fafc" }}>
              {location.latitude !== null ? location.latitude.toFixed(6) : "STANDBY"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>LONGITUDE:</span>
            <strong style={{ color: "#f8fafc" }}>
              {location.longitude !== null ? location.longitude.toFixed(6) : "STANDBY"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>ACCURACY:</span>
            <strong style={{ color: "#00f0ff" }}>
              {location.accuracy !== null ? `${Math.round(location.accuracy)} M` : "STANDBY"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>SPEED VECTOR:</span>
            <strong style={{ color: "#00f0ff" }}>
              {location.speed.toFixed(1)} KM/H
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>BEARING:</span>
            <strong style={{ color: "#f8fafc" }}>
              {location.heading !== null ? `${Math.round(location.heading)}°` : "N/A"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: 6, borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#64748b" }}>BURSTS TRANSMITTED:</span>
            <strong style={{ color: "#a855f7" }}>
              {packetsSent} PACKETS
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneGPSSender;