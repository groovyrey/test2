'use client';
import React, { useState } from 'react';
import { useLiveSession } from './components/LiveSessionContext';
import { TextField, Button, Box, Container, Paper, CircularProgress, Typography, Stack } from '@mui/material'; // Added Stack
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import LiveChat from './components/LiveChat/LiveChat';
import StatusIndicator from './components/StatusIndicator/StatusIndicator';
import RoomInfo from './components/RoomInfo/RoomInfo';
import GuessTheWord from './components/GuessTheWord/GuessTheWord';

const HomePage = () => {
  const {
    isConnected,
    isClientConnected,
    statusMessage,
    chatHistory,
    totalLikeCount,
    roomInfo,
    handleConnect,
    handleDisconnect,
  } = useLiveSession();

  const [username, setUsername] = useState('');

  const handleConnectClick = () => {
    handleConnect(username);
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <Stack spacing={3} alignItems="center" sx={{ mt: 4, width: '100%' }}> {/* Using Stack for spacing */}
          <TextField
            label="TikTok Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            sx={{ maxWidth: 350 }}
          />
          <Button
            variant="contained"
            onClick={handleConnectClick}
            disabled={!username}
            startIcon={<ConnectWithoutContactIcon />}
            fullWidth
            sx={{ maxWidth: 350 }}
          >
            Connect
          </Button>
        </Stack>
      );
    }

    if (isClientConnected) {
      return (
        <Stack spacing={3} sx={{ mt: 2, textAlign: 'center', width: '100%' }}> {/* Using Stack for spacing */}
          <RoomInfo roomInfo={roomInfo} totalLikeCount={totalLikeCount} />
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisconnect}
            sx={{ mt: 2 }}
          >
            Disconnect
          </Button>
          <GuessTheWord />
          <LiveChat chatHistory={chatHistory} />
        </Stack>
      );
    }

    return (
      <Stack spacing={2} alignItems="center" sx={{ mt: 4, width: '100%' }}> {/* Using Stack for spacing */}
        <CircularProgress size={60} thickness={5} /> {/* Larger spinner */}
        <Typography variant="h6" component="h2" color="text.secondary">
          Establishing connection...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we connect to the TikTok Live stream.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDisconnect}
          sx={{ maxWidth: 300, mt: 2 }}
        >
          Cancel Connection
        </Button>
      </Stack>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={6} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}> {/* Increased elevation and padding, adjusted gap */}
        <Typography variant="h4" component="h1" gutterBottom>
          TikTok Live Connector
        </Typography>
        <StatusIndicator statusMessage={statusMessage} />
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default HomePage;
