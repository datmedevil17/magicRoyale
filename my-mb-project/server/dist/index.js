"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const matchmaking_1 = require("./matchmaking");
const web3_js_1 = require("@solana/web3.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});
const matchmaking = new matchmaking_1.MatchmakingService();
// Solana Connection (adjust cluster as needed)
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
// Store partial transactions for multi-sig
// key: gameId, value: { player1Signature?: string, player2Signature?: string, ... }
const pendingTransactions = new Map();
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-queue', (data) => {
        if (!data.publicKey)
            return;
        matchmaking.addToQueue(socket, data.publicKey);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        matchmaking.removeFromQueue(socket.id);
    });
    // Multi-sig flow handlers
    // Step 2-3: Player 1 sends signed transaction/signature
    socket.on('submit-signature', (data) => {
        const { gameId, signature, publicKey } = data;
        console.log(`Received signature from ${publicKey} for game ${gameId}`);
        // Find the match/opponent to forward to
        // For simplicity, we broadcast to the room (gameId) or find the other player
        // In a real app, MatchmakingService should expose a way to get match by ID
        // Let's assume clients join a room with gameId upon match-found
        socket.to(gameId).emit('signature-received', {
            signature,
            publicKey
        });
        // Store if needed
        let pending = pendingTransactions.get(gameId) || {};
        pending[publicKey] = signature;
        pendingTransactions.set(gameId, pending);
        // If we have both (or sufficient) signatures, server could submit
        // But the prompt says "prompt both users to sign". 
        // Usually:
        // 1. P1 signs -> sends to Server
        // 2. Server sends to P2
        // 3. P2 signs -> sends to Server
        // 4. Server submits
    });
    socket.on('join-game-room', (gameId) => {
        socket.join(gameId);
        console.log(`Socket ${socket.id} joined room ${gameId}`);
    });
    // Relay raw transaction buffer if needed
    socket.on('relay-transaction', (data) => {
        socket.to(data.gameId).emit('transaction-update', data.transaction);
    });
    // Final Submission Request
    socket.on('submit-transaction', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const tx = web3_js_1.Transaction.from(Uint8Array.from(data.serializedTx));
            const signature = yield connection.sendRawTransaction(tx.serialize());
            console.log(`Transaction submitted: ${signature}`);
            io.to(data.gameId).emit('game-started', { signature });
        }
        catch (error) {
            console.error("Submission failed", error);
            io.to(data.gameId).emit('error', { message: "Transaction submission failed: " + error.message });
        }
    }));
    socket.on('resolve-game', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // In a real scenario, the server would have authoritative state of the game result
            // Here we trust the client for the demo, or verify sigs.
            // But we will use the backend authority to resolve it on-chain.
            yield matchmaking.resolveGameOnChain(data.gameId, data.winnerPublicKey);
            console.log(`Resolving game ${data.gameId} for winner ${data.winnerPublicKey}`);
        }
        catch (e) {
            console.error("Resolve failed", e);
        }
    }));
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server running on port ${PORT}`);
    // Initialize backend wallet
    yield matchmaking.init();
}));
