// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0b',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            margin: '0 auto', width: 44, height: 44, borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.08)', borderTopColor: '#5b8def',
            animation: 'sskatt-spin-pr 0.8s linear infinite',
          }} />
          <style>{`@keyframes sskatt-spin-pr { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#9aa1b8' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If admin tries to access employee route, redirect to admin dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // If employee tries to access admin route, redirect to employee dashboard
    return <Navigate to="/employee" replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute;