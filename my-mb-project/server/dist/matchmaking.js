"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.MatchmakingService = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const IDL = require('../../target/idl/game_core.json');
class MatchmakingService {
    constructor() {
        this.queue = [];
        this.activeMatches = new Map();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keypairPath = path_1.default.resolve(__dirname, '../backend-keypair.json');
                const keypairData = JSON.parse(fs_1.default.readFileSync(keypairPath, 'utf-8'));
                this.backendKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(keypairData));
                const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
                const wallet = new anchor.Wallet(this.backendKeypair);
                this.provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
                this.program = new anchor.Program(IDL, this.provider);
                console.log("MatchmakingService initialized with backend authority:", this.backendKeypair.publicKey.toBase58());
            }
            catch (error) {
                console.error("Failed to initialize MatchmakingService:", error);
            }
        });
    }
    addToQueue(socket, publicKey) {
        const player = {
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
    removeFromQueue(socketId) {
        this.queue = this.queue.filter(p => p.id !== socketId);
        console.log(`Player ${socketId} removed from queue. Queue size: ${this.queue.length}`);
    }
    tryMatch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queue.length >= 2) {
                const player1 = this.queue.shift();
                const player2 = this.queue.shift();
                // Use a numeric ID compatible with BN (u64)
                const matchId = Date.now().toString();
                const match = {
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
                        yield this.startGameOnChain(match);
                    }
                    else {
                        console.error("Program not initialized, skipping on-chain start (DEV MODE)");
                    }
                }
                catch (e) {
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
        });
    }
    startGameOnChain(match) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.program || !this.backendKeypair)
                return;
            const game = anchor.web3.Keypair.generate();
            const battle = anchor.web3.Keypair.generate();
            console.log(`Initializing game ${match.id} on-chain...`);
            console.log(`Game Account: ${game.publicKey.toBase58()}`);
            console.log(`Battle Account: ${battle.publicKey.toBase58()}`);
            try {
                yield this.program.methods
                    .startGame()
                    .accounts({
                    game: game.publicKey,
                    battle: battle.publicKey,
                    playerOne: new web3_js_1.PublicKey(match.player1.publicKey),
                    playerTwo: new web3_js_1.PublicKey(match.player2.publicKey),
                    authority: this.backendKeypair.publicKey,
                    systemProgram: web3_js_1.SystemProgram.programId,
                })
                    .signers([this.backendKeypair, game, battle])
                    .rpc();
                console.log(`Game initialized on-chain! Tx sent.`);
                match.gameAccount = game.publicKey;
                match.battleAccount = battle.publicKey;
            }
            catch (e) {
                console.error("On-chain initialization failed:", e);
                throw e;
            }
        });
    }
    resolveGameOnChain(gameId, winnerPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.program || !this.backendKeypair)
                return;
            const match = this.activeMatches.get(gameId);
            if (!match || !match.gameAccount || !match.battleAccount) {
                console.error("Match not found or not initialized on-chain");
                return;
            }
            console.log(`Resolving game ${gameId} on-chain. Winner: ${winnerPublicKey}`);
            try {
                yield this.program.methods
                    .resolveGame()
                    .accounts({
                    game: match.gameAccount,
                    battle: match.battleAccount,
                    playerOne: new web3_js_1.PublicKey(match.player1.publicKey),
                    playerTwo: new web3_js_1.PublicKey(match.player2.publicKey),
                    authority: this.backendKeypair.publicKey,
                })
                    .signers([this.backendKeypair])
                    .rpc();
                console.log(`Game resolved on-chain!`);
                this.activeMatches.delete(gameId);
            }
            catch (e) {
                console.error("On-chain resolution failed:", e);
                throw e;
            }
        });
    }
}
exports.MatchmakingService = MatchmakingService;
