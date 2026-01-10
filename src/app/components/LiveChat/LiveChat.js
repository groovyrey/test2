// src/app/components/LiveChat/LiveChat.js
import React, { useEffect, useRef } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Avatar } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import styles from './LiveChat.module.css';

const LiveChat = ({ chatHistory }) => {
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollTop = commentsEndRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <>
      <Typography variant="h6" gutterBottom>Live Comments</Typography>
      <Box ref={commentsEndRef} sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px', p: 1 }}>
        <List>
          {chatHistory.map((chat, index) => (
            <ListItem key={chat._clientId} alignItems="flex-start">
              {chat.profilePictureUrl ? (
                <Avatar alt={chat.uniqueId} src={chat.profilePictureUrl} />
              ) : (
                <AccountCircleIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              )}
              <ListItemText
                primary={
                  <Typography component="span" variant="subtitle2" color="text.primary">
                    {chat.uniqueId}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Typography>
                }
                secondary={chat.comment}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
};

export default LiveChat;
