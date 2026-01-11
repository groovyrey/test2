'use client';
import React, { createContext, useContext, useState, useRef } from 'react';

const LiveSessionContext = createContext();

export const useLiveSession = () => useContext(LiveSessionContext);

export const LiveSessionProvider = ({ children }) => {
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isClientConnected, setIsClientConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [chatHistory, setChatHistory] = useState([]);
  const [totalLikeCount, setTotalLikeCount] = useState(0);
  const [roomInfo, setRoomInfo] = useState(null);
  const wsRef = useRef(null);

  const handleConnect = async (username) => {
    if (!username) {
      alert('Please enter a TikTok Username.');
      return;
    }
    setTiktokUsername(username);
    setStatusMessage('Connecting to WebSocket server...');

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setStatusMessage('Connected to WebSocket server. Requesting TikTok Live connection...');
      ws.send(JSON.stringify({
        type: 'setUsername',
        username: username,
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'status':
          setStatusMessage(message.message);
          if (message.roomInfo) {
            console.log('Received roomInfo:', message.roomInfo.data);
            setRoomInfo(message.roomInfo.data);
          }
          if (message.message.includes('Connected to')) {
            setIsClientConnected(true);
          } else if (message.message.includes('Disconnected')) {
            handleDisconnect();
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
      alert('WebSocket connection error. Check server status.');
      setIsConnected(false);
      setIsClientConnected(false);
      setStatusMessage('WebSocket connection error. Please check server.');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsClientConnected(false);
      setStatusMessage('Disconnected');
    };

    wsRef.current = ws;
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
      wsRef.current.close();
    }
    setIsConnected(false);
    setIsClientConnected(false);
    setTiktokUsername('');
    setRoomInfo(null);
    setChatHistory([]);
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
  };

  return (
    <LiveSessionContext.Provider value={value}>
      {children}
    </LiveSessionContext.Provider>
  );
};
