const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const bs58 = require('bs58');

// Solana/Anchor imports
const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const IDL = require('./game_core.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Blockchain Setup ---
const PROGRAM_ID = new PublicKey(IDL.address);
const RPC_URL = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';

// Parse server private key from env
let serverKeypair;
try {
    const rawKey = process.env.SERVER_PRIVATE_KEY;
    if (!rawKey) {
        console.warn('⚠️  SERVER_PRIVATE_KEY not set in .env. Please add a funded keypair.');
        serverKeypair = Keypair.generate(); // Temporary fallback
    } else {
        // Try parsing as JSON array first
        try {
            const privateKeyArray = JSON.parse(rawKey);
            serverKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
        } catch (jsonErr) {
            // Fallback to Base58 parsing
            try {
                const decoded = bs58.decode(rawKey);
                serverKeypair = Keypair.fromSecretKey(decoded);
            } catch (bs58Err) {
                throw new Error('Invalid SERVER_PRIVATE_KEY format. Must be JSON array or Base58 string.');
            }
        }
    }
    console.log('✅ Server Authority Wallet:', serverKeypair.publicKey.toBase58());
} catch (err) {
    console.error('❌ Error parsing SERVER_PRIVATE_KEY:', err.message);
    process.exit(1);
}

// Initialize Anchor Provider
const connection = new Connection(RPC_URL, { commitment: 'confirmed' });
const wallet = new Wallet(serverKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(IDL, provider);

console.log('✅ Connected to Solana:', RPC_URL);
console.log('✅ Program ID:', PROGRAM_ID.toBase58());

// --- Helper Functions ---
function getPlayerProfilePda(authority) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("player"), authority.toBuffer()],
        PROGRAM_ID
    )[0];
}

// --- Socket.IO Game Logic ---
let waitingPlayers = [];

