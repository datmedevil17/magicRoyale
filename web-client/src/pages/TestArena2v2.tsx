import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { MainScene2v2 } from '../game/scenes/MainScene2v2';
import { ElixirBar } from '../ui/ElixirBar';
import { GameHUD } from '../ui/GameHUD';
import { EventBus, EVENTS } from '../game/EventBus';
import { CARD_DATA } from '../game/config/CardConfig';

export const TestArena2v2: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [spawnOwner, setSpawnOwner] = useState<string>('player1');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isBattleActive, setIsBattleActive] = useState(false);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 480,
            height: 800,
            parent: 'game-container',
            backgroundColor: '#000000',
            scene: [BootScene, MainScene2v2], // Explicitly use our new 2v2 scene
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);
        game.registry.set('data', { isTestMode: true, nextScene: 'MainScene2v2' });
        gameRef.current = game;

        EventBus.once('scene-ready', () => {
            EventBus.emit(EVENTS.BATTLE_STARTED, {
                gameId: "test-game-2v2",
                layout: { mapStartX: 0, mapStartY: 0, tileSize: 22 }
            });
            setIsBattleActive(true);
        });

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const onMapPointerDown = (pointer: { worldX: number, worldY: number }) => {
            if (!selectedCardId) return;

            EventBus.emit(EVENTS.TEST_DEPLOY, {
                cardId: selectedCardId,
                x: pointer.worldX,
                y: pointer.worldY,
                ownerId: spawnOwner
            });

            toast.success(`Deployed ${selectedCardId} for ${spawnOwner.toUpperCase()}`);
        };

        EventBus.on('map-pointer-down', onMapPointerDown);
        return () => {
            EventBus.off('map-pointer-down', onMapPointerDown);
        };
    }, [selectedCardId, spawnOwner]);

    const testCards = Object.values(CARD_DATA).slice(0, 12);

    return (
        <div className="w-screen h-screen bg-[#111] flex overflow-hidden font-sans">
            <Toaster position="top-right" />

            {/* Left Panel: Game Container */}
            <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center">
                <div id="game-container" className="shadow-2xl border border-white/5" />

                {isBattleActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col p-6">
                        <GameHUD
                            playerName="Blue Team"
                            opponentName="Red Team"
                            playerLevel={1}
                            opponentLevel={1}
                            playerCrowns={0}
                            opponentCrowns={0}
                            timeLeft="2v2 Test"
                        />

                        <div className="mt-auto pointer-events-auto flex flex-col gap-4 items-center">
                            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm shadow-xl flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs uppercase">Spawner Control:</span>
                                    <span className={`font-black tracking-wider ${spawnOwner.includes('player') ? 'text-blue-400' : 'text-red-400'}`}>
                                        {spawnOwner.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <ElixirBar />
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Developer Tools */}
            <div className="w-96 bg-[#1a1a1a] border-l border-white/10 p-8 flex flex-col gap-8 shadow-2xl z-10 overflow-y-auto">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase">2v2 Simulation</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Chaos Testing Tool</p>
                </div>

                <section>
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Active Spawner</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {['player1', 'player2', 'opponent1', 'opponent2'].map(owner => (
                            <button
                                key={owner}
                                onClick={() => setSpawnOwner(owner)}
                                className={`py-3 rounded-xl font-black text-[10px] transition-all ${spawnOwner === owner
                                    ? (owner.includes('player') ? 'bg-blue-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg')
                                    : 'bg-[#252525] text-gray-500 hover:bg-[#2a2a2a]'}`}
                            >
                                {owner.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="flex-1">
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Deployment Deck</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {testCards.map(card => (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`group relative p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedCardId === card.id ? 'border-amber-500 bg-amber-500/10' : 'border-transparent bg-[#252525] hover:border-white/10'}`}
                            >
                                <img src={`/assets/${card.id}Card.png`} alt={card.name} className="w-10 h-12 object-contain" />
                                <span className={`text-[8px] font-bold truncate w-full text-center ${selectedCardId === card.id ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {card.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="pt-6 border-t border-white/5 mt-auto">
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        <p className="text-[9px] text-blue-300 font-medium leading-relaxed uppercase tracking-widest text-center">
                            Select a teammate or opponent slot and click the arena to simulate 4-way deployment logic.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};
