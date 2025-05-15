import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user has no PIN and is not on settings page, redirect to settings
  if (!user.pin && location.pathname !== '/settings') {
    return <Navigate to="/settings?pinSetup=1" replace />;
  }

  return children;
};

export default PrivateRoute; 