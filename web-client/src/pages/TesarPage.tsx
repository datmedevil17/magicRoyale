import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import StartTesarGame from '../game/TesarGame';
import { ElixirBar } from '../ui/ElixirBar';
import { GameHUD } from '../ui/GameHUD';
import { EventBus, EVENTS } from '../game/EventBus';
import { CARD_DATA } from '../game/config/CardConfig';

export const TesarPage: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [spawnOwner, setSpawnOwner] = useState<'player' | 'opponent'>('player');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isBattleActive, setIsBattleActive] = useState(false);
    const [currentMap, setCurrentMap] = useState<string>('classic');

    useEffect(() => {
        setIsBattleActive(false);
        // Initialize Phaser Game with local tesar scene
        gameRef.current = StartTesarGame("game-container", { mapType: currentMap });

        // Set layout once scene is ready
        const onSceneReady = () => {
            EventBus.emit(EVENTS.BATTLE_STARTED, {
                gameId: "test-game",
                layout: { mapStartX: 0, mapStartY: 0, tileSize: 22 }
            });
            setIsBattleActive(true);
        };

        EventBus.on('tesar-scene-ready', onSceneReady);

        return () => {
            EventBus.off('tesar-scene-ready', onSceneReady);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [currentMap]);

    const handleMapChange = (map: string) => {
        if (map === currentMap) return;
        setCurrentMap(map);
    };

    // Handle map pointer events from Phaser
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

        EventBus.on('tesar-map-pointer-down', onMapPointerDown);
        return () => {
            EventBus.off('tesar-map-pointer-down', onMapPointerDown);
        };
    }, [selectedCardId, spawnOwner]);

    // Drag and Drop Handlers
    const onDragStart = (e: React.DragEvent, cardId: string) => {
        e.dataTransfer.setData("cardId", cardId);
        setSelectedCardId(cardId);
    };

    const testCards = Object.values(CARD_DATA).filter(card =>
        ['Giant', 'Valkyrie', 'MiniPEKKA', 'BabyDragon', 'Archers', 'Arrows'].includes(card.id)
    );

    return (
        <div className="w-screen h-screen bg-[#111] flex overflow-hidden font-sans">
            <Toaster position="top-right" />

            {/* Left Panel: Game Container */}
            <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center">
                <div id="game-container" className="shadow-2xl border border-black/50 overflow-hidden w-full h-full" />

                {isBattleActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col p-6">
                        <GameHUD
                            playerName="Local Test"
                            opponentName="Opponent Test"
                            playerLevel={1}
                            opponentLevel={1}
                            playerCrowns={0}
                            opponentCrowns={0}
                            timeLeft="3:00"
                        />

                        <div className="mt-auto pointer-events-auto flex flex-col gap-4 items-center">
                            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm shadow-xl flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">Team:</span>
                                    <span className={spawnOwner === 'player' ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
                                        {spawnOwner.toUpperCase()}
                                    </span>
                                </div>
                                <div className="w-px h-4 bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">Selected:</span>
                                    <span className="text-amber-400 font-bold">
                                        {selectedCardId || 'None'}
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
                    <h2 className="text-3xl font-black text-amber-500 italic tracking-tighter mb-1">TESAR</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Unified Map & Unit Dev Console</p>
                </div>

                <section>
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Arena Map
                    </h3>
                    <div className="flex flex-col gap-2">
                        {[
                            { id: 'classic', name: 'Classic Arena', color: 'bg-green-600' },
                            { id: 'solana', name: 'Solana Arena', color: 'bg-blue-600' },
                            { id: 'magicblock', name: 'Magicblock Arena', color: 'bg-purple-600' }
                        ].map(map => (
                            <button
                                key={map.id}
                                onClick={() => handleMapChange(map.id)}
                                className={`py-2 px-4 rounded-lg font-bold text-xs transition-all duration-300 ${currentMap === map.id ? `${map.color} text-white shadow-lg scale-[1.02]` : 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a]'}`}
                            >
                                {map.name.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Active Spawner
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSpawnOwner('player')}
                            className={`group relative py-3 rounded-xl font-black text-sm transition-all duration-300 overflow-hidden ${spawnOwner === 'player' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.02]' : 'bg-[#252525] text-gray-500 hover:bg-[#2a2a2a]'}`}
                        >
                            <span className="relative">BLUE TEAM</span>
                        </button>
                        <button
                            onClick={() => setSpawnOwner('opponent')}
                            className={`group relative py-3 rounded-xl font-black text-sm transition-all duration-300 overflow-hidden ${spawnOwner === 'opponent' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.02]' : 'bg-[#252525] text-gray-500 hover:bg-[#2a2a2a]'}`}
                        >
                            <span className="relative">RED TEAM</span>
                        </button>
                    </div>
                </section>

                <section className="flex-1">
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Select Card
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {testCards.map(card => (
                            <button
                                key={card.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, card.id)}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`group relative p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden ${selectedCardId === card.id ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-transparent bg-[#252525] hover:bg-[#2a2a2a] hover:border-white/10'}`}
                            >
                                <img
                                    src={card.icon}
                                    alt={card.name}
                                    className={`w-14 h-16 object-contain transition-transform duration-500 ${selectedCardId === card.id ? 'scale-110 rotate-2' : 'group-hover:scale-105'}`}
                                />
                                <span className={`text-[10px] font-black italic uppercase tracking-tighter ${selectedCardId === card.id ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {card.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
