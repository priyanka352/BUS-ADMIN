// src/components/ChangePassword.jsx
import React, { useState } from "react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import {
  Box, Button, TextField, Typography, Alert
} from "@mui/material";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Session expired. Please login again.");
      return;
    }

    try {
      // Step 1: Reauthenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Step 2: Update password
      await updatePassword(user, newPassword);
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect current password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please login again and retry.");
      } else {
        setError("Something went wrong. Try again.");
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleChangePassword} sx={{ mt: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>Change Password</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <TextField
        fullWidth
        type="password"
        label="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        margin="normal"
      />
      <TextField
        fullWidth
        type="password"
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        margin="normal"
      />
      <TextField
        fullWidth
        type="password"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        margin="normal"
      />

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Change Password
      </Button>
    </Box>
  );
}
