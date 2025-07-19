// src/components/DashboardMain.jsx
import { Box, Typography, Grid, Paper } from "@mui/material";
import DashboardCard from "./DashboardCard";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/AltRoute";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupIcon from "@mui/icons-material/Group";

export default function DashboardMain() {
  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item><DashboardCard icon={<DirectionsBusIcon />} label="Total Buses" value="0" color="blue" /></Grid>
        <Grid item><DashboardCard icon={<RouteIcon />} label="Total Routes" value="0" color="red" /></Grid>
        <Grid item><DashboardCard icon={<AttachMoneyIcon />} label="Today's Collection" value="₹0" color="green" /></Grid>
        <Grid item><DashboardCard icon={<GroupIcon />} label="Active Conductors" value="0" color="purple" /></Grid>
      </Grid>

      <Paper elevation={2} sx={{ mt: 4, p: 2 }}>
        <Typography variant="h6" sx={{ color: "#0f52ba", mb: 2 }}>Bus Assignment Overview</Typography>
        <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
          <Typography>No buses available.</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
