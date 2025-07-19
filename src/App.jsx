// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ManageRoutes from "./pages/ManageRoutes";
import AddBuses from "./pages/AddBuses";
import Reports from "./pages/Reports";
import NFCUIDAssignmentSystem from "./pages/NfcAssign";
import BusLocation from "./pages/BusLocation";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="add-bus" element={<AddBuses />} />
          <Route path="manage-routes" element={<ManageRoutes />} />
          <Route path="reports" element={<Reports />} />
          <Route path="nfc-assign" element={<NFCUIDAssignmentSystem />} />
          <Route path="bus-location" element={<BusLocation />} />
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}
