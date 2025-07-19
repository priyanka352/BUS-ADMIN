import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, update, set, get, query, limitToLast } from 'firebase/database';
import {
  Container,
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  CircularProgress,
  Snackbar,
  Alert,
  Fade,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  Usb,
  WifiOff,
  Wifi,
  Loader,
  Phone,
  Scan,
  Tag,
  CheckCircle,
  AlertCircle,
  Info,
  History,
  Bug,
} from 'lucide-react';
import { database } from '../firebase.js'; // Verify exact path and casing
import theme from '../Theme.jsx'; // Verify exact path and casing

// Custom hook for Web Serial API NFC scanning
const useSerialNFC = (onUIDScanned) => {
  const [serialPort, setSerialPort] = useState(null);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [connectionStatusMessage, setConnectionStatusMessage] = useState('Not Connected');
  const [connectionStatusType, setConnectionStatusType] = useState('disconnected'); // connected, disconnected, connecting, error
  const [isScanningActive, setIsScanningActive] = useState(false);
  const serialReaderRef = useRef(null);
  const serialBufferRef = useRef('');

  const logDebug = useCallback((message) => {
    console.log(`[DEBUG - Serial] ${new Date().toLocaleTimeString()} ${message}`);
  }, []);

  const formatUID = useCallback((uid) => uid.replace(/\s+/g, '').toUpperCase(), []);
  const displayUID = useCallback(
    (uid) => formatUID(uid).replace(/(.{2})/g, '$1 ').trim(),
    [formatUID]
  );

  const onSerialDisconnected = useCallback(() => {
    setIsSerialConnected(false);
    serialBufferRef.current = '';
    setSerialPort(null);
    serialReaderRef.current = null;
    setConnectionStatusMessage('Disconnected');
    setConnectionStatusType('disconnected');
    setIsScanningActive(false);
    logDebug('Serial connection fully disconnected');
  }, [logDebug]);

  const handleSerialError = useCallback(
    (error) => {
      logDebug(`Handling serial error: ${error.message}`);
      if (error.name === 'NotFoundError') {
        setConnectionStatusMessage('No compatible device found. Please check your connection.');
      } else if (error.name === 'SecurityError') {
        setConnectionStatusMessage('Permission denied. Please allow serial port access.');
      } else {
        setConnectionStatusMessage(`Error: ${error.message}`);
      }
      setConnectionStatusType('error');
      onSerialDisconnected();
    },
    [logDebug, onSerialDisconnected]
  );

  const processSerialLine = useCallback(
    (line) => {
      if (!line) return;
      logDebug(`Processing line: ${line}`);

      // Possible UID formats, adjust regex as needed for your ESP32 output
      const uidPatterns = [
        /NFC UID:\s*([0-9A-F\s]+)/i,
        /UID:\s*([0-9A-F\s]+)/i,
        /([0-9A-F]{2}\s[0-9A-F]{2}\s[0-9A-F]{2}\s[0-9A-F]{2})/i,
        /([0-9A-F]{8})/i,
      ];

      for (const pattern of uidPatterns) {
        const match = line.match(pattern);
        if (match) {
          const rawUID = match[1].trim();
          const formattedUID = displayUID(rawUID);
          logDebug(`Matched UID: ${rawUID} -> ${formattedUID}`);
          onUIDScanned(formattedUID);
          return;
        }
      }
    },
    [logDebug, displayUID, onUIDScanned]
  );

  const readSerialData = useCallback(async () => {
    logDebug('Starting serial data reader');
    const reader = serialReaderRef.current;
    if (!reader) return;

    try {
      while (isSerialConnected) {
        const { value, done } = await reader.read();
        if (done) {
          logDebug('Serial reader finished');
          break;
        }
        if (value) {
          serialBufferRef.current += value;
          logDebug('Received data chunk: ' + value.replace(/\n/g, '\\n'));

          const lines = serialBufferRef.current.split('\n');
          if (lines.length > 1) {
            for (let i = 0; i < lines.length - 1; i++) {
              processSerialLine(lines[i].trim());
            }
            serialBufferRef.current = lines[lines.length - 1];
          }
        }
      }
    } catch (error) {
      logDebug('Read error: ' + error.message);
      if (isSerialConnected) {
        handleSerialError(error);
      }
    }
  }, [isSerialConnected, logDebug, processSerialLine, handleSerialError]);

  const disconnectSerial = useCallback(async () => {
    logDebug('Disconnecting serial...');
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
        logDebug('Serial reader cancelled');
      }
      if (serialPort) {
        await serialPort.close();
        logDebug('Serial port closed');
      }
    } catch (error) {
      logDebug('Disconnect error: ' + error.message);
    } finally {
      onSerialDisconnected();
    }
  }, [serialPort, onSerialDisconnected, logDebug]);

  const connectSerial = useCallback(async () => {
    try {
      if (!navigator.serial) {
        setConnectionStatusMessage(
          'Web Serial API not supported. Use Chrome/Edge (v89+) for full functionality.'
        );
        setConnectionStatusType('error');
        return;
      }

      if (isSerialConnected) {
        await disconnectSerial();
        return;
      }

      setConnectionStatusMessage('Connecting to device...');
      setConnectionStatusType('connecting');
      logDebug('Initiating serial connection...');

      const port = await navigator.serial.requestPort();
      setSerialPort(port);
      logDebug(`Selected port: ${JSON.stringify(port.getInfo())}`);

      await port.open({ baudRate: 115200 });
      logDebug('Port opened at 115200 baud');

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      serialReaderRef.current = textDecoder.readable.getReader();

      setIsSerialConnected(true);
      setConnectionStatusMessage('Connected to ESP32');
      setConnectionStatusType('connected');
      setIsScanningActive(true);
      logDebug('Device connected. Ready to scan NFC tags.');

      readSerialData();
    } catch (error) {
      logDebug('Connection error: ' + error.message);
      handleSerialError(error);
    }
  }, [disconnectSerial, handleSerialError, isSerialConnected, logDebug, readSerialData]);

  useEffect(() => {
    function handleSerialDisconnect(event) {
      if (event.port === serialPort) {
        logDebug('Detected serial disconnection event');
        onSerialDisconnected();
      }
    }

    if (navigator.serial) {
      navigator.serial.addEventListener('disconnect', handleSerialDisconnect);
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isSerialConnected) {
        logDebug('Page hidden - pausing serial reading');
      }
    };
    const handleBeforeUnload = async (event) => {
      if (isSerialConnected) {
        await disconnectSerial();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (navigator.serial) {
        navigator.serial.removeEventListener('disconnect', handleSerialDisconnect);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [serialPort, isSerialConnected, disconnectSerial, onSerialDisconnected, logDebug]);

  useEffect(() => {
    if (!navigator.serial) {
      setConnectionStatusMessage(
        'Web Serial not supported. Use Chrome/Edge (v89+) for full functionality.'
      );
      setConnectionStatusType('error');
    }
  }, []);

  return {
    isSerialConnected,
    connectionStatusMessage,
    connectionStatusType,
    isScanningActive,
    connectSerial,
    disconnectSerial,
    isWebSerialSupported: !!navigator.serial,
  };
};

function App() {
  const [phone, setPhone] = useState('');
  const [uid, setUid] = useState('');
  const [statusMessage, setStatusMessage] = useState('NFC UID Assignment System Ready');
  const [statusType, setStatusType] = useState('info'); // success, error, info
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [showRecentAssignments, setShowRecentAssignments] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugConsoleOutput, setDebugConsoleOutput] = useState('');
  const debugConsoleRef = useRef(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const logDebug = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugConsoleOutput((prev) => prev + `[${timestamp}] ${message}\n`);
    if (debugConsoleRef.current) {
      debugConsoleRef.current.scrollTop = debugConsoleRef.current.scrollHeight;
    }
  }, []);

  const showStatus = useCallback(
    (message, type = 'info', useSnackbar = false) => {
      if (useSnackbar) {
        setSnackbarMessage(message);
        setSnackbarSeverity(type);
        setSnackbarOpen(true);
      } else {
        setStatusMessage(message);
        setStatusType(type);
      }
      logDebug(`STATUS: ${message}`);
    },
    [logDebug]
  );

  const handleUIDScanned = useCallback(
    (scannedUID) => {
      setUid(scannedUID);
      showStatus(`✅ Scanned UID: ${scannedUID}`, 'success', true);
      if (phone.trim() === '') {
        const inputElem = document.getElementById('phone-input');
        if (inputElem) inputElem.focus();
      }
    },
    [phone, showStatus]
  );

  const {
    isSerialConnected,
    connectionStatusMessage,
    connectionStatusType,
    isScanningActive,
    connectSerial,
    isWebSerialSupported,
  } = useSerialNFC(handleUIDScanned);

  const formatUID = useCallback((inputUid) => inputUid.replace(/\s+/g, '').toUpperCase(), []);
  const displayUID = useCallback(
    (inputUid) => formatUID(inputUid).replace(/(.{2})/g, '$1 ').trim(),
    [formatUID]
  );

  const handleUidInputChange = useCallback((e) => {
    let value = e.target.value.replace(/\s+/g, '').toUpperCase();
    let formatted = value.replace(/(.{2})/g, '$1 ').trim();
    setUid(formatted);
  }, []);

  const assignUID = useCallback(async () => {
    if (!phone || !uid) {
      showStatus('❗ Please enter both phone number and UID', 'error', true);
      return;
    }

    if (!/^\d{10,15}$/.test(phone)) {
      showStatus('❗ Invalid phone number (10-15 digits required)', 'error', true);
      return;
    }

    const cleanUID = formatUID(uid);
    if (!/^[0-9A-F]{8}$/.test(cleanUID)) {
      showStatus('❗ Invalid UID format (8 hex characters required)', 'error', true);
      return;
    }

    showStatus('🔄 Processing assignment...', 'info');
    logDebug(`Starting assignment: Phone=${phone}, UID=${cleanUID}`);

    try {
      const travelerRef = ref(database, 'Traveler/' + phone);
      const travelerSnapshot = await get(travelerRef);

      if (!travelerSnapshot.exists()) {
        showStatus(`❌ Phone number not registered: ${phone}`, 'error', true);
        logDebug('Assignment failed: Phone not found in database');
        return;
      }

      await update(travelerRef, { uid: cleanUID });
      logDebug('Updated Traveler record');

      const tagRef = ref(database, 'NFCtags/' + cleanUID);
      await set(tagRef, {
        phone,
        assignedAt: new Date().toISOString(),
        displayUID: displayUID(cleanUID),
      });
      logDebug('Updated NFCtags record');

      const successMsg = `✅ Assignment successful!
📱 Phone: ${phone}
🏷️ UID: ${displayUID(cleanUID)}
📅 ${new Date().toLocaleString()}`;
      showStatus(successMsg, 'success', false);
      logDebug('Assignment completed successfully');

      setPhone('');
      setUid('');
    } catch (error) {
      logDebug('Assignment error: ' + error.message);
      showStatus(`❌ Error: ${error.message}`, 'error', false);
    }
  }, [phone, uid, formatUID, displayUID, showStatus, logDebug]);

  const checkExistingUID = useCallback(async () => {
    if (!uid) {
      showStatus('❗ Please enter a UID to check', 'error', true);
      return;
    }

    const cleanUID = formatUID(uid);
    if (!/^[0-9A-F]{8}$/.test(cleanUID)) {
      showStatus('❗ Invalid UID format (8 hex characters required)', 'error', true);
      return;
    }

    showStatus('🔍 Checking UID assignment...', 'info');
    logDebug(`Checking UID: ${cleanUID}`);

    try {
      const tagRef = ref(database, 'NFCtags/' + cleanUID);
      const tagSnapshot = await get(tagRef);

      if (!tagSnapshot.exists()) {
        showStatus(`UID ${displayUID(cleanUID)} is not assigned`, 'info');
        logDebug('UID check: Not assigned');
        return;
      }

      const data = tagSnapshot.val();
      const resultMsg = `✅ UID assigned to:
📱 Phone: ${data.phone}
📅 Date: ${new Date(data.assignedAt).toLocaleString()}`;
      showStatus(resultMsg, 'success');
      logDebug(`UID check: Assigned to ${data.phone}`);
    } catch (error) {
      logDebug('UID check error: ' + error.message);
      showStatus(`❌ Error checking UID: ${error.message}`, 'error');
    }
  }, [uid, formatUID, displayUID, showStatus, logDebug]);

  const loadRecentAssignments = useCallback(async () => {
    showStatus('📋 Loading recent assignments...', 'info');
    logDebug('Loading recent assignments');
    setShowRecentAssignments(true);

    try {
      const nfcTagsQuery = query(ref(database, 'NFCtags'), limitToLast(10));
      const snapshot = await get(nfcTagsQuery);

      if (!snapshot.exists()) {
        showStatus('No assignments found in database', 'info');
        logDebug('No assignments found');
        setRecentAssignments([]);
        return;
      }

      const assignments = [];
      snapshot.forEach((childSnapshot) => {
        assignments.push({
          uid: childSnapshot.key,
          phone: childSnapshot.val().phone,
          assignedAt: childSnapshot.val().assignedAt || 'Unknown',
        });
      });

      assignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
      setRecentAssignments(assignments);
      showStatus(`Loaded ${assignments.length} recent assignments`, 'success');
      logDebug(`Displayed ${assignments.length} assignments`);
    } catch (error) {
      logDebug('Load assignments error: ' + error.message);
      showStatus(`❌ Error loading assignments: ${error.message}`, 'error');
      setRecentAssignments([]);
    }
  }, [showStatus, logDebug]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="sm"
        sx={{
          mt: 4,
          p: 3,
          backgroundColor: 'white',
          borderRadius: 3,
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mb: 4,
          fontFamily: 'Inter',
        }}
      >
        <Typography variant="h4" component="h1" align="center" sx={{ color: 'primary.main', mb: 3, fontWeight: 'bold' }}>
          <Tag size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          NFC UID Assignment System
        </Typography>

        {/* Connection Section */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            borderLeft: '5px solid',
            borderColor: 'primary.main',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
            backgroundColor: '#ecf0f1',
          }}
        >
          <Typography variant="h6" component="h3" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
            <Usb size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Device Connection
          </Typography>
          <Button
            variant="contained"
            onClick={connectSerial}
            disabled={!isWebSerialSupported}
            startIcon={connectionStatusType === 'connecting' ? <CircularProgress size={20} color="inherit" /> : <Usb />}
            sx={{ width: '100%', maxWidth: 300 }}
          >
            {isSerialConnected ? 'Disconnect USB' : 'Connect to ESP32 via USB'}
          </Button>
          <Alert
            severity={
              connectionStatusType === 'connected'
                ? 'success'
                : connectionStatusType === 'disconnected'
                ? 'error'
                : connectionStatusType === 'connecting'
                ? 'info'
                : 'warning'
            }
            sx={{ width: '100%', mt: 1, justifyContent: 'center' }}
            icon={
              connectionStatusType === 'connected' ? (
                <Wifi />
              ) : connectionStatusType === 'disconnected' ? (
                <WifiOff />
              ) : connectionStatusType === 'connecting' ? (
                <Loader className="animate-spin" />
              ) : (
                <AlertCircle />
              )
            }
          >
            {connectionStatusMessage}
          </Alert>
          <Typography variant="body2" color="text.secondary" fontStyle="italic" align="center">
            Connect your ESP32 device via USB cable to enable NFC tag scanning
          </Typography>
        </Paper>

        {/* Scan Indicator */}
        <Fade in={isScanningActive}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              mt: 2,
              textAlign: 'center',
              fontWeight: 600,
              border: '2px dashed',
              borderColor: 'info.main',
              backgroundColor: '#e8f4f8',
              color: 'info.main',
              animation: isScanningActive ? 'pulse 2s infinite' : undefined,
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              },
            }}
          >
            <Scan size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Ready to scan - Place NFC tag near reader
          </Box>
        </Fade>

        {/* Assignment Form */}
        <Box sx={{ mt: 3 }}>
          <TextField
            id="phone-input"
            label={
              <Typography>
                <Phone size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Phone Number:
              </Typography>
            }
            variant="outlined"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter traveler's phone number"
            helperText="10-15 digits, no spaces or special characters"
            sx={{ mb: 2 }}
          />

          <TextField
            id="uid-input"
            label={
              <Typography>
                <Tag size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} /> NFC UID:
              </Typography>
            }
            variant="outlined"
            fullWidth
            value={uid}
            onChange={handleUidInputChange}
            placeholder="Will auto-populate when scanning"
            helperText="UID will be automatically captured when scanning tags"
          />
        </Box>

        {/* Action Buttons */}
        <Button variant="contained" onClick={assignUID} sx={{ mt: 2 }}>
          Assign UID to Traveler
        </Button>
        <Button variant="outlined" onClick={checkExistingUID}>
          Check UID Assignment
        </Button>
        <Button variant="outlined" onClick={loadRecentAssignments}>
          Show Recent Assignments
        </Button>

        {/* Status Messages */}
        <Alert
          severity={statusType}
          sx={{ mt: 3, whiteSpace: 'pre-wrap' }}
          icon={
            statusType === 'success' ? (
              <CheckCircle />
            ) : statusType === 'error' ? (
              <AlertCircle />
            ) : statusType === 'info' ? (
              <Info />
            ) : (
              <AlertCircle />
            )
          }
        >
          {statusMessage}
        </Alert>

        {/* Recent Assignments */}
        {showRecentAssignments && (
          <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>
              <History size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Recent UID Assignments
            </Typography>
            {recentAssignments.length > 0 ? (
              <List sx={{ p: 0 }}>
                {recentAssignments.map((assignment, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      mb: 1.5,
                      p: 2,
                      backgroundColor: 'white',
                      borderRadius: 1.5,
                      borderLeft: '5px solid',
                      borderColor: 'primary.light',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      display: 'block', // Multi-line content
                    }}
                  >
                    <Typography variant="body2" component="div">
                      <strong>UID:</strong> {displayUID(assignment.uid)}
                      <br />
                      <strong>Phone:</strong> {assignment.phone}
                      <br />
                      <strong>Assigned:</strong> {new Date(assignment.assignedAt).toLocaleString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No recent assignments to display.
              </Typography>
            )}
          </Paper>
        )}

        {/* Debug Console Toggle */}
        <Button
          variant="contained"
          size="small"
          onClick={() => setDebugMode((prev) => !prev)}
          sx={{ mt: 2, alignSelf: 'flex-start', bgcolor: '#34495e', '&:hover': { bgcolor: '#2c3e50' } }}
          startIcon={<Bug size={16} />}
        >
          {debugMode ? 'Hide Debug Console' : 'Show Debug Console'}
        </Button>

        {/* Debug Console */}
        {debugMode && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mt: 2,
              borderRadius: 2,
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              overflowY: 'auto',
              maxHeight: 200,
              fontFamily: 'monospace',
            }}
          >
            <pre ref={debugConsoleRef} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {debugConsoleOutput}
            </pre>
          </Paper>
        )}

        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
