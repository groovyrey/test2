
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useLiveSession } from '../LiveSessionContext';
import { Card, CardContent, Typography, TextField, Button, Box, Avatar, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';

const GuessTheWord = () => {
  const { wsRef } = useLiveSession();
  const [secretWord, setSecretWord] = useState('');
  const [displayWord, setDisplayWord] = useState('');
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (secretWord) {
      setDisplayWord('_ '.repeat(secretWord.length));
    } else {
      setDisplayWord('');
    }
  }, [secretWord]);

  const handleWinnerMessage = useCallback((event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'winner') {
      setWinner(message.winner);
    }
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws) {
      ws.addEventListener('message', handleWinnerMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWinnerMessage);
      }
    };
  }, [wsRef, handleWinnerMessage]);

  const handleSetWord = (e) => {
    e.preventDefault();
    const word = e.target.elements.word.value;
    setSecretWord(word);
    setWinner(null);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'setSecretWord',
        word: word,
      }));
    }
  };

  const handlePlayAgain = () => {
    setSecretWord('');
    setWinner(null);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Guess the Word
        </Typography>
        {!secretWord ? (
          <form onSubmit={handleSetWord}>
            <Stack direction="row" spacing={1}>
              <TextField
                name="word"
                label="Enter the secret word"
                variant="outlined"
                size="small"
                fullWidth
              />
              <Button type="submit" variant="contained" endIcon={<SendIcon />}>
                Set
              </Button>
            </Stack>
          </form>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              The word is: {displayWord}
            </Typography>
            {winner ? (
              <Stack alignItems="center" spacing={1}>
                <Avatar src={winner.profilePictureUrl} sx={{ width: 56, height: 56 }} />
                <Typography variant="h6">{winner.uniqueId} guessed the word correctly!</Typography>
                <Button variant="contained" onClick={handlePlayAgain} startIcon={<ReplayIcon />}>
                  Play Again
                </Button>
              </Stack>
            ) : (
              <Typography>Waiting for someone to guess the word...</Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GuessTheWord;