io.on('connection', (socket) => {
    const walletPublicKey = socket.handshake.query.walletPublicKey;

    if (!walletPublicKey) {
        console.log('❌ Connection rejected: No wallet public key provided');
        socket.disconnect();
        return;
    }

    try {
        const walletPubkey = new PublicKey(walletPublicKey);
        socket.walletPublicKey = walletPubkey;
        console.log('✅ User connected:', socket.id, '| Wallet:', walletPublicKey);
    } catch (err) {
        console.log('❌ Invalid wallet public key:', walletPublicKey);
        socket.disconnect();
        return;
    }

    socket.emit('connect_ack', { id: socket.id, wallet: walletPublicKey });

    // Handle Matchmaking
    socket.on('find-match', async () => {
        console.log('🔍 User searching for match:', socket.id);

        waitingPlayers = waitingPlayers.filter(id => id !== socket.id);
        waitingPlayers.push(socket.id);

        if (waitingPlayers.length >= 2) {
            const player1Id = waitingPlayers.shift();
            const player2Id = waitingPlayers.shift();

            const s1 = io.sockets.sockets.get(player1Id);
            const s2 = io.sockets.sockets.get(player2Id);

            if (s1 && s2) {
                const player1Wallet = s1.walletPublicKey;
                const player2Wallet = s2.walletPublicKey;

                console.log(`🎮 Match found: ${player1Wallet.toBase58()} vs ${player2Wallet.toBase58()}`);

                try {
                    // Generate keypairs for game and battle
                    const gameKeypair = Keypair.generate();
                    const battleKeypair = Keypair.generate();

                    console.log('⏳ Creating game on-chain...');
                    console.log('  Game PDA:', gameKeypair.publicKey.toBase58());
                    console.log('  Battle PDA:', battleKeypair.publicKey.toBase58());

                    // Call startGame instruction
                    const tx = await program.methods
                        .startGame()
                        .accounts({
                            game: gameKeypair.publicKey,
                            battle: battleKeypair.publicKey,
                            playerOne: player1Wallet,
                            playerTwo: player2Wallet,
                            authority: serverKeypair.publicKey,
                            systemProgram: SystemProgram.programId,
                        })
                        .signers([gameKeypair, battleKeypair])
                        .rpc();

                    console.log('✅ Game created on-chain. TX:', tx);

                    const roomId = `room_${gameKeypair.publicKey.toBase58()}`;
                    s1.join(roomId);
                    s2.join(roomId);

                    // Store game info on sockets
                    s1.gameId = gameKeypair.publicKey.toBase58();
                    s1.battleId = battleKeypair.publicKey.toBase58();
                    s1.roomId = roomId;
                    s2.gameId = gameKeypair.publicKey.toBase58();
                    s2.battleId = battleKeypair.publicKey.toBase58();
                    s2.roomId = roomId;

                    // Notify both players
                    io.to(player1Id).emit('game-start', {
                        opponentId: player2Id,
                        opponentWallet: player2Wallet.toBase58(),
                        role: 'player1',
                        roomId,
                        gameId: gameKeypair.publicKey.toBase58(),
                        battleId: battleKeypair.publicKey.toBase58(),
                    });

                    io.to(player2Id).emit('game-start', {
                        opponentId: player1Id,
                        opponentWallet: player1Wallet.toBase58(),
                        role: 'player2',
                        roomId,
                        gameId: gameKeypair.publicKey.toBase58(),
                        battleId: battleKeypair.publicKey.toBase58(),
                    });

                } catch (err) {
                    console.error('❌ Error creating game on-chain:', err);
                    s1.emit('error', { message: 'Failed to create game on blockchain' });
                    s2.emit('error', { message: 'Failed to create game on blockchain' });
                }
            }
        }
    });

    // Relay Card Placement (still useful for optimistic updates)
    socket.on('card-played', (data) => {
        console.log('🃏 Card played by', socket.id, data);

        let gameRoom = null;
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                gameRoom = room;
                break;
            }
        }

        if (gameRoom) {
            socket.to(gameRoom).emit('opponent-card-played', {
                id: socket.id,
                cardId: data.cardId,
                position: data.position
            });
        }
    });

    // Handle Game End (resolve game on-chain)
    socket.on('game-end', async (data) => {
        console.log('🏁 Game ended:', socket.id, data);

        try {
            const gameId = new PublicKey(socket.gameId);
            const battleId = new PublicKey(socket.battleId);

            // Find opponent in room
            let opponentSocket = null;
            for (const room of socket.rooms) {
                if (room !== socket.id && room === socket.roomId) {
                    const socketsInRoom = await io.in(room).fetchSockets();
                    opponentSocket = socketsInRoom.find(s => s.id !== socket.id);
                    break;
                }
            }

            if (!opponentSocket) {
                console.log('⚠️  Opponent not found for game resolution');
                return;
            }

            const player1Wallet = socket.walletPublicKey;
            const player2Wallet = opponentSocket.walletPublicKey;

            // Determine winner index (0 or 1, or null for draw)
            let winnerIdx = data.winnerIdx !== undefined ? data.winnerIdx : null;

            console.log('⏳ Resolving game on-chain...');
            const tx = await program.methods
                .resolveGame(winnerIdx)
                .accounts({
                    game: gameId,
                    battle: battleId,
                    playerOne: player1Wallet,
                    playerTwo: player2Wallet,
                    authority: serverKeypair.publicKey,
                })
                .rpc();

            console.log('✅ Game resolved on-chain. TX:', tx);

            // Notify both players
            io.to(socket.roomId).emit('game-resolved', {
                gameId: socket.gameId,
                winnerIdx,
                tx,
            });

        } catch (err) {
            console.error('❌ Error resolving game on-chain:', err);
            socket.emit('error', { message: 'Failed to resolve game on blockchain' });
        }
    });

    socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
        waitingPlayers = waitingPlayers.filter(id => id !== socket.id);
    });
});

// --- Market Logic (JSON File) ---
const fs = require('fs');
const path = require('path');
const MARKET_FILE = path.join(__dirname, 'market.json');

// Ensure market file exists
if (!fs.existsSync(MARKET_FILE)) {
    fs.writeFileSync(MARKET_FILE, JSON.stringify([], null, 2));
}

// GET /market
app.get('/market', (req, res) => {
    try {
        const data = fs.readFileSync(MARKET_FILE, 'utf8');
        const listings = JSON.parse(data);
        res.json(listings);
    } catch (err) {
        console.error('Error reading market file:', err);
        res.status(500).json({ error: 'Failed to read market listings' });
    }
});

// POST /market (Admin add/update listing)
app.post('/market', (req, res) => {
    const { cardId, price } = req.body;

    if (!cardId || price === undefined) {
        return res.status(400).json({ error: 'Missing cardId or price' });
    }

    try {
        const data = fs.readFileSync(MARKET_FILE, 'utf8');
        let listings = JSON.parse(data);

        // Check if listing exists, update or add
        const existingIndex = listings.findIndex(item => item.cardId === cardId);
        if (existingIndex !== -1) {
            listings[existingIndex].price = price;
        } else {
            listings.push({ cardId, price });
        }

        fs.writeFileSync(MARKET_FILE, JSON.stringify(listings, null, 2));
        console.log(`✅ Market listing updated: Card ${cardId} -> ${price}`);
        res.json({ success: true, listings });
    } catch (err) {
        console.error('Error updating market file:', err);
        res.status(500).json({ error: 'Failed to update market listing' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
