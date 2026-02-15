const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize DB
initDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

// --- Auth Routes ---

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, trophies, level',
            [username, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: "Username already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Return user info (excluding password)
        res.json({
            id: user.id,
            username: user.username,
            trophies: user.trophies,
            level: user.level
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- Socket.IO Game Logic ---

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

            const roomId = `room_${player1}_${player2}`;
            console.log(`Match found: ${player1} vs ${player2} in ${roomId}`);

            // Make both sockets join the room
            // Note: io.sockets.sockets is a Map in Socket.IO v4
            const s1 = io.sockets.sockets.get(player1);
            const s2 = io.sockets.sockets.get(player2);

            if (s1 && s2) {
                s1.join(roomId);
                s2.join(roomId);

                // Store room ID on socket for easy access later logic? 
                // Alternatively, client sends room ID, or we track it.
                // For now, let's just use the fact they are in a room. 
                // Actually, 'card-played' needs to know WHICH room to broadcast to.
                // `socket.rooms` contains room IDs.

                // Notify both players
                io.to(player1).emit('game-start', { opponentId: player2, role: 'player1', roomId });
                io.to(player2).emit('game-start', { opponentId: player1, role: 'player2', roomId });
            }
        }
    });

    // Relay Card Placement
    socket.on('card-played', (data) => {
        console.log('Card played by', socket.id, data);

        // Find the game room this socket is in (excluding their own ID)
        // socket.rooms is a Set. It contains socket.id and any joined rooms.
        let gameRoom = null;
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                gameRoom = room;
                break;
            }
        }

        if (gameRoom) {
            // Broadcast to everyone in the room EXCEPT sender
            socket.to(gameRoom).emit('opponent-card-played', {
                id: socket.id,
                cardId: data.cardId,
                position: data.position
            });
        }
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

