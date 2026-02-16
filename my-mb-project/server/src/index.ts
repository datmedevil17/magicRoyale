
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MatchmakingService } from './matchmaking';
import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});

const matchmaking = new MatchmakingService();

// Solana Connection (adjust cluster as needed)
const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");

// Store partial transactions for multi-sig
// key: gameId, value: { player1Signature?: string, player2Signature?: string, ... }
const pendingTransactions = new Map<string, any>();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-queue', (data: { publicKey: string }) => {
        if (!data.publicKey) return;
        matchmaking.addToQueue(socket, data.publicKey);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        matchmaking.removeFromQueue(socket.id);
    });

    // Multi-sig flow handlers

    // Step 2-3: Player 1 sends signed transaction/signature
    socket.on('submit-signature', (data: { gameId: string, signature: string, publicKey: string }) => {
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

    socket.on('join-game-room', (gameId: string) => {
        socket.join(gameId);
        console.log(`Socket ${socket.id} joined room ${gameId}`);
    });

    // Relay raw transaction buffer if needed
    socket.on('relay-transaction', (data: { gameId: string, transaction: any }) => {
        socket.to(data.gameId).emit('transaction-update', data.transaction);
    });

    // Final Submission Request
    socket.on('submit-transaction', async (data: { gameId: string, serializedTx: number[] }) => {
        try {
            const tx = Transaction.from(Uint8Array.from(data.serializedTx));
            const signature = await connection.sendRawTransaction(tx.serialize());
            console.log(`Transaction submitted: ${signature}`);
            io.to(data.gameId).emit('game-started', { signature });
        } catch (error: any) {
            console.error("Submission failed", error);
            io.to(data.gameId).emit('error', { message: "Transaction submission failed: " + error.message });
        }
    });

});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
