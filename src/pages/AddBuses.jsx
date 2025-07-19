import React, { useState } from "react";
import { getDatabase, ref, set , get, child} from "firebase/database";
import {
  Box,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";

export default function AddBuses() {
  const db = getDatabase();

  const [newBusNo, setNewBusNo] = useState("");
  const [newBusStops, setNewBusStops] = useState([
    { name: "", lat: "", lng: "", ishelper: false },
  ]);

  const handleNewBusStopChange = (index, field, value) => {
    const updatedStops = [...newBusStops];
    updatedStops[index] = {
      ...updatedStops[index],
      [field]: field === "ishelper" ? value : value,
    };
    setNewBusStops(updatedStops);
  };

  const addNewBusStopField = () => {
    setNewBusStops((prev) => [
      ...prev,
      { name: "", lat: "", lng: "", ishelper: false },
    ]);
  };

  const removeNewBusStopField = (index) => {
    setNewBusStops((prev) => prev.filter((_, i) => i !== index));
  };

  const submitNewBus = () => {
    if (!newBusNo.trim()) {
      alert("Please enter Bus Number");
      return;
    }

   // Validate all stops
  for (const stop of newBusStops) {
    if (!stop.name || !stop.lat || !stop.lng) {
      alert("Please fill all fields for each stop");
      return;
    }
  }

  const dbRef = ref(db);
  const busPath = `all_routes/${newBusNo}`;

  get(child(dbRef, busPath))
    .then((snapshot) => {
      if (snapshot.exists()) {
        alert("Bus number already exists. Please update stops in Manage Routes.");
        return;
      }

      // Prepare stops with string ishelper
      const stopsToSave = newBusStops.map((stop) => ({
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        ishelper: stop.ishelper ? "true" : "false",
      }));

      const newBusRef = ref(db, busPath);

      return set(newBusRef, stopsToSave)
        .then(() => {
          alert("New bus route added successfully!");
          setNewBusNo("");
          setNewBusStops([{ name: "", lat: "", lng: false }]);
        });
    })
    .catch((error) => {
      alert("Error checking bus number: " + error.message);
    });
};

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Add New Bus Route
      </Typography>

      <Paper sx={{ p: 2 }}>
        <TextField
          label="Bus Number"
          value={newBusNo}
          onChange={(e) => setNewBusNo(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {newBusStops.map((stop, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
              mb: 1,
            }}
          >
            <TextField
              label="Name"
              value={stop.name}
              onChange={(e) =>
                handleNewBusStopChange(index, "name", e.target.value)
              }
              size="small"
              sx={{ flex: 1, minWidth: 150 }}
            />
            <TextField
              label="Latitude"
              value={stop.lat}
              onChange={(e) =>
                handleNewBusStopChange(index, "lat", e.target.value)
              }
              size="small"
              sx={{ width: 120 }}
            />
            <TextField
              label="Longitude"
              value={stop.lng}
              onChange={(e) =>
                handleNewBusStopChange(index, "lng", e.target.value)
              }
              size="small"
              sx={{ width: 120 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stop.ishelper}
                  onChange={(e) =>
                    handleNewBusStopChange(index, "ishelper", e.target.checked)
                  }
                />
              }
              label="Helper"
            />
            {newBusStops.length > 1 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeNewBusStopField(index)}
              >
                Remove
              </Button>
            )}
          </Box>
        ))}

        <Button variant="outlined" onClick={addNewBusStopField} sx={{ mr: 2 }}>
          Add Another Stop
        </Button>
        <Button variant="contained" onClick={submitNewBus}>
          Submit New Bus
        </Button>
      </Paper>
    </Box>
  );
}
