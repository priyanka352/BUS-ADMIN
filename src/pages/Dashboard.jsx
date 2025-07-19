// src/pages/Dashboard.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import BusAssignmentTable from "../components/BusAssignmentTable";
import { motion } from "framer-motion";
import { Typography, Box } from "@mui/material"; // Import Box and Typography for layout/messages

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false); // <--- ADD THIS
  const [error, setError] = useState(null);   // <--- ADD THIS

  return (
    <Box > 
      <Sidebar />
      <motion.div
        style={{ flexGrow: 1, padding: "20px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Typography variant="h4" component="h2" sx={{ marginBottom: "20px" }}>
          Dashboard
        </Typography>

        {/* Pass setLoading and setError to StatsCards if it needs to manage its own loading/errors.
            However, given your current StatsCards, it uses onValue and manages its own 'stats' state,
            so these aren't directly used by StatsCards for individual fetches.
            They would be more relevant if StatsCards fetched data *on click*.
            For now, we'll keep them here for future potential use or for BusAssignmentTable's internal state.
            But more importantly, the Dashboard needs to know if the table data is loading/errored.
            Since StatsCards already has all the data, we don't need a separate loading/error state *for fetching table data*.
            So, let's simplify and remove loading/error here for now, or just keep them for the future if you change fetching strategy.
            For *this specific setup*, they are not strictly needed here for passing to StatsCards.
            Let's adjust based on the current StatsCards that already *has* the data.
        */}
        <StatsCards
          setSelectedType={setSelectedType}
          setSelectedData={setSelectedData}
          // setLoading={setLoading} // No longer needed here as StatsCards pre-fetches all data
          // setError={setError}    // No longer needed here
        />

        {/* The loading/error messages can be simplified or removed here,
            as StatsCards manages its own data loading.
            If you want to show a loading state while the *initial* stats are fetched,
            you'd need a loading state inside StatsCards and pass it up.
            For now, we assume StatsCards shows its counts as soon as they're ready.
        */}
        {/* {loading && <Typography>Loading data...</Typography>}
        {error && <Typography color="error">{error}</Typography>} */}


        {/* The BusAssignmentTable now just receives the pre-loaded data from StatsCards' click */}
        {selectedType ? ( // Render table only if a type is selected
          <BusAssignmentTable
            selectedType={selectedType}
            selectedData={selectedData}
          />
        ) : (
          <Typography variant="body1" sx={{ mt: 3 }}>
            Click on a card above to view detailed information.
          </Typography>
        )}
        {selectedType && selectedData.length === 0 && (
            <Typography variant="body1" sx={{ mt: 3 }}>
                No data available for "{selectedType}".
            </Typography>
        )}
      </motion.div>
    </Box>
  );
}