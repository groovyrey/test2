import React from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';

const RoomInfo = ({ roomInfo, totalLikeCount }) => {
  if (!roomInfo) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'background.paper' }}>
      {roomInfo.owner && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {roomInfo.owner.avatar_thumb && (
            <Avatar src={roomInfo.owner.avatar_thumb.url_list[0]} sx={{ width: 56, height: 56, mr: 2 }} />
          )}
          <Box>
            <Typography variant="h6">{roomInfo.owner.nickname}</Typography>
            <Typography variant="body2" color="text.secondary">@{roomInfo.owner.display_id}</Typography>
          </Box>
        </Box>
      )}
      <Typography variant="body1" sx={{ mb: 2 }}>{roomInfo.title}</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Chip
          icon={<VisibilityIcon />}
          label={`${roomInfo.user_count} viewers`}
          variant="outlined"
        />
        <Chip
          icon={<FavoriteIcon sx={{ color: '#EB2D8C' }} />}
          label={totalLikeCount}
          variant="outlined"
        />
      </Box>
    </Paper>
  );
};

export default RoomInfo;
