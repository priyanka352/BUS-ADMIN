// // src/pages/AddBus.jsx
// import { useState, useEffect } from 'react';
// import { Container, TextField, Button, Typography, Box, Paper, IconButton, Grid } from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
// import EditIcon from '@mui/icons-material/Edit';
// import { motion } from 'framer-motion';
// import { addBus, fetchBuses, deleteBus, updateBus } from '../firebaseUtils';

// export default function AddBus() {
//   const [bus_no, setBusNo] = useState('');
//   const [routes, setRoutes] = useState([{ name: '', latitude: '', longitude: '', isHelper: false }]);
//   const [buses, setBuses] = useState([]);
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     fetchBuses(setBuses);
//   }, []);

//   const handleRouteChange = (index, field, value) => {
//     const updatedRoutes = [...routes];
//     updatedRoutes[index][field] = field === 'isHelper' ? value === 'true' : value;
//     setRoutes(updatedRoutes);
//   };

//   const addRoute = () => {
//     setRoutes([...routes, { name: '', latitude: '', longitude: '', isHelper: false }]);
//   };

//   const removeRoute = (index) => {
//     const updated = routes.filter((_, i) => i !== index);
//     setRoutes(updated);
//   };

//   const clearForm = () => {
//     setBusNo('');
//     setRoutes([{ name: '', latitude: '', longitude: '', isHelper: false }]);
//     setEditId(null);
//   };

//   const handleSubmit = async () => {
//     const payload = {
//       bus_no,
//       routes: routes.map(r => ({
//         name: r.name.trim(),
//         lat: parseFloat(r.latitude),
//         long: parseFloat(r.longitude),
//         isHelper: Boolean(r.isHelper)
//       }))
//     };

//     if (editId) {
//       await updateBus(editId, payload);
//     } else {
//       await addBus(payload);
//     }

//     clearForm();
//   };

//   const handleEdit = (bus) => {
//     setBusNo(bus.bus_no);
//     setRoutes(bus.routes.map(r => ({
//       name: r.name,
//       latitude: r.lat,
//       longitude: r.long,
//       isHelper: r.isHelper
//     })));
//     setEditId(bus.id);
//   };

//   return (
//     <Container sx={{ mt: 5 }}>
//       <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
//         <Typography variant="h4" align="center" gutterBottom component={motion.div} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
//           {editId ? 'Edit Bus' : 'Add Bus'}
//         </Typography>

//         <TextField label="Bus Number" value={bus_no} onChange={e => setBusNo(e.target.value)} fullWidth sx={{ mb: 2 }} />

//         {routes.map((route, index) => (
//           <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
//             <TextField label="Stop Name" value={route.name} onChange={e => handleRouteChange(index, 'name', e.target.value)} fullWidth />
//             <TextField label="Lat" value={route.latitude} onChange={e => handleRouteChange(index, 'latitude', e.target.value)} fullWidth />
//             <TextField label="Long" value={route.longitude} onChange={e => handleRouteChange(index, 'longitude', e.target.value)} fullWidth />
//             <TextField label="isHelper (true/false)" value={route.isHelper} onChange={e => handleRouteChange(index, 'isHelper', e.target.value)} fullWidth />
//             <IconButton color="error" onClick={() => removeRoute(index)}><DeleteIcon /></IconButton>
//           </Box>
//         ))}

//         <Button onClick={addRoute} variant="outlined" sx={{ mb: 2 }}>+ Add Route</Button>
//         <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ ml: 2 }}>
//           {editId ? 'Update Bus' : 'Submit Bus'}
//         </Button>
//       </Paper>

//       {/* List all buses */}
//       <Typography variant="h5" sx={{ mt: 5 }}>All Buses</Typography>
//       <Grid container spacing={2} sx={{ mt: 1 }}>
//         {buses.map(bus => (
//           <Grid item xs={12} key={bus.id}>
//             <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//               <Typography>{bus.bus_no} ({bus.routes.length} stops)</Typography>
//               <Box>
//                 <IconButton color="info" onClick={() => handleEdit(bus)}><EditIcon /></IconButton>
//                 <IconButton color="error" onClick={() => deleteBus(bus.id)}><DeleteIcon /></IconButton>
//               </Box>
//             </Paper>
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// }
