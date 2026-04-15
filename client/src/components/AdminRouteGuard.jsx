import React from 'react';
import { Navigate } from 'react-router-dom';
import { clearAdminToken, getAdminTokenState } from '../utils/adminAuth';

export default function AdminRouteGuard({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const tokenState = getAdminTokenState(token);

  if (!tokenState.isValid) {
    clearAdminToken();
    return <Navigate to="/admin/login" replace state={{ message: tokenState.message }} />;
  }

  return children;
}
