'use client';
import React, { useState, useEffect, useRef } from 'react';
// Removed Firebase Functions imports
import { TextField, Button, Box, Container, Paper, CircularProgress, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, FormControl, InputLabel, Select, MenuItem } from '@mui/material'; // Import MUI components
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import LiveChat from './components/LiveChat/LiveChat';

const HomePage = () => {
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isClientConnected, setIsClientConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [chatHistory, setChatHistory] = useState([]);
  const [game, setGame] = useState(null);
  const [selectedInteractionType, setSelectedInteractionType] = useState('chatOnly'); // New state for interaction type
  const wsRef = useRef(null); // Ref for WebSocket instance

  const handleConnect = async () => {
    if (!tiktokUsername) {
      alert('Please enter a TikTok Username.');
      return;
    }
    setStatusMessage('Connecting to WebSocket server...');

    // Close any existing WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Establish WebSocket connection
    const ws = new WebSocket('ws://localhost:8080'); // Assuming WebSocket server runs on 8080

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setStatusMessage('Connected to WebSocket server. Requesting TikTok Live connection...');
      // Send username and selected interaction type to WebSocket server
      ws.send(JSON.stringify({
        type: 'setUsername',
        username: tiktokUsername,
        interactionType: selectedInteractionType, // Send interaction type
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'status':
          setStatusMessage(message.message);
          // Handle connection status messages from the server
          if (message.message.includes('Connected to')) {
            setIsClientConnected(true);
            // Assuming the server sends initial game data or we fetch it
            // For now, let's simulate a game object
            setGame({ id: 'tiktok-live-game', type: 'default', status: 'active' });
          } else if (message.message.includes('Disconnected')) {
            handleDisconnect();
          }
          break;
        case 'comment':
          setChatHistory((prev) => {
            const newComment = { ...message.message, _clientId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
            const newChatHistory = [...prev, newComment];
            return newChatHistory.slice(-20); // Keep only the latest 20 comments
          });
          break;
        case 'like':
          // setLikeHistory((prev) => [...prev, message.message]); // Removed
          break;
        case 'gift':
          // setGiftHistory((prev) => [...prev, message.message]); // Removed
          break;
        // Add more cases for other message types (e.g., game updates)
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      alert('WebSocket connection error. Check server status.');
      setIsConnected(false);
      setIsClientConnected(false);
      setGame(null);
      setStatusMessage('WebSocket connection error. Please check server.');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsClientConnected(false);
      setGame(null);
      setStatusMessage('Disconnected');
    };

    wsRef.current = ws; // Store WebSocket instance in ref
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' })); // Inform server of disconnect
      wsRef.current.close();
    }
    setIsConnected(false);
    setIsClientConnected(false);
    setGame(null);
    setTiktokUsername('');
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 4 }}>
          <TextField
            label="TikTok Username"
            variant="outlined"
            value={tiktokUsername}
            onChange={(e) => setTiktokUsername(e.target.value)}
            fullWidth
            sx={{ maxWidth: 300 }}
          />
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={!tiktokUsername}
            startIcon={<ConnectWithoutContactIcon />}
            sx={{ maxWidth: 300 }}
          >
            Connect
          </Button>
        </Box>
      );
    }

    if (isClientConnected && game) {
      return (
        <Box sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
          <Typography variant="h6">Connected to TikTok Live!</Typography>
          <Typography variant="body1">Game and chat functionality removed.</Typography>
          <FormControl fullWidth sx={{ maxWidth: 300, mt: 2, mb: 2 }}>
            <InputLabel id="interaction-type-label">Interaction Type</InputLabel>
            <Select
              labelId="interaction-type-label"
              id="interaction-type-select"
              value={selectedInteractionType}
              label="Interaction Type"
              onChange={(e) => setSelectedInteractionType(e.target.value)}
            >
              <MenuItem value="chatOnly">Chat Only</MenuItem>
              <MenuItem value="game">Game</MenuItem>
              <MenuItem value="qa">Q&A</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisconnect}
            sx={{ mt: 2 }}
          >
            Disconnect
          </Button>

          <LiveChat chatHistory={chatHistory} />
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="subtitle1">Waiting for connection...</Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDisconnect}
          sx={{ maxWidth: 300 }}
        >
          Disconnect
        </Button>
      </Box>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          TikTok Live Connector
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
          Status: {statusMessage}
        </Typography>
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default HomePage;