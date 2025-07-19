// // src/components/Sidebar.jsx
import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  useMediaQuery,
  Toolbar,
  AppBar,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const drawerWidth = 240;

const menuItems = [
  { text: "Dashboard", route: "/dashboard" },
  { text: "Bus location", route: "/bus-location" },
  { text: "Manage Routes", route: "/manage-routes" },
  { text: "Add bus", route: "/add-bus" },
  { text: "Reports", route: "/reports" },
  { text: "NFC assign", route: "/nfc-assign" },
  { text: "Settings", route: "/settings" },
  { text: "Logout", route: "/login" },
];

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (item) => {
    if (item.text === "Logout") {
      signOut(auth)
        .then(() => navigate("/login"))
        .catch((error) => console.error("Logout error:", error));
    } else {
      navigate(item.route);
    }

    if (isMobile) {
      setMobileOpen(false); // close drawer after click on mobile
    }
  };

  const drawer = (
    <Box sx={{ backgroundColor: "#111827", height: "100%", color: "#fff" }}>
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h6" sx={{ color: "#fff" }}>
          🚌 Admin Panel
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => handleMenuClick(item)}
            sx={{
              "&:hover": {
                backgroundColor: "#2563eb",
                color: "#fff",
              },
              paddingY: 1.5,
              paddingLeft: 3,
            }}
          >
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* AppBar only visible on mobile */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Admin Panel
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#111827",
              color: "#fff",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
}
