import React, { useEffect, useState } from "react";
import {
  getDatabase,
  ref,
  onValue,
  update, // We will keep 'update' for potential future use or other parts of the app
  set,     // <--- IMPORT 'set' HERE!
  remove,
} from "firebase/database";
import {
  Box,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";

export default function ManageRoutes() {
  const db = getDatabase();

  const [routes, setRoutes] = useState({});
  const [expandedBus, setExpandedBus] = useState(null);
  const [newStop, setNewStop] = useState({
    name: "",
    lat: "",
    lng: "",
    ishelper: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allRoutesRef = ref(db, "all_routes");
    const unsubscribe = onValue(allRoutesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRoutes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Toggle expanded bus
  const toggleBus = (busNo) => {
    setExpandedBus((prev) => (prev === busNo ? null : busNo));
  };

  // Add new stop for a bus
  const addStop = (busNo) => {
    if (!newStop.name || !newStop.lat || !newStop.lng) {
      alert("Please fill all stop fields");
      return;
    }

    const busRouteRef = ref(db, `all_routes/${busNo}`);
    const currentStops = routes[busNo] || [];

    const newStopEntry = {
      name: newStop.name,
      lat: newStop.lat,
      lng: newStop.lng,
      ishelper: newStop.ishelper ? "true" : "false", // Store as string "true" or "false"
    };

    const updatedStops = [...currentStops, newStopEntry];

    // Use set() to replace the entire array
    set(busRouteRef, updatedStops) // <--- CHANGED FROM update() TO set()
      .then(() => {
        setNewStop({ name: "", lat: "", lng: "", ishelper: false });
      })
      .catch((error) => {
        alert("Failed to add stop: " + error.message);
      });
  };

  // Update a stop (change name, lat, lng, ishelper)
  const updateStop = (busNo, index, field, value) => {
    const busRouteRef = ref(db, `all_routes/${busNo}`);
    const currentStops = [...(routes[busNo] || [])]; // Create a mutable copy

    if (!currentStops[index]) return;

    currentStops[index] = {
      ...currentStops[index],
      [field]: field === "ishelper" ? (value ? "true" : "false") : value,
    };

    // Use set() to replace the entire array
    set(busRouteRef, currentStops).catch((error) => { // <--- CHANGED FROM update() TO set()
      alert("Failed to update stop: " + error.message);
    });
  };

  // Delete a stop by index
  const deleteStop = (busNo, index) => {
    const busRouteRef = ref(db, `all_routes/${busNo}`);
    const updatedStops = [...(routes[busNo] || [])];
    updatedStops.splice(index, 1);

    // After splicing, re-upload the entire modified array.
    // Use set() to replace the array. If no stops remain, set to null to remove the node.
    set(busRouteRef, updatedStops.length > 0 ? updatedStops : null).catch( // <--- CHANGED FROM update() TO set()
      (error) => {
        alert("Failed to delete stop: " + error.message);
      }
    );
  };

  // Delete entire bus route
  const deleteBus = (busNo) => {
    if (!window.confirm(`Delete entire route for bus ${busNo}?`)) return;
    const busRouteRef = ref(db, `all_routes/${busNo}`);
    remove(busRouteRef).catch((error) => {
      alert("Failed to delete bus route: " + error.message);
    });
    if (expandedBus === busNo) setExpandedBus(null);
  };

  if (loading) return <div>Loading routes...</div>;

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Manage Routes
      </Typography>

      {Object.keys(routes).length === 0 && <p>No routes found.</p>}

      {Object.keys(routes).map((busNo) => (
        <Paper key={busNo} sx={{ mb: 3, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => toggleBus(busNo)}
          >
            <Typography variant="h6">{busNo}</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                deleteBus(busNo);
              }}
            >
              Delete Bus
            </Button>
          </Box>

          {expandedBus === busNo && (
            <Box mt={2}>
              {(routes[busNo] || []).map((stop, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 1,
                    mb: 1,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    label="Name"
                    value={stop.name}
                    onChange={(e) =>
                      updateStop(busNo, idx, "name", e.target.value)
                    }
                    size="small"
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="Latitude"
                    value={stop.lat}
                    onChange={(e) =>
                      updateStop(busNo, idx, "lat", e.target.value)
                    }
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Longitude"
                    value={stop.lng}
                    onChange={(e) =>
                      updateStop(busNo, idx, "lng", e.target.value)
                    }
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={stop.ishelper === "true"} // Compare with string "true"
                        onChange={(e) =>
                          updateStop(busNo, idx, "ishelper", e.target.checked)
                        }
                      />
                    }
                    label="Helper"
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteStop(busNo, idx)}
                  >
                    Delete Stop
                  </Button>
                </Paper>
              ))}

              {/* Add new stop */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <TextField
                  label="Name"
                  value={newStop.name}
                  onChange={(e) =>
                    setNewStop((prev) => ({ ...prev, name: e.target.value }))
                  }
                  size="small"
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <TextField
                  label="Latitude"
                  value={newStop.lat}
                  onChange={(e) =>
                    setNewStop((prev) => ({ ...prev, lat: e.target.value }))
                  }
                  size="small"
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Longitude"
                  value={newStop.lng}
                  onChange={(e) =>
                    setNewStop((prev) => ({ ...prev, lng: e.target.value }))
                  }
                  size="small"
                  sx={{ width: 120 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newStop.ishelper}
                      onChange={(e) =>
                        setNewStop((prev) => ({
                          ...prev,
                          ishelper: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Helper"
                />
                <Button variant="contained" onClick={() => addStop(expandedBus)}>
                  Add Stop
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}