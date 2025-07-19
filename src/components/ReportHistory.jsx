// src/components/ReportHistory.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import { getDatabase, ref, onValue } from "firebase/database";

export default function ReportHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const emergencyRef = ref(db, "emergency");

    const unsubscribe = onValue(emergencyRef, (snapshot) => {
      const data = snapshot.val();
      const list = [];
      for (let key in data) {
        if (data[key].status && data[key].status !== "pending") {
          list.push({ id: key, ...data[key] });
        }
      }
      setHistory(list.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getChipColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ color: 'info.main' ,fontWeight: 'bold'}}>
      <Typography variant="h6" gutterBottom>
        Report History
      </Typography>

      {history.map((report) => (
        <Paper key={report.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            {report.title}
          </Typography>
          <Typography variant="body2">{report.message}</Typography>
          <Typography variant="body2">{report.content}</Typography>
          <Typography variant="caption" color="textSecondary">
            Sent by: {report.sender} ({report.role})
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ textAlign: 'right' }}>
            Date: {formatDate(report.timestamp)}
          </Typography>
          <Chip 
            label={report.status.toUpperCase()}
            color={getChipColor(report.status)}
            size="small"
            sx={{ mt: 1 }}
          />
        </Paper>
      ))}
    </Box>
  );
}
