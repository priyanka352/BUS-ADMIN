// src/Theme.jsx
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // blue
    },
    secondary: {
      main: '#ff4081', // pink
    },
    background: {
      default: '#f4f6f8',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  shape: {
    borderRadius: 15,
  },
});

export default theme;
