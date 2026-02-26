import { Events } from 'phaser';

export const EventBus = new Events.EventEmitter();

export const EVENTS = {
    ELIXIR_UPDATE: 'elixir-update',
    CARD_PLAYED: 'card-played',
    CARD_SELECTED: 'card-selected',
    NETWORK_OPPONENT_DEPLOY: 'network-opponent-deploy',
    CROWN_UPDATE: 'crown-update',
    GAME_END: 'game-end',
    TOWER_DESTROYED: 'tower-destroyed',
    GAME_START: 'game-start',
    DEPLOY_TROOP_BLOCKCHAIN: 'deploy-troop-blockchain',
    BATTLE_STARTED: 'battle-started',
    PLAYER_DELEGATED: 'player-delegated',
    CLIENT_UNDELEGATED: 'client-undelegated',
    TEST_DEPLOY: 'test-deploy'
};
