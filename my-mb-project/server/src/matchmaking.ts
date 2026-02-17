
import { Socket } from 'socket.io';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const IDL = require('../../target/idl/game_core.json');

interface Player {
    id: string; // Socket ID
    publicKey: string;
    socket: Socket;
}

interface Match {
    id: string;
    player1: Player;
    player2: Player;
    startTime: number;
    gameAccount?: PublicKey;
    battleAccount?: PublicKey;
}

export class MatchmakingService {
    private queue: Player[] = [];
    private activeMatches: Map<string, Match> = new Map();
    private program?: anchor.Program;
    private provider?: anchor.AnchorProvider;
    private backendKeypair?: Keypair;

    constructor() { }

    public async init() {
        try {
            const keypairPath = path.resolve(__dirname, '../backend-keypair.json');
            const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
            this.backendKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

            const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
            const wallet = new anchor.Wallet(this.backendKeypair);
            this.provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });

            this.program = new anchor.Program(IDL, this.provider);

            console.log("MatchmakingService initialized with backend authority:", this.backendKeypair.publicKey.toBase58());
        } catch (error) {
            console.error("Failed to initialize MatchmakingService:", error);
        }
    }

    public addToQueue(socket: Socket, publicKey: string): void {
        const player: Player = {
            id: socket.id,
            publicKey,
            socket
        };

        // Check if player is already in queue
        if (this.queue.some(p => p.publicKey === publicKey)) {
            console.log(`Player ${publicKey} already in queue. Updating socket.`);
            this.queue = this.queue.map(p => p.publicKey === publicKey ? player : p);
            return;
        }

        this.queue.push(player);
        console.log(`Player ${publicKey} added to queue. Queue size: ${this.queue.length}`);

        this.tryMatch();
    }

    public removeFromQueue(socketId: string): void {
        this.queue = this.queue.filter(p => p.id !== socketId);
        console.log(`Player ${socketId} removed from queue. Queue size: ${this.queue.length}`);
    }

    private async tryMatch() {
        if (this.queue.length >= 2) {
            const player1 = this.queue.shift()!;
            const player2 = this.queue.shift()!;

            // Use a numeric ID compatible with BN (u64)
            const matchId = Date.now().toString();

            const match: Match = {
                id: matchId,
                player1,
                player2,
                startTime: Date.now()
            };

            this.activeMatches.set(matchId, match);

            console.log(`Match found! ${player1.publicKey} vs ${player2.publicKey}`);

            // Start game on-chain
            try {
                if (this.program && this.backendKeypair) {
                    await this.startGameOnChain(match);
                } else {
                    console.error("Program not initialized, skipping on-chain start (DEV MODE)");
                }
            } catch (e) {
                console.error("Error starting game on-chain:", e);
                // Return players to queue?
            }

            // Notify players
            player1.socket.emit('match-found', {
                gameId: matchId,
                opponent: player2.publicKey,
                isPlayerOne: true
            });
            player2.socket.emit('match-found', {
                gameId: matchId,
                opponent: player1.publicKey,
                isPlayerOne: false
            });
        }
    }

    private async startGameOnChain(match: Match) {
        if (!this.program || !this.backendKeypair) return;

        const game = anchor.web3.Keypair.generate();
        const battle = anchor.web3.Keypair.generate();

        console.log(`Initializing game ${match.id} on-chain...`);
        console.log(`Game Account: ${game.publicKey.toBase58()}`);
        console.log(`Battle Account: ${battle.publicKey.toBase58()}`);

        try {
            await this.program.methods
                .startGame()
                .accounts({
                    game: game.publicKey,
                    battle: battle.publicKey,
                    playerOne: new PublicKey(match.player1.publicKey),
                    playerTwo: new PublicKey(match.player2.publicKey),
                    authority: this.backendKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([this.backendKeypair, game, battle])
                .rpc();

            console.log(`Game initialized on-chain! Tx sent.`);
            match.gameAccount = game.publicKey;
            match.battleAccount = battle.publicKey;
        } catch (e) {
            console.error("On-chain initialization failed:", e);
            throw e;
        }
    }

    public async resolveGameOnChain(gameId: string, winnerPublicKey: string) {
        if (!this.program || !this.backendKeypair) return;

        const match = this.activeMatches.get(gameId);
        if (!match || !match.gameAccount || !match.battleAccount) {
            console.error("Match not found or not initialized on-chain");
            return;
        }

        console.log(`Resolving game ${gameId} on-chain. Winner: ${winnerPublicKey}`);

        try {
            await this.program.methods
                .resolveGame()
                .accounts({
                    game: match.gameAccount,
                    battle: match.battleAccount,
                    playerOne: new PublicKey(match.player1.publicKey),
                    playerTwo: new PublicKey(match.player2.publicKey),
                    authority: this.backendKeypair.publicKey,
                })
                .signers([this.backendKeypair])
                .rpc();

            console.log(`Game resolved on-chain!`);
            this.activeMatches.delete(gameId);
        } catch (e) {
            console.error("On-chain resolution failed:", e);
            throw e;
        }
    }
}
