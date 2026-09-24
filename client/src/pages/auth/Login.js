import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/shared/Toast";
import BackgroundCanvas from "../../components/shared/BackgroundCanvas";
import NavisCursor from "../../components/shared/NavisCursor";
import { playHoverSound, playClickSound, playActionConfirm } from "../../utils/audioSynth";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Credentials required for authentication");
      return;
    }

    setLoading(true);
    playClickSound();

    try {
      const user = await login(form.email, form.password);
      playActionConfirm();
      toast.success(`Identity Verified: Welcome, ${user.fullName}!`);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/driver/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication rejected");
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
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className="hud-bracket auth-card"
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "rgba(5, 14, 28, 0.88)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            borderRadius: "8px",
            padding: "40px 36px",
            boxShadow: "0 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)",
            color: "#f1f8ff",
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 14px",
                borderRadius: "20px",
                background: "rgba(0, 255, 157, 0.08)",
                border: "1px solid rgba(0, 255, 157, 0.35)",
                color: "#00ff9d",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "10px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff9d", boxShadow: "0 0 6px #00ff9d" }} />
              COMMAND ACCESS PORTAL
            </div>

            <h1
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "2px",
                margin: 0,
                color: "#f1f8ff",
              }}
            >
              NAVIS<span style={{ color: "#00f0ff" }}>LOG</span>
            </h1>

            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#38bdf8",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              AUTONOMOUS FLEET OPERATIONS
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Operator Identity (Email)
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="operator@navislog.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Security Passcode
              </label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={playHoverSound}
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: "14px", letterSpacing: "1.5px" }}
            >
              {loading ? "VERIFYING CREDENTIALS..." : "[ AUTHENTICATE & ENTER COMMAND ]"}
            </button>
          </form>

          {/* Quick Enlist Link */}
          <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(0, 240, 255, 0.12)" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>New operator or pilot? </span>
            <Link
              to="/register"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#00f0ff",
                textDecoration: "none",
                letterSpacing: "0.5px",
              }}
            >
              ENLIST HERE ➔
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}