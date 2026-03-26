import React from "react";
import { Navigate } from "react-router-dom";

// Reads token from localStorage and checks the role claim
function parseTokenRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function AdminRouteGuard({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // No token at all → send to login
    return <Navigate to="/login" replace />;
  }

  const role = parseTokenRole(token);

  if (role !== "admin") {
    // Logged in but not admin → send to login with a message
    return <Navigate to="/login" replace state={{ message: "Admin access required." }} />;
  }

  return children;
}
