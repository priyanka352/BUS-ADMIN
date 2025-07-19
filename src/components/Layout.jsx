// src/components/Layout.jsx
import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar - Fixed width */}
      <Sidebar />

      {/* Right Panel - Flexible width, full height */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          padding: 2,
          backgroundColor: "#f9fafb", // optional light background
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

