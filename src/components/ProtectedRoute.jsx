// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  bg0: '#F7F9FC',
  bdr1: 'rgba(15,23,42,0.10)',
  accent: '#4F46E5',
  txt0: '#0F172A',
  txt2: '#64748B',
};

const FONT = '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: T.bg0, fontFamily: FONT,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            margin: '0 auto 18px', width: 44, height: 44, borderRadius: 13,
            background: `linear-gradient(135deg, ${T.accent}, #4338CA)`,
            boxShadow: '0 8px 24px rgba(79,70,229,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
              animation: 'wts-spin-pr 0.8s linear infinite',
            }} />
          </div>
          <style>{`@keyframes wts-spin-pr { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0 }}>Work Tracking System</p>
          <p style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: T.txt2 }}>Checking your session…</p>
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