// src/pages/Reports.jsx
import React from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import SendMessage from "../components/SendMessage";
import PendingReports from "../components/PendingReports";
import ReportHistory from "../components/ReportHistory";

const tabLabels = ["Send Message", "Pending Approval", "Report History"];

export default function Reports() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{  fontWeight: 'bold',p: 2 ,color: 'error.main' }}>
      <Typography variant="h3" gutterBottom>
        Emergency Reports
      </Typography>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        {value === 0 && <SendMessage />}
        {value === 1 && <PendingReports />}
        {value === 2 && <ReportHistory />}
      </Paper>
    </Box>
  );
}
