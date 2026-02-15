import { Events } from 'phaser';

export const EventBus = new Events.EventEmitter();

export const EVENTS = {
    ELIXIR_UPDATE: 'elixir-update',
    CARD_PLAYED: 'card-played',
    CARD_SELECTED: 'card-selected',
    NETWORK_OPPONENT_DEPLOY: 'network-opponent-deploy'
};
