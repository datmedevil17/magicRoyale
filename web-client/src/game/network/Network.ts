import { io, Socket } from 'socket.io-client';
import { EventBus, EVENTS } from '../EventBus';
import { PublicKey } from '@solana/web3.js';

export class Network {
    private socket: Socket;
    public gameId: string | null = null;
    public battleId: string | null = null;

    constructor(walletPublicKey: PublicKey | null) {
        // Connect to local Node server with wallet authentication
        this.socket = io('http://localhost:3000', {
            query: {
                walletPublicKey: walletPublicKey?.toBase58() || ''
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to Game Server:', this.socket.id);
            // Request matchmaking immediately upon connection
            this.socket.emit('find-match');
        });

        this.socket.on('connect_ack', (data) => {
            console.log('Server acknowledged connection, ID:', data.id, 'Wallet:', data.wallet);
        });

        // Listen for game start with blockchain IDs
        this.socket.on('game-start', (data) => {
            console.log('Network: Game Started', data);
            this.gameId = data.gameId;
            this.battleId = data.battleId;
            EventBus.emit(EVENTS.GAME_START, data);
        });

        this.socket.on('opponent-card-played', (data: { cardId: string, position: { x: number, y: number } }) => {
            console.log('Opponent played card:', data);
            EventBus.emit('network-opponent-deploy', data);
        });

        this.socket.on('game-resolved', (data) => {
            console.log('Game resolved on-chain:', data);
            EventBus.emit('game-resolved', data);
        });

        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        this.socket.on('battle-started', () => {
            console.log('⚔️ Battle Started!');
            EventBus.emit(EVENTS.BATTLE_STARTED);
        });

        // Listen for local delegation event to notify server
        EventBus.on(EVENTS.PLAYER_DELEGATED, () => {
            console.log('Sending delegated signal to server...');
            this.socket.emit('delegated');
        });

        // Listen for client undelegation to notify server
        EventBus.on(EVENTS.CLIENT_UNDELEGATED, (data) => {
            console.log('Network: Clients undelegated, notifying server...', data);
            this.socket.emit('client-undelegated', data);
        });
    }

    public sendDeploy(cardId: string, position: { x: number, y: number }) {
        // Still used for optimistic UI updates
        this.socket.emit('card-played', { cardId, position });
    }

    public sendGameEnd(winnerIdx: number | null) {
        this.socket.emit('game-end', { winnerIdx });
    }
}
