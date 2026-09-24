import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../utils/api";
import { playHoverSound, playClickSound, playLockSound, playActionConfirm } from "../../utils/audioSynth";

function AdminTrips() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    driver: "",
    vehicle: "",
    pickupLocation: "",
    dropLocation: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: ""
  });

  const fetchTripsData = () => {
    API.get("/drivers")
      .then((res) => setDrivers(res.data.drivers || res.data || []))
      .catch((err) => console.log("DRIVER ERROR:", err.response?.data));

    API.get("/vehicles")
      .then((res) => setVehicles(res.data.vehicles || res.data || []))
      .catch((err) => console.log("VEHICLE ERROR:", err.response?.data));

    API.get("/trips")
      .then((res) => setTrips(res.data || []))
      .catch((err) => console.log("TRIP LIST ERROR:", err.response?.data));
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const assignTrip = async () => {
    if (!form.driver || !form.vehicle || !form.pickupLocation || !form.dropLocation) {
      alert("Please fill all required tactical parameters (Pilot, Unit, Origin, Destination)");
      return;
    }

    if (!form.startDate || !form.startTime) {
      alert("Start Date and Start Time are required for mission launch");
      return;
    }

    if ((form.endDate && !form.endTime) || (!form.endDate && form.endTime)) {
      alert("Please provide both End Date and End Time together");
      return;
    }

    if (form.endDate && form.endTime) {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`);
      if (endDateTime <= startDateTime) {
        alert("Mission End timestamp must follow Launch timestamp");
        return;
      }
    }

    setLoading(true);
    playLockSound();

    try {
      await API.post("/trips/assign", form);
      playActionConfirm();
      alert("Mission Dispatched Successfully");

      setForm({
        driver: "",
        vehicle: "",
        pickupLocation: "",
        dropLocation: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: ""
      });

      fetchTripsData();
    } catch (error) {
      console.log("ASSIGN ERROR:", error.response?.data);
      alert(error.response?.data?.message || "Mission Dispatch Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Mission Control" bgVariant="trips">
      <style>{`
        .input-dark-trips {
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

        .input-dark-trips:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .custom-table-trips {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .custom-table-trips th {
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

        .custom-table-trips td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
          color: #cbd5e1;
        }

        .custom-table-trips tr:hover td {
          background: rgba(0, 240, 255, 0.04);
          color: #ffffff;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00ff9d", letterSpacing: "1.5px" }}>
          ● SECTOR DISPATCH // ACTIVE MISSIONS: {trips.length}
        </span>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: "#f1f8ff" }}>
          MISSION CONTROL & ROUTE DISPATCH
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth > 992 ? "1fr 2fr" : "1fr", gap: "24px" }}>
        {/* Assign Mission Form Panel */}
        <div className="hud-bracket hud-glass-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "15px", fontWeight: "800", color: "#f1f8ff", margin: 0 }}>
              DISPATCH FLIGHT PLAN
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#00f0ff" }}>
              // NEW VECTOR
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Driver */}
            <div>
              <label style={labelStyle}>Designate Pilot *</label>
              <select
                name="driver"
                value={form.driver}
                onChange={handleChange}
                className="input-dark-trips"
              >
                <option value="">Select Pilot...</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.fullName || driver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle */}
            <div>
              <label style={labelStyle}>Designate Unit *</label>
              <select
                name="vehicle"
                value={form.vehicle}
                onChange={handleChange}
                className="input-dark-trips"
              >
                <option value="">Select Unit...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.make} {vehicle.model} [{vehicle.licensePlate || vehicle.vehicleNumber || "Unknown"}]
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup & Drop Locations */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Origin Waypoint *</label>
                <input
                  type="text"
                  name="pickupLocation"
                  placeholder="Sector Alpha / Port"
                  value={form.pickupLocation}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>

              <div>
                <label style={labelStyle}>Destination Terminal *</label>
                <input
                  type="text"
                  name="dropLocation"
                  placeholder="Terminal Bravo"
                  value={form.dropLocation}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>
            </div>

            {/* Start Date & Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Launch Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>

              <div>
                <label style={labelStyle}>Launch Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>ETA Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>

              <div>
                <label style={labelStyle}>ETA Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="input-dark-trips"
                />
              </div>
            </div>

            <button
              onClick={assignTrip}
              onMouseEnter={playHoverSound}
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: "8px", width: "100%", padding: "13px" }}
            >
              {loading ? "LOCKING TARGET & DISPATCHING..." : "[ TARGET LOCK // DISPATCH MISSION ]"}
            </button>
          </div>
        </div>

        {/* All Missions Table Panel */}
        <div className="hud-bracket hud-glass-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "15px", fontWeight: "800", color: "#f1f8ff", margin: 0 }}>
              DISPATCHED MISSION MATRIX
            </h3>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#00ff9d" }}>
              // LIVE VECTORS
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="custom-table-trips">
              <thead>
                <tr>
                  <th>Mission ID</th>
                  <th>Pilot</th>
                  <th>Unit</th>
                  <th>Route Trajectory</th>
                  <th>Launch Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "60px 20px", fontFamily: "'Share Tech Mono', monospace" }}>
                      NO ACTIVE MISSIONS IN SECTOR LOGS.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, idx) => {
                    const missionCode = `MSN-${String(idx + 1).padStart(4, '0')}`;
                    const isCompleted = trip.status === 'completed';
                    const isInProgress = trip.status === 'in_progress';
                    return (
                      <tr key={trip._id} onMouseEnter={playHoverSound}>
                        <td>
                          <code style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00f0ff', background: 'rgba(0,240,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                            {missionCode}
                          </code>
                        </td>

                        <td style={{ fontWeight: "700", color: "#f1f8ff", fontFamily: "'Rajdhani', sans-serif" }}>
                          👤 {trip.driver?.fullName || trip.driver?.name || "Unknown"}
                        </td>

                        <td>
                          <code style={{ fontSize: "12px", color: "#00ff9d", fontFamily: "'Share Tech Mono', monospace" }}>
                            {trip.vehicle?.licensePlate || trip.vehicle?.vehicleNumber || "Unknown"}
                          </code>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#f1f8ff' }}>{trip.pickupLocation}</span>
                            <span style={{ color: '#00f0ff' }}>➔</span>
                            <span style={{ color: '#38bdf8' }}>{trip.dropLocation}</span>
                          </div>
                        </td>

                        <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
                          {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "—"}{" "}
                          <span style={{ color: "#00f0ff" }}>{trip.startTime}</span>
                        </td>

                        <td>
                          <span
                            className={`badge ${isCompleted ? 'badge-success' : isInProgress ? 'badge-info' : 'badge-warning'}`}
                          >
                            ● {trip.status?.toUpperCase() || "DISPATCHED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const labelStyle = {
  display: "block",
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "11px",
  fontWeight: "700",
  color: "#94a3b8",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

export default AdminTrips;