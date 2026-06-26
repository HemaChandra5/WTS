// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1117',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              margin: '0 auto',
              height: 48,
              width: 48,
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.08)',
              borderTopColor: '#3b7cff',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p style={{ marginTop: 16, fontSize: 13.5, fontWeight: 500, color: '#a0a8c0' }}>
            Loading...
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // Both Admin and Employee dashboards are full-bleed shells that manage
  // their own max-width/padding/background internally (each has its own
  // <main style={{ maxWidth: ..., margin: '0 auto', padding: ... }}> at the
  // top of its own render tree). App must NOT add a second max-width wrapper
  // around either of them — doing so was the cause of Employee appearing
  // narrower/centered while Admin reached the corners: Employee was being
  // constrained twice (once here, once inside EmployeeDashboard.jsx).
  //
  // The background here is just the outer page backdrop visible briefly
  // around the edges / during transitions; each dashboard's own background
  // (dark for Admin, light for Employee) takes over visually once it mounts.
  const isAdmin = user?.role === 'admin';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isAdmin ? '#0f1117' : '#f5f6fa',
      }}
    >
      {/* Only show Navbar when user is authenticated */}
      {user && <Navbar />}

      {/* No max-width / padding here — each page owns its own full-bleed
          layout, exactly like AdminDashboard.jsx already does. */}
      <Routes>
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={user.role === 'admin' ? '/admin' : '/employee'}
                replace
              />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/employee" replace /> : <Signup />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={user.role === 'admin' ? '/admin' : '/employee'}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login'}
              replace
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;