
import { Socket } from 'socket.io';

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
}

export class MatchmakingService {
    private queue: Player[] = [];
    private activeMatches: Map<string, Match> = new Map();

    constructor() { }

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

    private tryMatch(): void {
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
}
