'use client';
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const LiveSessionContext = createContext();

export const useLiveSession = () => useContext(LiveSessionContext);

const RECONNECT_INTERVAL_MS = 3000; // Initial reconnect delay
const MAX_RECONNECT_ATTEMPTS = 10; // Max reconnect attempts

export const LiveSessionProvider = ({ children }) => {
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isClientConnected, setIsClientConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [chatHistory, setChatHistory] = useState([]);
  const [totalLikeCount, setTotalLikeCount] = useState(0);
  const [roomInfo, setRoomInfo] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  const handleConnect = useCallback(async (usernameToConnect = tiktokUsername) => {
    if (!usernameToConnect) {
      alert('Please enter a TikTok Username.');
      return;
    }
    setTiktokUsername(usernameToConnect);
    setStatusMessage('Connecting to WebSocket server...');

    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsClientConnected(false); // Reset client connected status on new connection
      setStatusMessage('Connected to WebSocket server. Requesting TikTok Live connection...');
      ws.send(JSON.stringify({
        type: 'setUsername',
        username: usernameToConnect,
      }));
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'status':
          setStatusMessage(message.message);
          if (message.roomInfo) {
            setRoomInfo(message.roomInfo.data);
          }
          if (message.message.includes('Connected to')) {
            setIsClientConnected(true);
          } else if (message.message.includes('Disconnected')) {
            // handleDisconnect(); // Removed to prevent client-side initiated disconnect loop
          }
          break;
        case 'comment':
          setChatHistory((prev) => {
            const newComment = { ...message.message, _clientId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
            const newChatHistory = [...prev, newComment];
            return newChatHistory;
          });
          break;
        case 'like':
          setTotalLikeCount(message.totalLikeCount);
          break;
        case 'viewerCount':
          setRoomInfo(prevRoomInfo => ({
            ...prevRoomInfo,
            user_count: message.viewerCount,
          }));
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // An error often precedes a close event, so we handle reconnection in onclose
      setStatusMessage('WebSocket error. Attempting to reconnect...');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsClientConnected(false);
      setStatusMessage('Disconnected. Attempting to reconnect...');

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_INTERVAL_MS * Math.pow(2, reconnectAttempts.current);
        console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          handleConnect(usernameToConnect);
        }, delay);
      } else {
        setStatusMessage('Disconnected. Max reconnection attempts reached.');
        console.log('Max reconnection attempts reached. Please connect manually.');
        setTiktokUsername(''); // Clear username to force manual re-entry
      }
    };

    wsRef.current = ws;
  }, [tiktokUsername]); // Dependency array for useCallback

  // Effect to handle initial connection or username changes
  useEffect(() => {
    if (tiktokUsername && !isConnected && !wsRef.current) {
      handleConnect(tiktokUsername);
    }
  }, [tiktokUsername, isConnected, handleConnect]);

  const handleDisconnect = () => {
    if (wsRef.current) {
      // Send disconnect message to server to clean up TikTok connection
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
      wsRef.current.close();
    }
    // Clear any pending reconnect attempts
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    reconnectAttempts.current = 0; // Reset attempts
    setIsConnected(false);
    setIsClientConnected(false);
    setTiktokUsername('');
    setRoomInfo(null);
    setChatHistory([]);
    setStatusMessage('Disconnected');
  };

  const value = {
    tiktokUsername,
    isConnected,
    isClientConnected,
    statusMessage,
    chatHistory,
    totalLikeCount,
    roomInfo,
    handleConnect,
    handleDisconnect,
    wsRef,
  };

  return (
    <LiveSessionContext.Provider value={value}>
      {children}
    </LiveSessionContext.Provider>
  );
};
