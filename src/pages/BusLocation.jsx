import React, { useState, useEffect, useRef, useCallback } from "react";
// FIX: Adjusted the import path for firebase.js to '../utils/firebase.js'.
// This path assumes that firebase.js is located within a 'utils' subfolder
// that is a sibling to the 'pages' folder (e.g., BusLocation.jsx is in 'src/pages/'
// and firebase.js is in 'src/utils/').
// Please verify if this path matches your actual file structure, and adjust if necessary.
import { db } from "../firebase.js";

// Import necessary Firebase Realtime Database functions
import { ref, onValue, off } from "firebase/database";

// Mocked Material-UI (MUI) Components for Canvas environment.
// In a real project, you would install and import these from '@mui/material'.
const Box = ({ children, sx, ...props }) => (
  <div style={sx} {...props}>
    {children}
  </div>
);
const Button = ({ children, onClick, variant = "contained", sx, ...props }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 15px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      ...sx,
    }}
    {...props}
  >
    {children}
  </button>
);
const Typography = ({ children, variant = "body1", sx, ...props }) => {
  let Tag = "p";
  if (variant === "h1") Tag = "h1";
  else if (variant === "h3") Tag = "h3";
  else if (variant === "h4") Tag = "h4";
  return (
    <Tag style={sx} {...props}>
      {children}
    </Tag>
  );
};
const Paper = ({ children, sx, ...props }) => (
  <div
    style={{
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      backgroundColor: "white",
      ...sx,
    }}
    {...props}
  >
    {children}
  </div>
);
const CircularProgress = ({ size = 40, sx, ...props }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: size,
      ...sx,
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#ccc"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#667eea"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="62.83"
        strokeDashoffset="31.415"
      />
    </svg>
  </div>
);
const Alert = ({ children, severity = "info", sx, ...props }) => {
  let backgroundColor = "#e0f7fa"; // info
  let color = "#01579b"; // info
  if (severity === "error") {
    backgroundColor = "#ffebee";
    color = "#c62828";
  } else if (severity === "success") {
    backgroundColor = "#e8f5e9";
    color = "#2e7d32";
  }
  return (
    <div
      style={{
        padding: "15px",
        borderRadius: "4px",
        margin: "15px 0",
        borderLeft: "4px solid " + color,
        backgroundColor,
        color,
        fontWeight: "bold",
        textAlign: "center",
        width: "90%",
        maxWidth: "95vw",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        ...sx,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Main BusLocation React Component
function BusLocation() {
  // State variables
  const [map, setMap] = useState(null);
  const [busMarkers, setBusMarkers] = useState({}); // Stores Google Maps marker objects {uniqueBusKey: markerObject}
  const [busData, setBusData] = useState({}); // Stores the latest raw bus data from Firebase
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null); // { routeId, busInstanceId, busDetails }
  const [usingFallback, setUsingFallback] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [mapLoadingError, setMapLoadingError] = useState(null); // Error message for map loading issues
  const [firebaseReady, setFirebaseReady] = useState(false); // New state: Is Firebase 'db' object ready?
  const [googleMapsApiReady, setGoogleMapsApiReady] = useState(false); // New state: Is window.google.maps ready?

  // Refs for DOM elements and Google Maps objects
  const mapRef = useRef(null);
  const busIconRef = useRef(null);
  const firebaseUnsubscribeRef = useRef(null);

  // --- Effect to check if Firebase 'db' is available ---
  useEffect(() => {
    // We directly check 'db' from the import. If it's undefined, it means the import failed.
    if (db) {
      setFirebaseReady(true);
      console.log("Firebase 'db' object is available.");
    } else {
      console.error(
        "Firebase 'db' object is NOT available. Check your import path in BusLocation.jsx."
      );
      setFirebaseReady(false); // Ensure state reflects non-readiness
    }
  }, []); // Run once on component mount to check import

  // --- Effect to check if Google Maps API (window.google.maps) is available ---
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && !googleMapsApiReady) {
        setGoogleMapsApiReady(true);
        console.log("Google Maps API is now available globally.");
        clearInterval(checkGoogleMaps); // Stop checking once ready
      }
    }, 200); // Check every 200ms

    return () => clearInterval(checkGoogleMaps); // Cleanup interval on unmount
  }, [googleMapsApiReady]); // Only re-run if googleMapsApiReady changes

  // --- Firebase Connection Status Monitoring (Depends on firebaseReady) ---
  useEffect(() => {
    if (!firebaseReady) {
      console.log(
        "Waiting for Firebase 'db' to be ready for connection status monitoring."
      );
      setConnectionStatus("Connecting..."); // Reset status if Firebase becomes unavailable
      return;
    }

    // Use the imported 'db' object
    const connectionRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectionRef, (snapshot) => {
      const connected = snapshot.val();
      if (connected) {
        setConnectionStatus("Connected");
        console.log("Firebase connection status: Connected.");
      } else {
        setConnectionStatus("Disconnected");
        console.warn("Firebase connection status: Disconnected.");
      }
    });

    return () => {
      off(connectionRef, unsubscribe); // Detach listener on cleanup
      console.log("Firebase connection status listener detached.");
    };
  }, [firebaseReady]); // This effect depends on 'firebaseReady'

  // --- Google Maps API Authentication Failure Handler ---
  useEffect(() => {
    // This function is called by the Google Maps API if authentication fails
    window.gm_authFailure = () => {
      console.error(
        "Google Maps API authentication failed (gm_authFailure triggered)."
      );
      setMapLoadingError(
        "Google Maps authentication failed or API key is invalid/missing. Showing coordinates instead." +
          " Please ensure your API key is correct and has the Maps JavaScript API enabled in index.html."
      );
      setUsingFallback(true); // Switch to fallback display
    };

    return () => {
      // Clean up the global function when component unmounts
      delete window.gm_authFailure;
    };
  }, []); // Run once on component mount

  // --- Google Maps Initialization (Depends on mapRef, googleMapsApiReady, map state, usingFallback) ---
  useEffect(() => {
    // Only attempt to initialize map if:
    // 1. Google Maps API is ready (googleMapsApiReady is true)
    // 2. The map container DOM element is available (mapRef.current)
    // 3. The map has not been initialized yet (!map)
    // 4. We are not in fallback mode (!usingFallback)
    if (!googleMapsApiReady || !mapRef.current || map || usingFallback) {
      console.log("Map initialization condition not met:", {
        googleMapsApiReady,
        mapRefCurrent: !!mapRef.current,
        mapInitialized: !!map,
        usingFallback,
      });
      return;
    }

    try {
      console.log("Attempting to initialize Google Map...");
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 22.5726, lng: 88.3639 }, // Default center (Kolkata, India)
        zoom: 12, // Default zoom level
        streetViewControl: false, // Disable Street View
      });
      setMap(newMap); // Store map instance in state
      console.log("Google Map initialized successfully.");

      // Define the custom bus icon using Google Maps API objects
      // FIX: Changed to a direct public PNG URL for the bus icon.
      busIconRef.current = {
        url: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // A valid, direct PNG URL
        scaledSize: new window.google.maps.Size(40, 40), // Size of the icon
        anchor: new window.google.maps.Point(20, 20), // Anchor point of the icon (center)
      };
      console.log("Bus icon defined for Google Maps.");
    } catch (error) {
      console.error("Map initialization error caught:", error);
      setMapLoadingError(
        `Map failed to load: ${error.message}. Switching to coordinates display.`
      );
      setUsingFallback(true); // Activate fallback mode
    }
  }, [mapRef, map, usingFallback, googleMapsApiReady]); // Dependencies for this effect

  // --- Firebase Data Listener for Bus Locations (Depends on firebaseReady, realTimeUpdates) ---
  useEffect(() => {
    if (!firebaseReady) {
      console.log(
        "Waiting for Firebase 'db' to be ready for bus locations listener."
      );
      return;
    }

    // Use the imported 'db' object
    const busLocationsRef = ref(db, "Bus locations");

    // Detach any previous listener to prevent memory leaks and duplicate listeners
    if (firebaseUnsubscribeRef.current) {
      off(busLocationsRef, firebaseUnsubscribeRef.current);
      console.log("Detached previous Firebase bus locations listener.");
    }

    const handleDataChange = (snapshot) => {
      const data = snapshot.val();
      console.log("Received data from Firebase (Bus locations):", data);
      setBusData(data); // Update bus data state

      // Handle fallback mode for displaying coordinates if map isn't working
      if (data && usingFallback) {
        let foundCoordinates = false;
        for (const routeId in data) {
          if (data.hasOwnProperty(routeId)) {
            const busInstances = data[routeId];
            if (typeof busInstances === "object" && busInstances !== null) {
              for (const busInstanceId in busInstances) {
                if (busInstances.hasOwnProperty(busInstanceId)) {
                  const busDetails = busInstances[busInstanceId];
                  const lat = parseFloat(busDetails.latitude);
                  const lng = parseFloat(busDetails.longitude);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    const coordinatesElement =
                      document.getElementById("coordinates");
                    if (coordinatesElement) {
                      coordinatesElement.textContent = `Lat: ${lat.toFixed(
                        6
                      )}, Lng: ${lng.toFixed(6)}`;
                    }
                    foundCoordinates = true;
                    break; // Found one valid coordinate, no need to check more for fallback display
                  }
                }
              }
            }
          }
          if (foundCoordinates) break; // Exit outer loop if coordinates found
        }
        if (!foundCoordinates) {
          const coordinatesElement = document.getElementById("coordinates");
          if (coordinatesElement)
            coordinatesElement.textContent = `Lat: N/A, Lng: N/A`;
        }
      } else if (!data) {
        console.log(
          "No bus data found in Firebase at 'Bus locations'. Clearing markers."
        );
        setBusMarkers((prevMarkers) => {
          Object.values(prevMarkers).forEach((marker) => marker.setMap(null)); // Remove all existing markers
          return {}; // Clear markers state
        });
        setSelectedBus(null); // Clear selected bus if no data
        if (usingFallback) {
          const coordinatesElement = document.getElementById("coordinates");
          if (coordinatesElement)
            coordinatesElement.textContent = `Lat: N/A, Lng: N/A`;
        }
      }
    };

    const handleError = (error) => {
      console.error("Firebase data fetch error (Bus locations):", error);
      setMapLoadingError(
        `Error fetching bus data from Firebase: ${error.message}`
      );
    };

    // Attach listener only if real-time updates are enabled
    if (realTimeUpdates) {
      const unsubscribe = onValue(
        busLocationsRef,
        handleDataChange,
        handleError
      );
      firebaseUnsubscribeRef.current = unsubscribe; // Store unsubscribe function
      console.log("Attached new Firebase bus locations listener.");
    } else {
      console.log(
        "Real-time updates paused. Skipping Firebase listener attachment."
      );
    }

    // Cleanup function for the effect
    return () => {
      if (firebaseUnsubscribeRef.current) {
        off(busLocationsRef, firebaseUnsubscribeRef.current); // Detach listener
        console.log(
          "Cleaned up Firebase bus locations listener on unmount/dependency change."
        );
        firebaseUnsubscribeRef.current = null;
      }
    };
  }, [realTimeUpdates, usingFallback, firebaseReady]); // Dependencies for this effect

  // --- Google Maps Marker Management (Depends on map, busData, busIconRef, googleMapsApiReady) ---
  useEffect(() => {
    // Only proceed if:
    // 1. Google Maps API is ready (googleMapsApiReady is true)
    // 2. The map is initialized (map is not null)
    // 3. Not in fallback mode (!usingFallback)
    // 4. The bus icon is defined (busIconRef.current is not null)
    if (!googleMapsApiReady || !map || usingFallback || !busIconRef.current) {
      if (!googleMapsApiReady)
        console.log("Google Maps API not ready, skipping marker updates.");
      if (!map) console.log("Map not initialized, skipping marker updates.");
      if (usingFallback)
        console.log("In fallback mode, skipping marker updates.");
      if (!busIconRef.current)
        console.log("Bus icon not defined, skipping marker updates.");
      return;
    }

    console.log("Updating Google Maps markers...");
    const activeUniqueBusKeys = new Set(); // Keep track of buses present in current data
    const newBusMarkers = {}; // New object to build updated markers

    for (const routeId in busData) {
      if (!busData.hasOwnProperty(routeId)) continue; // Skip inherited properties

      const busInstances = busData[routeId];

      if (typeof busInstances === "object" && busInstances !== null) {
        for (const busInstanceId in busInstances) {
          if (!busInstances.hasOwnProperty(busInstanceId)) continue; // Skip inherited properties

          const busDetails = busInstances[busInstanceId];
          const uniqueBusKey = `${routeId}-${busInstanceId}`; // Unique identifier for each bus instance
          activeUniqueBusKeys.add(uniqueBusKey); // Add to active set

          const lat = parseFloat(busDetails.latitude);
          const lng = parseFloat(busDetails.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            // Only proceed with valid coordinates
            const position = { lat, lng };

            let marker = busMarkers[uniqueBusKey]; // Check if marker already exists for this bus

            if (marker) {
              // If marker exists, just update its position
              marker.setPosition(position);
              newBusMarkers[uniqueBusKey] = marker;
              // console.log(`Updated marker position for bus '${uniqueBusKey}'.`);
            } else {
              // If marker doesn't exist, create a new one
              marker = new window.google.maps.Marker({
                position: position,
                map: map, // Attach to the map
                icon: busIconRef.current, // Use the custom bus icon
                title: `Route: ${routeId}, ID: ${busInstanceId}`, // Tooltip title
              });

              // Add click listener to show bus details
              marker.addListener("click", () => {
                setSelectedBus({ routeId, busInstanceId, busDetails }); // Set selected bus state
                map.setCenter({ lat, lng }); // Center map on clicked bus
                map.setZoom(16); // Zoom in on clicked bus
              });
              newBusMarkers[uniqueBusKey] = marker; // Add new marker to the new markers object
              console.log(`Created new marker for bus '${uniqueBusKey}'.`);
            }
          } else {
            console.warn(
              `Invalid coordinates for bus '${uniqueBusKey}': Latitude='${busDetails.latitude}', Longitude='${busDetails.longitude}'. Skipping marker creation/update.`
            );
          }
        }
      } else {
        console.warn(
          `Unexpected data structure under route '${routeId}'. Expected an object of bus instances, but got:`,
          busInstances
        );
      }
    }

    // Remove markers that are no longer in the busData
    Object.keys(busMarkers).forEach((markerId) => {
      if (!activeUniqueBusKeys.has(markerId)) {
        busMarkers[markerId].setMap(null); // Remove from map
        console.log(
          `Removed marker for bus '${markerId}' (no longer in data).`
        );
        if (
          selectedBus &&
          `${selectedBus.routeId}-${selectedBus.busInstanceId}` === markerId
        ) {
          setSelectedBus(null); // Deselect if the removed bus was selected
        }
      }
    });
    setBusMarkers(newBusMarkers); // Update the state with the new set of markers

    console.log(
      `Finished updating map markers. Total active buses: ${activeUniqueBusKeys.size}.`
    );
  }, [
    map,
    busData,
    usingFallback,
    selectedBus,
    busMarkers,
    busIconRef.current,
    googleMapsApiReady,
  ]); // Dependencies

  // --- UI Interaction Functions ---
  const handleShowAllBuses = useCallback(() => {
    if (!map || usingFallback) {
      console.log(
        "Map not available or in fallback mode. Cannot show all buses."
      );
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasMarkers = false;

    // Extend map bounds to include all current markers
    Object.values(busMarkers).forEach((marker) => {
      bounds.extend(marker.getPosition());
      hasMarkers = true;
    });

    if (hasMarkers) {
      map.fitBounds(bounds); // Adjust map viewport to fit all markers
      console.log("Map adjusted to show all active bus markers.");
    } else {
      console.log(
        "No bus markers currently on the map to show all. Check Firebase data or coordinates."
      );
    }
  }, [map, usingFallback, busMarkers]); // Dependencies

  const handleToggleRealTimeUpdates = useCallback(() => {
    setRealTimeUpdates((prev) => !prev); // Toggle real-time updates
  }, []); // No dependencies for a simple toggle

  // --- Render Logic ---
  return (
    <Box
      sx={{
        fontFamily: "Inter, sans-serif", // Use Inter font if available
        margin: 0,
        padding: 0,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Gradient background
        color: "#333", // Default text color
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // Center content horizontally
        minHeight: "100vh", // Full viewport height
        pb: 4, // Padding at the bottom
      }}
    >
      <Typography
        variant="h1"
        sx={{
          textAlign: "center",
          color: "white",
          my: 4, // Margin top/bottom
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)", // Text shadow for better readability
          fontSize: { xs: "2em", md: "2.5em" }, // Responsive font size
        }}
      >
        🚌 BusPass Tracking (Google Maps)
      </Typography>

      {/* Connection Status Indicator */}
      <Box
        sx={{
          position: "fixed", // Fixed position on screen
          top: 15,
          right: 20,
          padding: "10px 15px",
          borderRadius: "8px",
          color: "white",
          fontWeight: "bold",
          zIndex: 1000, // Ensure it's above other elements
          backgroundColor:
            connectionStatus === "Connected"
              ? "#4ade80"
              : connectionStatus === "Disconnected"
              ? "#ef4444"
              : "#f59e0b", // Dynamic background color
        }}
      >
        {connectionStatus}
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          my: 2,
          display: "flex",
          gap: "10px", // Space between buttons
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)", // Soft shadow
          flexWrap: "wrap", // Wrap buttons on small screens
          justifyContent: "center", // Center buttons
        }}
      >
        <Button
          onClick={handleShowAllBuses}
          sx={{
            background: "#667eea",
            color: "white",
            "&:hover": {
              background: "#5a67d8",
            },
          }}
        >
          📍 Show All Buses
        </Button>
        <Button
          onClick={handleToggleRealTimeUpdates}
          sx={{
            background: "#667eea",
            color: "white",
            "&:hover": {
              background: "#5a67d8",
            },
          }}
        >
          {realTimeUpdates ? "⏸️ Pause Updates" : "▶️ Resume Updates"}
        </Button>
      </Box>

      {/* Map Loading Error Alert */}
      {mapLoadingError && (
        <Alert severity="error" sx={{ width: "90%", maxWidth: "900px", mb: 2 }}>
          {mapLoadingError}
        </Alert>
      )}

      {/* Conditional Rendering for Map/Loading/Fallback */}
      {(!googleMapsApiReady || !firebaseReady) && !usingFallback ? (
        // Show loading spinner if APIs are not ready and not in fallback mode
        <Box
          sx={{
            width: "95vw",
            height: "80vh",
            display: "flex",
            flexDirection: "column", // Stack spinner and text vertically
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#e0e0e0",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <CircularProgress size={60} />
          <Typography sx={{ ml: 2, mt: 2, color: "#555" }}>
            Loading APIs...
            {!googleMapsApiReady && " (Google Maps)"}
            {!firebaseReady && " (Firebase)"}
          </Typography>
        </Box>
      ) : usingFallback ? (
        // Show fallback display if map failed to load
        <Paper
          sx={{
            width: "95vw",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#f0f0f0",
            color: "#555",
          }}
        >
          <Typography variant="h3" sx={{ color: "#c62828", mb: 1 }}>
            Map Unavailable
          </Typography>
          <Typography>Displaying real-time coordinates:</Typography>
          <Typography
            id="coordinates"
            sx={{
              mt: 2,
              fontFamily: "monospace",
              background: "white",
              p: "12px 20px",
              borderRadius: "6px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
              fontSize: "1.1em",
              color: "#333",
            }}
          >
            Lat: N/A, Lng: N/A
          </Typography>
          <Typography sx={{ mt: 2, textAlign: "center" }}>
            Please ensure your Google Maps API key is correct and properly
            enabled in your `index.html`.
          </Typography>
        </Paper>
      ) : (
        // Render the map container when APIs are ready and not in fallback
        <Box
          ref={mapRef}
          sx={{
            width: "95vw",
            height: "80vh",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            backgroundColor: "#e0e0e0",
            overflow: "hidden",
            display: map ? "block" : "none", // Hide map div until map object is truly set
          }}
        >
          {/* The Google Map will be rendered inside this div by the Google Maps API */}
        </Box>
      )}

      {/* Selected Bus Details Panel */}
      {selectedBus && (
        <Paper
          sx={{
            mt: 3,
            width: "90%",
            maxWidth: "900px",
            display: "block", // Ensure it takes full width
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: "#4a5568",
              mt: 0,
              mb: 2,
              borderBottom: "2px solid #edf2f7",
              pb: "10px",
            }}
          >
            Selected Bus Details
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(250px, 1fr))",
              }, // Responsive grid
              gap: "20px", // Space between grid items
            }}
          >
            <Box>
              <Typography variant="h4">Bus Information</Typography>
              <Typography>
                <strong>Route/Group ID:</strong> {selectedBus.routeId || "N/A"}
              </Typography>
              <Typography>
                <strong>Bus Instance ID:</strong>{" "}
                {selectedBus.busInstanceId || "N/A"}
              </Typography>
              <Typography>
                <strong>Direction:</strong>{" "}
                {selectedBus.busDetails.direction || "N/A"}
              </Typography>
              <Typography>
                <strong>Speed:</strong>{" "}
                {parseFloat(selectedBus.busDetails.speed_kmph || 0).toFixed(1)}{" "}
                km/h
              </Typography>
              <Typography>
                <strong>Date:</strong> {selectedBus.busDetails.date || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4">Conductor Details</Typography>
              <Typography>
                <strong>Name:</strong>{" "}
                {selectedBus.busDetails["conductor name"] || "N/A"}
              </Typography>
              <Typography>
                <strong>Phone:</strong>{" "}
                {selectedBus.busDetails["conductor phone"] || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4">Location</Typography>
              <Typography>
                <strong>Latitude:</strong>{" "}
                {selectedBus.busDetails.latitude || "N/A"}
              </Typography>
              <Typography>
                <strong>Longitude:</strong>{" "}
                {selectedBus.busDetails.longitude || "N/A"}
              </Typography>
              <Typography>
                <strong>Last Update:</strong>{" "}
                {selectedBus.busDetails.timestamp || "N/A"}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default BusLocation;
