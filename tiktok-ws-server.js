const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');

let tiktokLiveConnection;
let secretWord = '';

function connectToTikTok(username) {
    // Disconnect from any existing connection
    if (tiktokLiveConnection) {
        tiktokLiveConnection.disconnect();
    }

    // Create a new connection object
    tiktokLiveConnection = new WebcastPushConnection(username, {
        signApiToken: 'euler_MjhiZTZhMGM1NjExMDVlN2QxMjQwYmVlNjljOGE1MTBmOWY3NGQwY2ViM2Y4ODdlOWJhZjY3'
    });

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
                profilePictureUrl: data.profilePictureUrl
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
            } else if (data.type === 'setSecretWord') {
                secretWord = data.word;
                console.log(`Secret word set to: ${secretWord}`);
            }
        } catch (error) {
            console.error('Failed to parse message or invalid message format.');
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

