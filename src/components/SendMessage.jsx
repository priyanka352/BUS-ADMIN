// src/components/SendMessage.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { getDatabase, ref, push } from "firebase/database";

export default function SendMessage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [receiver, setReceiver] = useState("");

  const handleSubmit = () => {
    if (!title || !message || !receiver) return;

    const db = getDatabase();
    const emergencyRef = ref(db, "emergency");
    const newReport = {
      title,
      message,
      sender: "admin",
      role: "admin",
      timestamp: Date.now(),
      receiver,
      status: "approved", // Sent messages are auto-approved
    };
    push(emergencyRef, newReport);

    setTitle("");
    setMessage("");
    setReceiver("");
  };

  return (
    <Box sx={{ color: 'error.main' ,fontWeight: 'bold'}}>
      <Typography variant="h6" gutterBottom>
        Send Emergency Message
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Title"
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          fullWidth
          label="Message"
          margin="normal"
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Receiver</InputLabel>
          <Select
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            label="Receiver"
          >
            <MenuItem value="traveller">Traveller</MenuItem>
            <MenuItem value="conductor">Conductor</MenuItem>
          </Select>
        </FormControl> */}

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={handleSubmit}
        >
          Send Message
        </Button>
      </Paper>
    </Box>
  );
}