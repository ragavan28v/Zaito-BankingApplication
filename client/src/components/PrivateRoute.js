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

  // Only redirect to PIN setup if user has no PIN and is not already on settings page
  if (!user.pin && !location.pathname.includes('/settings')) {
    return <Navigate to="/settings?pinSetup=1" replace />;
  }

  return children;
};

export default PrivateRoute; 