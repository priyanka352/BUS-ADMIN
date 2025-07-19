// src/components/PendingReports.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";

export default function PendingReports() {
  const [pendingReports, setPendingReports] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const emergencyRef = ref(db, "emergency");

    const unsubscribe = onValue(emergencyRef, (snapshot) => {
      const data = snapshot.val();
      const pending = [];
      for (let key in data) {
        if (data[key].status === "pending") {
          pending.push({ id: key, ...data[key] });
        }
      }
      setPendingReports(pending);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = (id, status) => {
    const db = getDatabase();
    const reportRef = ref(db, `emergency/${id}`);
    update(reportRef, { status });
  };

  const handleDelete = (id) => {
    const db = getDatabase();
    const reportRef = ref(db, `emergency/${id}`);
    remove(reportRef);
  };

  return (
    <Box sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
      <Typography variant="h6" gutterBottom>
        Pending Reports
      </Typography>

      {pendingReports.map((report) => (
        <Paper key={report.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            {report.title}
          </Typography>
          <Typography variant="body2">{report.content}</Typography>
          <Typography variant="caption" color="textSecondary">
            Sent by: {report.sender} ({report.role})
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleUpdateStatus(report.id, "approved")}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleUpdateStatus(report.id, "declined")}
            >
              Decline
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleDelete(report.id)}
            >
              Delete
            </Button>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}
