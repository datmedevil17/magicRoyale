import React, { useState, useEffect } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { CardModal } from '../ui/CardModal';
import { useGameProgram } from '../hooks/use-game-program';
import { TROOP_NAME_TO_MINT } from '../game/config/MintConfig';

// Mock Data
const BATTLE_DECK_INITIAL = [
    'ArchersCard', 'ArrowsCard', 'FireballCard', 'GiantCard',
    'MiniPEKKACard', 'BabyDragonCard', 'InfernoTowerCard', 'ValkyrieCard',
    'BarbariansCard'
];

const COLLECTION = [
    'BarbariansCard', 'CannonCard', 'WizardCard', 'RageCard',
    'ArchersCard', 'ArrowsCard', 'FireballCard', 'GiantCard',
    'MiniPEKKACard', 'BabyDragonCard', 'InfernoTowerCard', 'ValkyrieCard',
    'BarbariansCard', 'CannonCard', 'WizardCard', 'RageCard'
    // Added more for scrolling demo
];

export const BattleDeckPage: React.FC = () => {
    const { upgradeCard, isLoading, error } = useGameProgram();
    // State for deck & collection
    const [battleDeck, setBattleDeck] = useState<string[]>(() => {
        const saved = localStorage.getItem('battleDeck');
        return saved ? JSON.parse(saved) : BATTLE_DECK_INITIAL;
    });

    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [inspectCard, setInspectCard] = useState<any | null>(null);

    // Persist deck on change
    useEffect(() => {
        localStorage.setItem('battleDeck', JSON.stringify(battleDeck));
    }, [battleDeck]);

    const handleCollectionClick = (cardName: string) => {
        setSelectedCard(cardName);
    };

    const handleDeckSlotClick = (index: number) => {
        if (selectedCard) {
            // Swap logic: if selected card is in deck, swap positions. If not, replace.
            const newDeck = [...battleDeck];

            // Check if card already in deck
            const existingIndex = newDeck.indexOf(selectedCard);
            if (existingIndex >= 0) {
                // Swap
                newDeck[existingIndex] = newDeck[index];
                newDeck[index] = selectedCard;
            } else {
                // Replace
                newDeck[index] = selectedCard;
            }
            setBattleDeck(newDeck);
            setSelectedCard(null);
        } else {
            // Inspect card if clicking deck slot without selection
            setInspectCard({
                name: battleDeck[index],
                image: battleDeck[index],
                description: 'A powerful unit for your army.',
                stats: [{ label: 'Level', value: 1 }]
            });
        }
    };

    const handleUpgrade = async (e: React.MouseEvent, cardName: string) => {
        e.stopPropagation();

        // Map card name (e.g., 'GiantCard') to canonical name (e.g., 'Giant')
        const canonicalName = cardName.replace('Card', '');
        const mint = TROOP_NAME_TO_MINT[canonicalName];

        if (!mint) {
            alert(`Mint not found for ${canonicalName}`);
            return;
        }

        try {
            // Card IDs: Archers: 1, Giant: 2, MiniPEKKA: 3, Arrows: 4, Valkyrie: 5, Wizard: 6, BabyDragon: 7
            const nameToId: Record<string, number> = {
                'Archers': 1, 'Giant': 2, 'MiniPEKKA': 3, 'Arrows': 4, 'Valkyrie': 5, 'Wizard': 6, 'BabyDragon': 7
            };
            const cardId = nameToId[canonicalName];

            if (!cardId) {
                alert(`Card ID not found for ${canonicalName}`);
                return;
            }

            console.log(`Upgrading ${canonicalName} (ID: ${cardId}) with mint ${mint.toBase58()}`);
            await upgradeCard(cardId, mint);
            alert(`Successfully upgraded ${canonicalName}!`);
        } catch (err: any) {
            console.error('Upgrade failed:', err);
            alert(`Upgrade failed: ${err.message}`);
        }
    };

    return (
        <MobileLayout bgClass="bg-[#222]" className=" text-white">
            <div className="relative h-full w-full bg-[#333] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x-4 border-black">

                {/* Header / Battle Deck Area */}
                <div className="flex-none p-4 bg-[#4a6cd6] border-b-4 border-black/50 shadow-lg z-10 transition-colors duration-300">
                    <h2 className="text-center text-xl mb-2 text-shadow-md">
                        {selectedCard ? 'Tap Slot to Swap' : 'Battle Deck'}
                    </h2>
                    <div className="grid grid-cols-4 gap-2 bg-[#2a3c7a] p-2 rounded-xl border-2 border-[#1a254a]">
                        {battleDeck.map((card, index) => (
                            <div
                                key={index}
                                onClick={() => handleDeckSlotClick(index)}
                                className={`relative aspect-[3/4] bg-[#1c2954] rounded-lg border flex justify-center items-center cursor-pointer active:scale-95 transition-transform hover:brightness-110 ${selectedCard ? 'animate-pulse border-yellow-400' : 'border-[#4a6cd6]/30'}`}
                            >
                                <img src={`/assets/${card}.png`} alt={card} className="w-[90%] h-[90%] object-contain drop-shadow-md" />
                                <div className="absolute top-0 left-0 bg-purple-600 rounded-br-lg px-1.5 text-[0.7rem] border-b border-r border-black/30">3</div>
                                <div className="absolute bottom-0 w-full text-center text-[0.6rem] bg-black/40 py-0.5 rounded-b-lg text-blue-200">Lvl 1</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-2 mb-3 text-sm text-blue-200">
                        Avg Elixir: <span className="text-purple-300">3.8</span>
                    </div>
                </div>

                {/* Scrollable Collection Area */}
                <div className="flex-1 overflow-y-auto bg-[#1a1a1a] pb-[80px]">
                    <h2 className="text-center text-lg mb-4 text-[#fbce47] text-shadow-sm sticky top-0 bg-[#1a1a1a] pt-4 pb-3 px-4 z-20 border-b border-white/10">Card Collection</h2>
                    <div className="grid grid-cols-4 gap-3 px-4">
                        {COLLECTION.map((card, index) => {
                            const isSelected = selectedCard === card;
                            const isInDeck = battleDeck.includes(card);

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleCollectionClick(card)}
                                    className={`relative aspect-[3/4] bg-[#2a2a2a] rounded-lg border-2 flex justify-center items-center cursor-pointer active:scale-95 transition-transform ${isSelected ? 'border-[#fbce47] bg-[#333] scale-105' : 'border-white/10 hover:bg-[#333]'}`}
                                >
                                    <img src={`/assets/${card}.png`} alt={card} className={`w-[90%] h-[90%] object-contain transition-all ${isInDeck ? 'grayscale brightness-50' : ''}`} />

                                    {/* Level Badge */}
                                    <div className="absolute top-0 left-0 bg-gray-700/80 rounded-br-lg px-1.5 text-[0.7rem] z-10">4</div>

                                    {/* Selection Overlay */}
                                    {isSelected && (
                                        <div className="absolute inset-0 border-4 border-[#fbce47] rounded-lg pointer-events-none z-20 shadow-[0_0_15px_rgba(251,206,71,0.5)]"></div>
                                    )}

                                    {/* Upgrade Bar */}
                                    <div className="absolute bottom-1 w-full flex flex-col items-center gap-1 z-10" onClick={(e) => handleUpgrade(e, card)}>
                                        <div className="h-1.5 w-[80%] bg-gray-700 rounded-full overflow-hidden border border-black/50">
                                            <div className="h-full w-[80%] bg-[#59ffac]"></div>
                                        </div>
                                        <span className="text-[0.5rem] text-[#59ffac] bg-black/60 px-1 rounded">Upgrade</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Inspect Modal */}
                {inspectCard && (
                    <CardModal
                        card={inspectCard}
                        onClose={() => setInspectCard(null)}
                    />
                )}

                {/* Bottom Nav */}
                <BottomNav />
            </div>

            {/* Loading & Error Overlays */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] backdrop-blur-sm">
                    <div className="bg-[#1a254a] p-6 rounded-xl border-4 border-[#4a6cd6] text-white flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-t-yellow-400 border-white/20 rounded-full animate-spin mb-4" />
                        <p className="LuckiestGuy">Processing Transaction...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed bottom-20 left-4 right-4 bg-red-600 text-white p-4 rounded-xl z-50 border-2 border-white/20 shadow-2xl animate-bounce">
                    <p className="text-center font-bold">{error}</p>
                </div>
            )}
        </MobileLayout>
    );
};
