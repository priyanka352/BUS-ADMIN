// src/components/BusAssignmentTable.jsx
import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  MenuItem,
  Select,
} from "@mui/material";

export default function BusAssignmentTable({ selectedType, selectedData }) {
  const [extraColumn, setExtraColumn] = useState("");

  if (!selectedType || !selectedData || selectedData.length === 0) {
    return null; // This will be handled by Dashboard's conditional rendering mostly
  }

  const getColumns = () => {
    switch (selectedType) {
      case "Total Routes":
        return ["bus_no", "stops"]; // Correctly expects 'stops' key
      case "Active Conductors":
        return ["bus", "city", "direction", "name", "password", "phone", "route"];
      case "Total Travellers":
        // Assuming your 'Traveler' data has these keys. Adjust if 'uid' is different.
        return ["name", "phone", "walletBalance"]; // Removed password and uid as they might not be for display
      case "Normal bookings":
        return [
          "routeNumber",
          "date",
          "time",
          "startStop",
          "destinationStop",
          "formattedPrice",
          "personCount",
          "phoneNumber",
          "scannedBy",
        ];
      case "Bookings For Others":
        return [
          "bookedByPhone",
          "date",
          "time",
          "startStop",
          "destinationStop",
          "formattedPrice",
          "passengerPhone",
          "personCount",
        ];
      case "Today's Collection": // <--- ADD THIS CASE for Collection
        return ["amount"]; // Assuming the object passed will be { amount: value }
      default:
        // Fallback to all keys if selectedType doesn't match a predefined set
        return Object.keys(selectedData[0]);
    }
  };

  const columns = getColumns();

  // Filter out columns that are already part of the main display
  const dropdownOptions = selectedData.length > 0
    ? Object.keys(selectedData[0]).filter((key) => !columns.includes(key))
    : [];

  const renderCell = (value) => {
    if (typeof value === "object" && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return value;
  };

  const renderRow = (item, index) => (
    <TableRow key={index}>
      {columns.map((col) => (
        <TableCell key={col}>{renderCell(item[col])}</TableCell>
      ))}
      {extraColumn && !columns.includes(extraColumn) && (
        <TableCell>{renderCell(item[extraColumn])}</TableCell>
      )}
    </TableRow>
  );

  return (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h6" gutterBottom>
        {selectedType} Details
      </Typography>

      {dropdownOptions.length > 0 && ( // Only show dropdown if there are extra options
        <Select
          value={extraColumn}
          onChange={(e) => setExtraColumn(e.target.value)}
          displayEmpty
          style={{ marginBottom: "10px" }}
        >
          <MenuItem value="">No Extra Column</MenuItem>
          {dropdownOptions.map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
              {extraColumn && !columns.includes(extraColumn) && (
                <TableCell>{extraColumn}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedData.map((item, index) => renderRow(item, index))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}