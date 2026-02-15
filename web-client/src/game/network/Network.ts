import { io, Socket } from 'socket.io-client';
import { EventBus } from '../EventBus';

export class Network {
    private socket: Socket;

    constructor() {
        // Connect to local Node server
        this.socket = io('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log('Connected to Game Server:', this.socket.id);
        });

        this.socket.on('connect_ack', (data) => {
            console.log('Server acknowledged connection, ID:', data.id);
        });

        // Listen for game start (if connected late or reconnecting)
        this.socket.on('game-start', (data) => {
            console.log('Network: Game Started', data);
            // We might want to emit an event to MainScene to set player role etc.
            // But MainScene is created AFTER game start usually.
            // If MainScene is active, we can notify it.
        });

        this.socket.on('opponent-card-played', (data: { cardId: string, position: { x: number, y: number } }) => {
            console.log('Opponent played card:', data);
            EventBus.emit('network-opponent-deploy', data);
        });

        // Listen to local events to send to server - simplified, moving send logic to MainScene
        // EventBus.on(EVENTS.CARD_PLAYED, (cardId: string) => { });
    }

    public sendDeploy(cardId: string, position: { x: number, y: number }) {
        this.socket.emit('card-played', { cardId, position });
    }
}
