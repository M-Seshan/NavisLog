import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/shared/Toast';
import './index.css';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Vehicles from './pages/admin/Vehicles';
import Drivers from './pages/admin/Drivers';
import AdminTrips from "./pages/admin/AdminTrips";
import FuelManagement from './pages/admin/FuelManagement';
import MaintenanceManagement from './pages/admin/MaintenanceManagement';
import AgentCenter from './pages/admin/AgentCenter';
import Profile from './pages/admin/Profile';
import { AdminNotifications, LiveTracking, AdminReports } from './pages/admin/AdminExtra';
import AdminLiveTracking from './pages/admin/AdminLiveTracking';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverTelemetry from "./pages/driver/DriverTelemetry";
import PhoneGPSSender from './pages/driver/PhoneGPSSender';
import {
  DriverFuelEntry, DriverReportIssue, DriverMyVehicle,
  DriverTripHistory, DriverNotifications, DriverRoute
} from './pages/driver/DriverPages';

/* -------------------------------------------------------------------------- */
/* ROUTE GUARDS                                                               */
/* -------------------------------------------------------------------------- */
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)',
          color: '#f8fafc',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <style>{`
          .app-loader-ring {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(14, 165, 233, 0.2);
            border-top-color: #0ea5e9;
            border-radius: 50%;
            animation: app-spin 0.8s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes app-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="app-loader-ring" />
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '1px', background: 'linear-gradient(135deg, #38bdf8, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          NavisLog
        </div>
        <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>
          Authenticating dispatch session...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/driver/dashboard'} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/driver/dashboard'} replace />;
  }
  return children;
}

/* -------------------------------------------------------------------------- */
/* MAIN APP ROUTER                                                            */
/* -------------------------------------------------------------------------- */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/vehicles" element={<ProtectedRoute role="admin"><Vehicles /></ProtectedRoute>} />
              <Route path="/admin/drivers" element={<ProtectedRoute role="admin"><Drivers /></ProtectedRoute>} />
              <Route path="/admin/trips" element={<ProtectedRoute role="admin"><AdminTrips /></ProtectedRoute>} />
              <Route path="/admin/fuel" element={<ProtectedRoute role="admin"><FuelManagement /></ProtectedRoute>} />
              <Route path="/admin/maintenance" element={<ProtectedRoute role="admin"><MaintenanceManagement /></ProtectedRoute>} />
              <Route path="/admin/tracking" element={<ProtectedRoute role="admin"><AdminLiveTracking /></ProtectedRoute>} />
              <Route path="/admin/agents" element={<ProtectedRoute role="admin"><AgentCenter /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><AdminNotifications /></ProtectedRoute>} />
              <Route path="/admin/profile" element={<ProtectedRoute role="admin"><Profile /></ProtectedRoute>} />

              {/* Driver Routes */}
              <Route path="/driver/dashboard" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
              <Route path="/driver/vehicle" element={<ProtectedRoute role="driver"><DriverMyVehicle /></ProtectedRoute>} />
              <Route path="/driver/route" element={<ProtectedRoute role="driver"><DriverRoute /></ProtectedRoute>} />
              <Route path="/driver/fuel" element={<ProtectedRoute role="driver"><DriverFuelEntry /></ProtectedRoute>} />
              <Route path="/driver/telemetry" element={<ProtectedRoute role="driver"><DriverTelemetry /></ProtectedRoute>} />
              <Route path="/driver/report-issue" element={<ProtectedRoute role="driver"><DriverReportIssue /></ProtectedRoute>} />
              <Route path="/driver/trips" element={<ProtectedRoute role="driver"><DriverTripHistory /></ProtectedRoute>} />
              <Route path="/driver/notifications" element={<ProtectedRoute role="driver"><DriverNotifications /></ProtectedRoute>} />
              <Route path="/driver/profile" element={<ProtectedRoute role="driver"><Profile /></ProtectedRoute>} />
              <Route path="/gps-sender" element={<PhoneGPSSender />} />

              {/* Default Redirect Fallbacks */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;