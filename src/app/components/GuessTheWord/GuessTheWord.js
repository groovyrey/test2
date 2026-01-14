
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveSession } from '../LiveSessionContext';
import { Card, CardContent, Typography, Button, Box, Avatar, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';

const GuessTheWord = () => {
  const { wsRef } = useLiveSession();
  const [displayWord, setDisplayWord] = useState('');
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [secretWordDefinition, setSecretWordDefinition] = useState('');
  const [countdown, setCountdown] = useState(0);
  const countdownIntervalRef = useRef(null);

  const handleNewWordMessage = useCallback((event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'newWord') {
      const word = message.secretWord;
      let display = Array(word.length).fill('_');
      message.revealedLetters.forEach(index => {
        display[index] = word[index];
      });
      setDisplayWord(display.join(' '));
      setSecretWordDefinition(message.secretWordDefinition);
      setGameStarted(true);
      setWinner(null);
      setCountdown(0); // Reset countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, []);

  const handleRevealLetterMessage = useCallback((event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'revealLetter') {
      setDisplayWord(prevDisplay => {
        const displayArray = prevDisplay.split(' ');
        displayArray[message.index] = message.letter;
        return displayArray.join(' ');
      });
    }
  }, []);

  const handleWinnerMessage = useCallback((event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'winner') {
      setWinner(message.winner);
      setGameStarted(false); // Game ends when winner is announced
    }
  }, []);

  const handleCountdownStartMessage = useCallback((event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'countdownStart') {
      setCountdown(message.duration);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws) {
      ws.addEventListener('message', handleNewWordMessage);
      ws.addEventListener('message', handleWinnerMessage);
      ws.addEventListener('message', handleCountdownStartMessage);
      ws.addEventListener('message', handleRevealLetterMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleNewWordMessage);
        ws.removeEventListener('message', handleWinnerMessage);
        ws.removeEventListener('message', handleCountdownStartMessage);
        ws.removeEventListener('message', handleRevealLetterMessage);
      }
    };
  }, [wsRef, handleNewWordMessage, handleWinnerMessage, handleCountdownStartMessage, handleRevealLetterMessage]);

  const handleStartGame = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'startNewGame',
      }));
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Guess the Word
        </Typography>
        {!gameStarted && !winner ? ( // Show start button if no game started and no winner displayed
          <Button variant="contained" onClick={handleStartGame} startIcon={<PlayArrowIcon />}>
            Start New Game
          </Button>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              The word is: {displayWord}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Definition: {secretWordDefinition}
            </Typography>
            {winner ? (
              <Stack alignItems="center" spacing={1}>
                <Avatar src={winner.profilePictureUrl} sx={{ width: 56, height: 56 }} />
                <Typography variant="h6">{winner.uniqueId} guessed the word correctly!</Typography>
                <Typography variant="h5">The word was: {winner.secretWord}</Typography>
                <Typography variant="body1">Definition: {winner.secretWordDefinition}</Typography>
                {countdown > 0 && (
                  <Typography variant="h6" color="primary">Next game in {countdown} seconds...</Typography>
                )}
                <Button variant="contained" onClick={handleStartGame} startIcon={<ReplayIcon />}>
                  Play Again
                </Button>
              </Stack>
            ) : (
              <>
                <Typography>Waiting for someone to guess the word...</Typography>
                {countdown > 0 && (
                  <Typography variant="h6" color="primary">Next game in {countdown} seconds...</Typography>
                )}
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GuessTheWord;
