// src/pages/Settings.jsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import ChangePassword from "../components/ChangePassword";

export default function Settings() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      padding={4}
    >
      <Paper sx={{ padding: 4}}>
        <Typography variant="h5" gutterBottom>Settings</Typography>
        <ChangePassword />
      </Paper>
    </Box>
  );
}
