import React, { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../utils/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { playHoverSound, playClickSound, playLockSound, playActionConfirm } from "../../utils/audioSynth";

// =============================================================================
// COORDINATE & STATUS VALIDATION HELPERS
// =============================================================================

/**
 * Validates GPS latitude and longitude strictly.
 * Discards null, undefined, NaN, Infinity, and out-of-range values.
 * Latitude range: -90 to 90. Longitude range: -180 to 180.
 */
export function getValidCoordinates(telemetry) {
  if (!telemetry) return null;
  const lat = Number(telemetry.latitude);
  const lng = Number(telemetry.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Computes status based on telemetry freshness.
 * Active: < 35 seconds, Idle/Recent: < 5 minutes, Stale: >= 5 minutes or missing.
 */
export function getGPSStatus(telemetry) {
  if (!telemetry) return { online: false, label: "NO SIGNAL", color: "#64748b", badge: "badge-secondary" };
  const coords = getValidCoordinates(telemetry);
  if (!coords) return { online: false, label: "INVALID GPS", color: "#ef4444", badge: "badge-danger" };
  if (!telemetry.timestamp) return { online: false, label: "STANDBY", color: "#ffaa00", badge: "badge-warning" };

  const lastUpdate = new Date(telemetry.timestamp).getTime();
  const diffMs = Date.now() - lastUpdate;
  if (diffMs < 35000) {
    return { online: true, label: "ACTIVE LOCK", color: "#00ff9d", badge: "badge-success" };
  } else if (diffMs < 300000) {
    return { online: false, label: "IDLE / RECENT", color: "#ffaa00", badge: "badge-warning" };
  } else {
    return { online: false, label: "STALE SIGNAL", color: "#ef4444", badge: "badge-danger" };
  }
}

// =============================================================================
// MAP TILE SOURCES (CLEAR ROADS, HIGHWAYS, AND LABELS)
// =============================================================================
const MAP_STYLES = {
  streets: {
    id: "streets",
    name: "Google / Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    className: "leaflet-tiles-streets",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  dark: {
    id: "dark",
    name: "Tactical Dark",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    className: "leaflet-tiles-dark",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    id: "satellite",
    name: "Satellite / Aerial",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abc",
    className: "leaflet-tiles-satellite",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  }
};

// =============================================================================
// CUSTOM VECTOR MARKER (HIGH-VISIBILITY HUD PIN WITH PLATE & STATUS)
// =============================================================================
const createTacticalIcon = (vehicle, telemetry, isSelected, isFollowed) => {
  const status = getGPSStatus(telemetry);
  const color = isFollowed ? '#00f0ff' : status.color;
  const plate = vehicle?.licensePlate || "UNIT";
  const speed = Math.round(Number(telemetry?.speed) || 0);

  return L.divIcon({
    className: 'navislog-custom-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        <!-- Plate Callout Pill -->
        <div style="
          background: rgba(3, 9, 20, 0.94);
          border: 1px solid ${isSelected || isFollowed ? '#00f0ff' : color};
          border-radius: 4px;
          padding: 2px 6px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          color: ${isSelected || isFollowed ? '#00f0ff' : '#f1f8ff'};
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.85), 0 0 ${isSelected || isFollowed ? '12px #00f0ff' : '5px ' + color};
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.5px;
        ">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
          <span>${plate}</span>
          ${speed > 0 ? `<span style="color: #00ff9d; font-size: 9px; font-weight: 800;">${speed}k</span>` : ''}
        </div>

        <!-- Beacon Pin -->
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          ${status.online ? `
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              border: 2px solid ${color};
              animation: markerPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              opacity: 0.8;
            "></div>
          ` : ''}
          ${isSelected || isFollowed ? `
            <div style="
              position: absolute;
              inset: -5px;
              border-radius: 50%;
              border: 2px dashed #00f0ff;
              animation: markerRotate 4s linear infinite;
              opacity: 0.95;
            "></div>
          ` : ''}
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 10px ${color}, 0 2px 6px rgba(0,0,0,0.9);
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 4px; height: 4px; border-radius: 50%; background: #030914;"></div>
          </div>
        </div>

        <!-- Ground Pointer Triangle -->
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid ${color};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [120, 56],
    iconAnchor: [60, 56],
    popupAnchor: [0, -56],
    tooltipAnchor: [0, -56],
  });
};

// =============================================================================
// MAP VIEWPORT CONTROLLER (DECOUPLED FROM BACKGROUND TELEMETRY UPDATES)
// =============================================================================
function MapViewController({
  validVehicles,
  selectedVehicleId,
  isFollowing,
  onUserMapInteraction,
  initialBoundsFittedRef,
  mapRef
}) {
  const map = useMap();

  useEffect(() => {
    window.__navisMap = map;
    if (mapRef) {
      mapRef.current = map;
    }
    return () => {
      window.__navisMap = null;
    };
  }, [map, mapRef]);

  // Listen to manual map interactions to immediately disengage follow mode
  useMapEvents({
    dragstart: () => {
      onUserMapInteraction();
    },
    zoomstart: (e) => {
      if (e.originalEvent) {
        onUserMapInteraction();
      }
    },
    movestart: (e) => {
      if (e.originalEvent) {
        onUserMapInteraction();
      }
    }
  });

  // Fit bounds to all valid vehicles ONLY ONCE upon initial data load
  useEffect(() => {
    if (initialBoundsFittedRef.current) return;
    if (validVehicles.length === 0) return;

    const coordsList = validVehicles.map((v) => getValidCoordinates(v.telemetry)).filter(Boolean);
    if (coordsList.length === 0) return;

    if (coordsList.length === 1) {
      map.setView([coordsList[0].lat, coordsList[0].lng], 14, { animate: false });
    } else {
      const bounds = L.latLngBounds(coordsList.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false });
    }
    initialBoundsFittedRef.current = true;
  }, [validVehicles, map, initialBoundsFittedRef]);

  // Track followed vehicle ONLY when explicit Follow Mode is active
  useEffect(() => {
    if (!isFollowing || !selectedVehicleId) return;
    const target = validVehicles.find((v) => v.vehicle?._id === selectedVehicleId);
    const coords = getValidCoordinates(target?.telemetry);
    if (coords) {
      map.panTo([coords.lat, coords.lng], { animate: true, duration: 0.6 });
    }
  }, [validVehicles, selectedVehicleId, isFollowing, map]);

  return null;
}

// =============================================================================
// MAIN COMPONENT: ADMIN LIVE TRACKING
// =============================================================================
export default function AdminLiveTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [mapStyleKey, setMapStyleKey] = useState("streets");

  const initialBoundsFittedRef = useRef(false);
  const mapRef = useRef(null);

  const fetchLiveTracking = async () => {
    try {
      const { data } = await API.get("/telemetry/latest");
      setVehicles(data.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("LIVE TRACKING ERROR:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTracking();
    const interval = setInterval(fetchLiveTracking, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter vehicles that have strictly valid coordinates
  const validVehicles = useMemo(() => {
    return vehicles.filter((item) => getValidCoordinates(item.telemetry) !== null);
  }, [vehicles]);

  // User interactions stop follow mode immediately to preserve user view
  const handleUserMapInteraction = () => {
    if (isFollowing) {
      setIsFollowing(false);
    }
  };

  // Explicit Action: Fit all vehicles on demand
  const handleFitFleet = () => {
    playClickSound();
    setIsFollowing(false);
    if (!mapRef.current) return;
    const coordsList = validVehicles.map((v) => getValidCoordinates(v.telemetry)).filter(Boolean);
    if (coordsList.length === 1) {
      mapRef.current.setView([coordsList[0].lat, coordsList[0].lng], 14, { animate: true });
    } else if (coordsList.length > 1) {
      const bounds = L.latLngBounds(coordsList.map((c) => [c.lat, c.lng]));
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  };

  // Explicit Action: Center on single vehicle once
  const handleCenterVehicle = (item) => {
    playLockSound();
    setSelectedItem(item);
    setIsFollowing(false);
    const coords = getValidCoordinates(item.telemetry);
    if (mapRef.current && coords) {
      mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  };

  // Explicit Action: Toggle follow mode
  const handleToggleFollow = (item) => {
    playActionConfirm();
    if (selectedItem?.vehicle?._id === item?.vehicle?._id && isFollowing) {
      setIsFollowing(false);
    } else {
      setSelectedItem(item);
      setIsFollowing(true);
      const coords = getValidCoordinates(item.telemetry);
      if (mapRef.current && coords) {
        mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
      }
    }
  };

  return (
    <AppLayout title="Live Fleet Tactical Map" bgVariant="tracking">
      <style>{`
        @keyframes markerPing {
          75%, 100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }

        @keyframes markerRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .navislog-custom-marker {
          background: transparent !important;
          border: none !important;
        }

        .map-frame-tactical {
          background: rgba(5, 14, 28, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.15);
          margin-bottom: 24px;
          position: relative;
        }

        .map-controls-floating-top {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .map-status-floating-top {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hud-pill-button {
          background: rgba(3, 9, 20, 0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hud-pill-button:hover,
        .hud-pill-button.active {
          color: #00f0ff;
          border-color: #00f0ff;
          background: rgba(0, 240, 255, 0.14);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.25);
        }

        .hud-pill-following {
          background: rgba(0, 240, 255, 0.20);
          backdrop-filter: blur(12px);
          border: 1px solid #00f0ff;
          border-radius: 6px;
          padding: 6px 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #00f0ff;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.35);
        }

        .map-empty-overlay {
          position: absolute;
          inset: 0;
          z-index: 450;
          background: rgba(3, 9, 20, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          pointer-events: none;
        }

        .leaflet-tiles-streets {
          filter: none !important;
        }

        .leaflet-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(110%) saturate(0.6) !important;
        }

        .leaflet-tiles-satellite {
          filter: brightness(0.95) contrast(1.05) !important;
        }

        /* Leaflet Dark Tooltip & Popup Custom Styling */
        .leaflet-tooltip {
          background: rgba(3, 9, 20, 0.95) !important;
          color: #f1f8ff !important;
          border: 1px solid rgba(0, 240, 255, 0.5) !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.85) !important;
          padding: 8px 12px !important;
        }

        .leaflet-tooltip-top:before {
          border-top-color: rgba(0, 240, 255, 0.5) !important;
        }

        .leaflet-popup-content-wrapper {
          background: rgba(5, 14, 28, 0.96) !important;
          color: #f1f8ff !important;
          border: 1px solid #00f0ff !important;
          border-radius: 8px !important;
          box-shadow: 0 0 35px rgba(0, 240, 255, 0.35), 0 10px 30px rgba(0,0,0,0.95) !important;
        }

        .leaflet-popup-tip {
          background: #050c18 !important;
        }

        .vehicle-card-tactical {
          background: rgba(5, 14, 28, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.18);
          border-radius: 8px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .vehicle-card-tactical:hover,
        .vehicle-card-tactical.active {
          transform: translateY(-3px);
          border-color: #00f0ff;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.25), 0 15px 35px rgba(0, 0, 0, 0.8);
        }

        .metric-pill-tactical {
          background: rgba(2, 6, 16, 0.65);
          border: 1px solid rgba(0, 240, 255, 0.12);
          border-radius: 6px;
          padding: 8px 12px;
        }
      `}</style>

      {/* Top Header Card */}
      <div
        className="hud-bracket"
        style={{
          background: "rgba(5, 14, 28, 0.75)",
          border: "1px solid rgba(0, 240, 255, 0.2)",
          borderRadius: "8px",
          padding: "16px 22px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
            ● SATELLITE TELEMETRY // REAL-TIME GEOLOCATION
          </span>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
            TACTICAL FLEET POSITIONING
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="badge badge-success">
            ● {validVehicles.length} of {vehicles.length} Units Online
          </span>

          {lastRefresh && (
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#38bdf8" }}>
              SYNC: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Dark Map Canvas with HUD framing & Google Maps-style controls */}
      <div className="map-frame-tactical hud-bracket">
        {/* Floating Top-Left Status & Following Indicator */}
        <div className="map-status-floating-top">
          <div
            style={{
              background: "rgba(3, 9, 20, 0.88)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              borderRadius: 6,
              padding: "6px 12px",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: "#00ff9d",
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff9d", boxShadow: "0 0 8px #00ff9d" }} />
            RADAR ACTIVE // {validVehicles.length} TRANSPONDERS
          </div>

          {isFollowing && selectedItem && (
            <div className="hud-pill-following">
              <span>🎯 FOLLOWING: <strong>{selectedItem.vehicle?.licensePlate}</strong></span>
              <span style={{ opacity: 0.7, fontSize: 10 }}>(Pan map to stop)</span>
              <button
                onClick={() => setIsFollowing(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff0055",
                  fontWeight: 900,
                  cursor: "pointer",
                  marginLeft: 4,
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Floating Top-Right Map Controls (Fit All + Map Style Switcher) */}
        <div className="map-controls-floating-top">
          <button
            onClick={handleFitFleet}
            className="hud-pill-button"
            title="Fit viewport to show all available vehicle locations"
          >
            ⛶ FIT ALL FLEET ({validVehicles.length})
          </button>

          {Object.keys(MAP_STYLES).map((key) => {
            const styleObj = MAP_STYLES[key];
            const isActive = mapStyleKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  playClickSound();
                  setMapStyleKey(key);
                }}
                className={`hud-pill-button ${isActive ? "active" : ""}`}
              >
                {styleObj.name}
              </button>
            );
          })}
        </div>

        {/* Map Container */}
        {loading ? (
          <div style={{ height: 540, display: "flex", alignItems: "center", justifyContent: "center", color: "#00f0ff", fontFamily: "'Share Tech Mono', monospace", fontSize: "14px" }}>
            📡 ACQUIRING ORBITAL TELEMETRY LOCK...
          </div>
        ) : (
          <div style={{ position: "relative", height: "540px", width: "100%" }}>
            <MapContainer
              center={[11.0168, 76.9558]}
              zoom={12}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={true}
            >
              <TileLayer
                key={mapStyleKey}
                attribution={MAP_STYLES[mapStyleKey].attribution}
                url={MAP_STYLES[mapStyleKey].url}
                subdomains={MAP_STYLES[mapStyleKey].subdomains}
                className={MAP_STYLES[mapStyleKey].className}
                maxZoom={19}
              />

              <MapViewController
                validVehicles={validVehicles}
                selectedVehicleId={selectedItem?.vehicle?._id}
                isFollowing={isFollowing}
                onUserMapInteraction={handleUserMapInteraction}
                initialBoundsFittedRef={initialBoundsFittedRef}
                mapRef={mapRef}
              />

              {validVehicles.map((item) => {
                const vehicle = item.vehicle;
                const telemetry = item.telemetry;
                const coords = getValidCoordinates(telemetry);
                if (!coords) return null;

                const isSelected = selectedItem?.vehicle?._id === vehicle._id;
                const isFollowed = isFollowing && isSelected;
                const status = getGPSStatus(telemetry);

                return (
                  <Marker
                    key={vehicle._id}
                    position={[coords.lat, coords.lng]}
                    icon={createTacticalIcon(vehicle, telemetry, isSelected, isFollowed)}
                    eventHandlers={{
                      click: () => {
                        playLockSound();
                        setSelectedItem(item);
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -32]} opacity={0.96}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", lineHeight: "1.4" }}>
                        <strong style={{ color: "#00f0ff" }}>{vehicle.make} {vehicle.model}</strong>
                        <div style={{ color: "#cbd5e1" }}>[{vehicle.licensePlate}]</div>
                        <div style={{ color: "#f1f8ff" }}>Pilot: {telemetry.driver?.fullName || "Unassigned"}</div>
                        <div style={{ color: "#00ff9d" }}>Speed: {Math.round(telemetry.speed || 0)} km/h</div>
                        <div style={{ color: status.color, fontSize: "10px" }}>● {status.label}</div>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div style={{ minWidth: 230, padding: "6px" }}>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, color: "#f1f8ff", fontWeight: 800, marginBottom: 4 }}>
                          {vehicle.make} {vehicle.model}
                        </div>

                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#00f0ff", fontWeight: 700, marginBottom: 8 }}>
                          [{vehicle.licensePlate}]
                        </div>

                        <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                          PILOT: <strong style={{ color: '#f1f8ff' }}>{telemetry.driver?.fullName || "Unassigned"}</strong>
                        </div>

                        <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                          SPEED: <strong style={{ color: "#00ff9d", fontFamily: "'Share Tech Mono', monospace" }}>{Math.round(telemetry.speed ?? 0)} km/h</strong>
                        </div>

                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                          COORD: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <span className={`badge ${status.badge}`}>
                            ● {status.label}
                          </span>
                          {telemetry.timestamp && (
                            <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6, fontFamily: "'Share Tech Mono', monospace" }}>
                              {new Date(telemetry.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => handleCenterVehicle(item)}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              background: "rgba(0, 240, 255, 0.15)",
                              border: "1px solid #00f0ff",
                              borderRadius: 4,
                              color: "#00f0ff",
                              fontSize: 11,
                              fontFamily: "'Share Tech Mono', monospace",
                              cursor: "pointer",
                            }}
                          >
                            🎯 CENTER
                          </button>

                          <button
                            onClick={() => handleToggleFollow(item)}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              background: isFollowed ? "rgba(255, 0, 85, 0.2)" : "rgba(0, 255, 157, 0.15)",
                              border: isFollowed ? "1px solid #ff0055" : "1px solid #00ff9d",
                              borderRadius: 4,
                              color: isFollowed ? "#ff0055" : "#00ff9d",
                              fontSize: 11,
                              fontFamily: "'Share Tech Mono', monospace",
                              cursor: "pointer",
                            }}
                          >
                            {isFollowed ? "⏹ STOP" : "🛰 FOLLOW"}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Empty State Overlay */}
            {!loading && validVehicles.length === 0 && (
              <div className="map-empty-overlay">
                <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f8ff", marginBottom: 6 }}>
                  NO ACTIVE SATELLITE BEACONS DETECTED
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#94a3b8", maxWidth: 440 }}>
                  No vehicles are currently broadcasting valid GPS coordinates. Fleet transponders may be powered down or parked in hangar depot.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Vehicle Holographic HUD Detail (if active) */}
      {selectedItem && (
        <div
          className="hud-bracket"
          style={{
            background: 'rgba(5, 14, 28, 0.9)',
            border: '1px solid #00f0ff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#00ff9d' }}>
                // TARGET UNIT TELEMETRY LOCK
              </span>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 800, margin: 0, color: '#f1f8ff' }}>
                {selectedItem.vehicle?.make} {selectedItem.vehicle?.model} [{selectedItem.vehicle?.licensePlate}]
              </h3>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleCenterVehicle(selectedItem)}
                style={{
                  background: 'rgba(0, 240, 255, 0.15)',
                  border: '1px solid #00f0ff',
                  borderRadius: 4,
                  color: '#00f0ff',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                }}
              >
                🎯 FOCUS ON MAP
              </button>

              <button
                onClick={() => handleToggleFollow(selectedItem)}
                style={{
                  background: isFollowing ? 'rgba(255, 0, 85, 0.2)' : 'rgba(0, 255, 157, 0.15)',
                  border: isFollowing ? '1px solid #ff0055' : '1px solid #00ff9d',
                  borderRadius: 4,
                  color: isFollowing ? '#ff0055' : '#00ff9d',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                }}
              >
                {isFollowing ? '⏹ STOP FOLLOWING' : '🛰 FOLLOW VEHICLE'}
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                ✕ DISMISS
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="metric-pill-tactical">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>VELOCITY</div>
              <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 16, color: '#00ff9d' }}>
                ⚡ {selectedItem.telemetry?.speed ?? 0} km/h
              </strong>
            </div>

            <div className="metric-pill-tactical">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>PILOT</div>
              <strong style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: '#f1f8ff' }}>
                👤 {selectedItem.telemetry?.driver?.fullName || "Unassigned"}
              </strong>
            </div>

            <div className="metric-pill-tactical">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>LATITUDE</div>
              <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: '#00f0ff' }}>
                {selectedItem.telemetry?.latitude ? Number(selectedItem.telemetry.latitude).toFixed(5) : '—'}
              </strong>
            </div>

            <div className="metric-pill-tactical">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#64748b' }}>LONGITUDE</div>
              <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: '#00f0ff' }}>
                {selectedItem.telemetry?.longitude ? Number(selectedItem.telemetry.longitude).toFixed(5) : '—'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Grid Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {vehicles.map((item) => {
          const vehicle = item.vehicle;
          const telemetry = item.telemetry;
          const coords = getValidCoordinates(telemetry);
          const hasGPS = coords !== null;
          const status = getGPSStatus(telemetry);
          const isSelected = selectedItem?.vehicle?._id === vehicle._id;

          return (
            <div
              className={`hud-bracket vehicle-card-tactical ${isSelected ? 'active' : ''}`}
              key={vehicle._id}
              onClick={() => {
                playClickSound();
                setSelectedItem(item);
                if (hasGPS && mapRef.current) {
                  mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
                }
              }}
              onMouseEnter={playHoverSound}
              data-hud-label={vehicle.licensePlate}
              style={{
                borderLeft: `3px solid ${status.color}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 800, color: "#f1f8ff" }}>
                    {vehicle.make} {vehicle.model}
                  </div>
                  <code style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, background: "rgba(0,240,255,0.1)", color: "#00f0ff", padding: "2px 6px", borderRadius: 4 }}>
                    {vehicle.licensePlate}
                  </code>
                </div>

                <span className={`badge ${status.badge}`}>
                  ● {status.label}
                </span>
              </div>

              {!hasGPS ? (
                <div style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: "16px 0", fontFamily: "'Share Tech Mono', monospace" }}>
                  NO TRANSPONDER SIGNAL DETECTED.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  <div className="metric-pill-tactical">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#64748b" }}>SPEED</div>
                    <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, color: "#00ff9d" }}>
                      ⚡ {telemetry.speed ?? 0} km/h
                    </strong>
                  </div>

                  <div className="metric-pill-tactical">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#64748b" }}>PILOT</div>
                    <strong style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#f1f8ff" }}>
                      👤 {telemetry.driver?.fullName || "Unassigned"}
                    </strong>
                  </div>

                  <div className="metric-pill-tactical">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#64748b" }}>LAT</div>
                    <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#cbd5e1" }}>
                      {coords.lat.toFixed(4)}
                    </strong>
                  </div>

                  <div className="metric-pill-tactical">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#64748b" }}>LNG</div>
                    <strong style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#cbd5e1" }}>
                      {coords.lng.toFixed(4)}
                    </strong>
                  </div>
                </div>
              )}

              {telemetry?.timestamp && (
                <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid rgba(0, 240, 255, 0.08)", fontSize: 10, color: "#64748b", fontFamily: "'Share Tech Mono', monospace", display: "flex", justifyContent: "space-between" }}>
                  <span>PING: {new Date(telemetry.timestamp).toLocaleTimeString()}</span>
                  {hasGPS && (
                    <span style={{ color: "#00f0ff", cursor: "pointer" }}>
                      [LOCATE]
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}