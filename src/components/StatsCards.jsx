// src/components/StatsCards.jsx
import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // Assuming this is your initialized Firebase database instance
import { motion } from "framer-motion";

export default function StatsCards({ setSelectedType, setSelectedData }) {
  const [stats, setStats] = useState({
    // totalBuses: [],
    totalRoutes: {},
    travellers: [],
    conductors: [],
    bookings: [],
    bookingsForOthers: [],
    // totalCollection: 0,
  });

  const cardDataMapping = {
    // "Total Buses": { key: "totalBuses", firebasePath: "all_buses" },
    "Total Routes": { key: "totalRoutes", firebasePath: "all_routes" },
    // "Today's Collection": { key: "totalCollection", firebasePath: "TotalCollection", isAmount: true },
    "Active Conductors": { key: "conductors", firebasePath: "Conductor" },
    "Total Travellers": { key: "travellers", firebasePath: "Traveler" },
    "Normal bookings": { key: "bookings", firebasePath: "Bookings" },
    "Bookings For Others": { key: "bookingsForOthers", firebasePath: "Booking_for_others" },
  };

  useEffect(() => {
    // Keep all your existing onValue listeners here.
    // Ensure 'totalRoutes' is stored as an object to retain bus_no keys
    onValue(ref(database, "all_routes"), (snapshot) => {
        const data = snapshot.val();
        setStats((prev) => ({ ...prev, totalRoutes: data || {} })); // Store as object
    });

    // Collection
    // onValue(ref(database, "TotalCollection"), (snapshot) => {
    //   const data = snapshot.val();
    //   let total = 0;
    //   if (data) {
    //     Object.values(data).forEach((entry) => {
    //       total += parseFloat(entry.amount || 0);
    //     });
    //   }
    //   setStats((prev) => ({ ...prev, totalCollection: total }));
    // });

    // Buses
    // onValue(ref(database, "all_buses"), (snapshot) => {
    //   const data = snapshot.val();
    //   const arr = data ? Object.values(data) : [];
    //   setStats((prev) => ({ ...prev, totalBuses: arr }));
    // });

    // Travellers
    onValue(ref(database, "Traveler"), (snapshot) => {
      const data = snapshot.val();
      const arr = data ? Object.values(data) : [];
      setStats((prev) => ({ ...prev, travellers: arr }));
    });

    // Conductors
    onValue(ref(database, "Conductor"), (snapshot) => {
      const data = snapshot.val();
      const arr = data ? Object.values(data) : [];
      setStats((prev) => ({ ...prev, conductors: arr }));
    });

    // Normal Bookings
    onValue(ref(database, "Bookings"), (snapshot) => {
      const bookings = [];
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((user) => {
          Object.values(user).forEach((ticket) => {
            bookings.push(ticket);
          });
        });
      }
      setStats((prev) => ({ ...prev, bookings }));
    });

    // Bookings for Others
    onValue(ref(database, "Booking_for_others"), (snapshot) => {
      const bookingsForOthers = [];
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((user) => {
          Object.values(user).forEach((ticket) => {
            bookingsForOthers.push(ticket);
          });
        });
      }
      setStats((prev) => ({ ...prev, bookingsForOthers }));
    });

  }, []);

  const cards = [
    // { title: "Total Buses", key: "totalBuses" },
    { title: "Total Routes", key: "totalRoutes" },
    // { title: "Today's Collection", key: "totalCollection", isAmount: true },
    { title: "Active Conductors", key: "conductors" },
    { title: "Total Travellers", key: "travellers" },
    { title: "Normal bookings", key: "bookings" },
    { title: "Bookings For Others", key: "bookingsForOthers" },
  ];

  const handleCardClick = (cardTitle) => {
    setSelectedType(cardTitle);
    const { key } = cardDataMapping[cardTitle];
    let dataToDisplay = stats[key];

    if (cardTitle === "Total Routes") {
      dataToDisplay = Object.entries(stats.totalRoutes).map(([busNo, stopsObj]) => {
        const stopsArray = stopsObj ? Object.values(stopsObj) : [];

        // <--- THE CRITICAL CHANGE HERE ---
        const filteredStops = stopsArray.filter(stop =>
            // Check if the stop 'name' is NOT "helper" (case-sensitive)
            // AND if the stop 'type' is NOT "Support" (case-sensitive)
            // This assumes 'helper' names have type 'Support' OR the name is literally 'helper'.
            !(stop.name.toLowerCase().includes("helper") || stop.type === "Support")
        );
        // If 'helper' is ONLY identified by stop.type === "Support", then use:
        // const filteredStops = stopsArray.filter(stop => stop.type !== "Support");
        // If 'helper' is ONLY identified by stop.name === "helper", then use:
        // const filteredStops = stopsArray.filter(stop => stop.name !== "helper");
        // The current one `!(stop.name === "helper" || stop.type === "Support")` is robust
        // as it filters if *either* condition is true for it to be a helper.

        const stopNames = filteredStops.map(stop => stop.name).join(", ");
        return { bus_no: busNo, stops: stopNames };
      });
    } else if (cardTitle === "Today's Collection") {
      dataToDisplay = [{ amount: stats.totalCollection }];
    }

    setSelectedData(dataToDisplay);
  };

  return (
    <Grid container spacing={6} sx={{ marginBottom: "40px" }}>
      {cards.map((card, i) => {
        let countValue;
        if (card.title === "Total Routes") {
          countValue = Object.keys(stats.totalRoutes).length;
        } else if (card.isAmount) {
          countValue = `₹${stats[card.key] || 0}`;
        } else {
          countValue = stats[card.key]?.length || 0;
        }

        return (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 10, y: 0}}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                sx={{
                  background: "#f0f9ff",
                  "&:hover": { boxShadow: 20 },
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(card.title)}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {card.title}
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {countValue}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        );
      })}
    </Grid>
  );
}