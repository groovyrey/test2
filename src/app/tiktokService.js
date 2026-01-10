const { WebcastPushConnection } = require('tiktok-live-connector');

// Username of the TikTok streamer
const TIKTOK_USERNAME = '@look.a.babydeer';

let lastComment = 'No comments yet.';

// Create a new connection object
const tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

// Connect to the stream
tiktokLiveConnection.connect().then(state => {
    console.info(`Connected to roomId ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect', err);
});

// Listen for chat messages
tiktokLiveConnection.on('chat', data => {
    lastComment = `${data.uniqueId}: ${data.comment}`;
    console.log(lastComment);
});

// Optional: Listen for other events
tiktokLiveConnection.on('gift', data => {
    console.log(`${data.uniqueId} sent a gift!`);
});

tiktokLiveConnection.on('like', data => {
    console.log(`${data.uniqueId} liked the stream!`);
});

function getLastComment() {
    return lastComment;
}

module.exports = {
    getLastComment
};
