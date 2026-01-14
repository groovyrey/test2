require('dotenv').config();
const { WebcastPushConnection, SignConfig } = require('tiktok-live-connector');
const WebSocket = require('ws');
const axios = require('axios');

SignConfig.apiKey = process.env.EULER_API_KEY;

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');

let tiktokLiveConnection;
let secretWord = '';
let secretWordDefinition = '';
let revealedLetters = new Set();
let revealLetterInterval = null;

function clearRevealLetterInterval() {
    if (revealLetterInterval) {
        clearInterval(revealLetterInterval);
        revealLetterInterval = null;
    }
}

async function getNewWord() {
    clearRevealLetterInterval(); // Clear any existing interval
    secretWord = ''; // Reset secret word
    secretWordDefinition = ''; // Reset definition
    revealedLetters.clear(); // Clear revealed letters

    try {
        const response = await axios.get('https://random-word-api.herokuapp.com/word');
        const word = response.data[0];
        const definitionResponse = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (definitionResponse.data[0]?.meanings[0]?.definitions[0]?.definition) {
            secretWord = word;
            secretWordDefinition = definitionResponse.data[0].meanings[0].definitions[0].definition;
            console.log(`New secret word: ${secretWord} (Definition: ${secretWordDefinition})`);

            // Initial reveal of 3 random letters
            let initialRevealedCount = 0;
            while (initialRevealedCount < 3 && initialRevealedCount < secretWord.length) {
                const randomIndex = Math.floor(Math.random() * secretWord.length);
                if (!revealedLetters.has(randomIndex)) {
                    revealedLetters.add(randomIndex);
                    initialRevealedCount++;
                }
            }

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'newWord',
                        secretWord: secretWord, // Send the actual secret word
                        secretWordDefinition: secretWordDefinition, // Send the definition
                        revealedLetters: Array.from(revealedLetters) // Send initially revealed letters
                    }));
                }
            });

            // Start interval to reveal a letter every 15 seconds
            revealLetterInterval = setInterval(() => {
                if (revealedLetters.size < secretWord.length) {
                    let randomIndex;
                    do {
                        randomIndex = Math.floor(Math.random() * secretWord.length);
                    } while (revealedLetters.has(randomIndex));

                    revealedLetters.add(randomIndex);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'revealLetter',
                                index: randomIndex,
                                letter: secretWord[randomIndex]
                            }));
                        }
                    });
                } else {
                    clearRevealLetterInterval(); // All letters revealed
                }
            }, 15000); // 15 seconds
        } else {
            getNewWord();
        }
    } catch (error) {
        console.error('Error getting new word:', error);
        getNewWord();
    }
}

function connectToTikTok(username) {
    // Disconnect from any existing connection
    if (tiktokLiveConnection) {
        tiktokLiveConnection.disconnect();
    }

    // Create a new connection object
    tiktokLiveConnection = new WebcastPushConnection(username);

    // Connect to the stream
    tiktokLiveConnection.connect().then(state => {
        console.info(`Connected to roomId ${state.roomId} for user ${username}`);
        // Broadcast connection status and room info
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'status',
                    message: `Connected to ${username}`,
                    roomInfo: state.roomInfo // Send the entire roomInfo object
                }));
            }
        });
    }).catch(err => {
        console.error(`Failed to connect to ${username}`, err);
        // Broadcast connection error
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'status', message: `Failed to connect to ${username}. Is the user live?` }));
            }
        });
    });

    // Listen for chat messages
    tiktokLiveConnection.on('chat', async data => { // Made async to await gameManager.guess
        const commentData = {
            messageId: Date.now(), // Add a unique ID for each message
            uniqueId: data.uniqueId,
            comment: data.comment,
            profilePictureUrl: data.profilePictureUrl // Include profile picture URL
        };
        // Broadcast to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'comment', message: commentData }));
            }
        });

        // Game logic
        if (secretWord && data.comment.toLowerCase().includes(secretWord.toLowerCase())) {
            const winnerData = {
                uniqueId: data.uniqueId,
                profilePictureUrl: data.profilePictureUrl,
                secretWord: secretWord,
                secretWordDefinition: secretWordDefinition
            };
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'winner',
                        winner: winnerData
                    }));
                }
            });
            secretWord = ''; // Reset the secret word
            clearRevealLetterInterval(); // Clear the letter revelation interval
            // Notify clients that a countdown has started
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'countdownStart',
                        duration: 10 // seconds
                    }));
                }
            });
            // Introduce a 10-second delay before starting a new game
            setTimeout(() => {
                getNewWord();
            }, 10000); // 10 seconds delay
        }
    });

    // Listen for likes
    tiktokLiveConnection.on('like', (data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'like', totalLikeCount: data.totalLikeCount }));
            }
        });
    });

    // Listen for viewer count updates
    tiktokLiveConnection.on('roomUser', (data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'viewerCount', viewerCount: data.viewerCount }));
            }
        });
    });

    tiktokLiveConnection.on('disconnected', (reason) => {
        console.log('Disconnected from TikTok Live stream. Reason:', reason);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'status', message: 'Disconnected from TikTok' }));
            }
        });
    });

    tiktokLiveConnection.on('error', err => {
        console.error('Error from TikTok Live stream:', err);
        console.error('Full error object:', JSON.stringify(err, null, 2));
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'status', message: 'Error from TikTok Live stream.' }));
            }
        });
    });
}


wss.on('connection', ws => {
    console.log('Client connected');
    if (secretWord) {
        ws.send(JSON.stringify({
            type: 'newWord',
            secretWord: secretWord,
            secretWordDefinition: secretWordDefinition,
            revealedLetters: Array.from(revealedLetters)
        }));
    } else {
        getNewWord(); // Start a new game if no game is active
    }

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'setUsername') {
                const newUsername = data.username;
                console.log(`Received request to connect to ${newUsername}`);
                connectToTikTok(newUsername);
            } else if (data.type === 'disconnect') {
                console.log('Received request to disconnect');
                if (tiktokLiveConnection) {
                    // Remove all listeners to stop processing new events immediately
                    tiktokLiveConnection.removeAllListeners();
                    tiktokLiveConnection.disconnect();
                    console.log('Disconnected from TikTok');
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'status', message: 'Disconnected' }));
                        }
                    });
                }
            } else if (data.type === 'startNewGame') {
                getNewWord();
            }
        } catch (error) {
            console.error('Failed to parse message or invalid message format.');
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

