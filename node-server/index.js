const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

let waitingPlayers = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Notify player of their ID
    socket.emit('connect_ack', { id: socket.id });

    // Handle Matchmaking
    socket.on('find-match', () => {
        console.log('User searching for match:', socket.id);

        // Remove if already in queue (to be safe)
        waitingPlayers = waitingPlayers.filter(id => id !== socket.id);

        waitingPlayers.push(socket.id);

        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift();
            const player2 = waitingPlayers.shift();

            console.log(`Match found: ${player1} vs ${player2}`);

            // Notify both players
            io.to(player1).emit('game-start', { opponentId: player2, role: 'player1' });
            io.to(player2).emit('game-start', { opponentId: player1, role: 'player2' });
        }
    });

    // Relay Card Placement
    socket.on('card-played', (data) => {
        console.log('Card played by', socket.id, data);
        // Broadcast to everyone else (opponent) - In a real game we would target specific room
        socket.broadcast.emit('opponent-card-played', {
            id: socket.id,
            cardId: data.cardId,
            position: data.position
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        waitingPlayers = waitingPlayers.filter(id => id !== socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
