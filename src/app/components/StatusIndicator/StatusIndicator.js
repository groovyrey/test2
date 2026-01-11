import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Wifi, WifiOff, CheckCircle, Error, HourglassEmpty } from '@mui/icons-material';

const StatusIndicator = ({ statusMessage }) => {
  let icon;
  let color;
  let message = statusMessage;

  switch (true) {
    case statusMessage.includes('Disconnected'):
      icon = <WifiOff />;
      color = 'error';
      break;
    case statusMessage.includes('Connecting'):
    case statusMessage.includes('Requesting'):
      icon = <HourglassEmpty />;
      color = 'warning';
      break;
    case statusMessage.includes('Connected to'):
      icon = <CheckCircle />;
      color = 'success';
      message = `Live!`;
      break;
    case statusMessage.includes('Failed'):
    case statusMessage.includes('error'):
      icon = <Error />;
      color = 'error';
      break;
    default:
      icon = <Wifi />;
      color = 'info';
  }

  return (
    <Chip
      icon={icon}
      label={message}
      color={color}
      variant="outlined"
      sx={{
        p: 2,
        fontSize: '1rem',
        fontWeight: 'bold',
        borderWidth: '2px',
        '& .MuiChip-icon': {
          fontSize: '1.5rem',
        },
      }}
    />
  );
};

export default StatusIndicator;
