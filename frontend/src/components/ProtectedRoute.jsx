import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const userName = localStorage.getItem("userName");

  if (!userName) {
    // If not signed in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
