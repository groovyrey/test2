const WebSocket = require('ws');

try {
    const wss = new WebSocket.Server({ port: 8080 });

    console.log('Simple WebSocket server started on port 8080');

    wss.on('connection', ws => {
        console.log('Client connected');
        ws.send('Hello from the simple server!');
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    wss.on('error', (error) => {
        console.error('WebSocket Server Error:', error);
    });

} catch (error) {
    console.error('Failed to start server:', error);
}
