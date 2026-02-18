import React, { useState, useEffect } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { CardModal } from '../ui/CardModal';
import { useGameProgram, type PlayerProfile } from '../hooks/use-game-program';
import { TROOP_NAME_TO_MINT } from '../game/config/MintConfig';
import { getCardName, CARD_NAME_TO_ID, CARD_ID_TO_NAME } from '../game/config/CardConfig';
import { MINT_CONFIG } from '../game/config/MintConfig';

export const BattleDeckPage: React.FC = () => {
    const { upgradeCard, setDeck, unlockCard, isLoading, error, fetchPlayerProfile, playerProfilePda } = useGameProgram();
    
    // ...

    const handleBuy = async (e: React.MouseEvent, cardName: string) => {
        e.stopPropagation();
        
        // Map card name to ID
        const canonicalName = cardName.replace('Card', '');
        const cardId = CARD_NAME_TO_ID[canonicalName];
        
        if (!cardId) {
             alert("Invalid card ID");
             return;
        }

        try {
            await unlockCard(cardId, MINT_CONFIG.PLATFORM);
            alert(`Successfully unlocked ${canonicalName}!`);
             // Refresh profile
            if (playerProfilePda) {
                const data = await fetchPlayerProfile(playerProfilePda);
                if(data) setProfile(data as unknown as PlayerProfile);
            }
        } catch (err: any) {
            console.error("Unlock failed", err);
            alert("Unlock failed: " + err.message);
        }
    };
    
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [battleDeck, setBattleDeck] = useState<string[]>(Array(8).fill(null)); // Initialize with 8 nulls or empty strings
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [inspectCard, setInspectCard] = useState<any | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    // Fetch Profile
    useEffect(() => {
        const loadProfile = async () => {
            if (playerProfilePda) {
                try {
                    const data = await fetchPlayerProfile(playerProfilePda);
                    if (data) {
                        const profileData = data as unknown as PlayerProfile;
                        setProfile(profileData);
                        
                        // Map deck IDs to Names
                        // Filter out 0s (empty slots) and map to names
                        // But we want to maintain 8 slots
                        const deckNames = profileData.deck.map(id => id > 0 ? getCardName(id) + 'Card' : null).filter(Boolean) as string[];
                         // Ensure 8 slots for UI if needed, but the current UI maps the array. 
                         // The screenshot showed 8 slots. 
                         // If I have 4 cards, I should pad with null/empty?
                         // The current UI uses `battleDeck.map`. If I want 8 slots, I need array of 8.
                         const fullDeck = Array(8).fill(null);
                         deckNames.forEach((name, i) => fullDeck[i] = name);
                         // Actually, keeping the strings is easier.
                         // Let's just use the logic: "battle deck would have 4 cards".
                         // I will set battleDeck to the specific card names found in profile.deck
                         setBattleDeck(deckNames);
                    }
                } catch (e) {
                    console.error("Failed to load profile", e);
                } finally {
                    setPageLoading(false);
                }
            } else {
                setPageLoading(false);
            }
        };
        loadProfile();
    }, [playerProfilePda, fetchPlayerProfile]);


    // Derived Collection
    // Get all defined cards
    const allCards = Object.values(CARD_ID_TO_NAME);

    const handleCollectionClick = (cardName: string, isOwned: boolean) => {
        if (isOwned) {
            setSelectedCard(cardName);
        } else {
             // For unowned, just select for now but logic can expand
             setSelectedCard(cardName);
        }
    };

    // handleBuy is now implemented above

    const handleDeckSlotClick = (index: number) => {
        // If slot is empty (logic might need adjustment if using nulls in array)
        // Current battleDeck state is string[].
        // If I want 8 slots, I should map 0..7
        
        // Let's adjust reading the deck in render.
        // For now, let's keep battleDeck as string[] of used cards.
        
        if (selectedCard) {
            // Swap logic is complex with variable deck size
            // For now, simpler logic: If slot has card, swap? 
            // If pulling from collection to empty slot?
            
            // Revert to simple logic: Just logging for now as we don't have full deck editing instruction
            // But if user wants "data from chain", read-only is safer?
            // "battle deck would have 4 cards".
            // I'll assume read-only/display mostly, but keep basic selection logic if possible.
            // Actually, without `setMetadata` or `updateDeck` instruction on chain, local edits won't persist.
            // I will just allow basic local selection for inspecting.
             if (index < battleDeck.length) {
                // Clicking existing card
                setInspectCard({
                    name: battleDeck[index],
                    image: battleDeck[index],
                    description: 'Level 1 Card',
                    stats: [{ label: 'Level', value: 1 }]
                });
             }
             setSelectedCard(null);
        } else {
            // Inspect
            // Only if card exists at index
             if (index < battleDeck.length) {
                setInspectCard({
                    name: battleDeck[index],
                    image: battleDeck[index],
                    description: 'Level 1 Card',
                    stats: [{ label: 'Level', value: 1 }]
                });
             }
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
            const cardId = CARD_NAME_TO_ID[canonicalName];

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
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl text-shadow-md">Battle Deck</h2>
                        <button 
                            onClick={async () => {
                                if (battleDeck.some(c => c === null)) {
                                    alert("Deck must have 8 cards!");
                                    return;
                                }
                                
                                // Prepare deck IDs (must be 8 items)
                                const currentDeckIds = battleDeck.map(name => {
                                    if (!name) return 0;
                                    return CARD_NAME_TO_ID[name.replace('Card', '')] || 0;
                                });

                                // Pad with 0s to length 8
                                const deckIds = [...currentDeckIds, ...Array(8).fill(0)].slice(0, 8);

                                try {
                                    // Use the destructured `setDeck` from component scope
                                    await setDeck(deckIds, MINT_CONFIG.PLATFORM);
                                    alert("Deck saved successfully!");
                                } catch (e: any) {
                                    console.error("Failed to save deck", e);
                                    alert("Failed to save deck: " + e.message);
                                }
                            }}
                            className="bg-[#00d048] hover:bg-[#00e050] text-white text-xs font-bold px-3 py-1.5 rounded shadow-md border border-[#00b038] active:scale-95 transition-transform"
                        >
                            Save Deck
                        </button>
                    </div>
                    
                    {pageLoading ? (
                        <div className="text-center py-4">Loading Deck...</div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 bg-[#2a3c7a] p-2 rounded-xl border-2 border-[#1a254a]">
                            {/* Always render 8 slots */}
                            {Array.from({ length: 8 }).map((_, index) => {
                                const card = battleDeck[index]; // string like 'GiantCard' or undefined
                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (selectedCard) {
                                                // If we have a selected card from collection, place/swap it here
                                                const newDeck = [...battleDeck];
                                                
                                                // Check if card is already in deck
                                                const existingIndex = newDeck.findIndex(c => c === selectedCard);
                                                
                                                if (existingIndex !== -1) {
                                                    // SWAP: Move card from existingIndex to this index
                                                    // And move whatever is at this index to existingIndex
                                                    const cardAtTarget = newDeck[index];
                                                    newDeck[index] = selectedCard;
                                                    newDeck[existingIndex] = cardAtTarget;
                                                } else {
                                                    // REPLACE: Just set this slot
                                                    newDeck[index] = selectedCard;
                                                }
                                                
                                                setBattleDeck(newDeck);
                                                setSelectedCard(null); // Deselect after placing
                                            } else {
                                                // logic for inspecting card in deck?
                                                if (card) {
                                                   handleDeckSlotClick(index);
                                                }
                                            }
                                        }}
                                        className={`relative aspect-[3/4] bg-[#1c2954] rounded-lg border flex justify-center items-center cursor-pointer active:scale-95 transition-transform hover:brightness-110 ${selectedCard ? 'border-yellow-400 border-dashed' : 'border-[#4a6cd6]/30'}`}
                                    >
                                        {card ? (
                                            <>
                                                <img src={`/assets/${card}.png`} alt={card} className="w-[90%] h-[90%] object-contain drop-shadow-md" />
                                                <div className="absolute top-0 left-0 bg-purple-600 rounded-br-lg px-1.5 text-[0.7rem] border-b border-r border-black/30">1</div>
                                                <div className="absolute bottom-0 w-full text-center text-[0.6rem] bg-black/40 py-0.5 rounded-b-lg text-blue-200">Lvl 1</div>
                                            </>
                                        ) : (
                                            <div className="opacity-20 text-2xl">Empty</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-center mt-2 mb-3 text-sm text-blue-200">
                        Avg Elixir: <span className="text-purple-300">3.8</span>
                    </div>
                </div>

                {/* Scrollable Collection Area */}
                <div className="flex-1 overflow-y-auto bg-[#1a1a1a] pb-[80px]">
                    <h2 className="text-center text-lg mb-4 text-[#fbce47] text-shadow-sm sticky top-0 bg-[#1a1a1a] pt-4 pb-3 px-4 z-20 border-b border-white/10">Card Collection</h2>
                    <div className="grid grid-cols-4 gap-3 px-4">
                        {allCards.map((baseName, index) => {
                            const assetName = baseName + 'Card';
                            const isSelected = selectedCard === assetName;
                            const isInDeck = battleDeck.includes(assetName);
                            
                            // Check ownership
                            // profile.inventory has items with cardId. 
                            // We need to match cardId to baseName.
                            // We can use CARD_NAME_TO_ID to get the ID.
                            const cardId = CARD_NAME_TO_ID[baseName];
                            const inventoryItem = profile?.inventory?.find(item => item.cardId === cardId);
                            const isOwned = !!inventoryItem;
                            const level = inventoryItem ? inventoryItem.level : 1;
                            const amount = inventoryItem ? inventoryItem.amount : 0;
                            
                            // Progress Calculation (Visual Tweaked)
                            const cardsNeeded = level * 2;
                            // Treat first card as unlock, so progress starts from 2nd card
                            // If amount is 1, numerator is 0. If amount is 2, numerator is 1 (50%? No wait)
                            // If Lvl 1->2 needs 2 cards total.
                            // 1 card = Unlocked. 2 cards = Upgrade Ready.
                            // So range is 1..2.
                            // Progress = (amount - 1) / (cardsNeeded - 1)
                            // 1 -> 0/1 = 0%.
                            // 2 -> 1/1 = 100%.
                            const progressPercent = isOwned 
                                ? Math.min(((Math.max(0, amount - 1)) / (Math.max(1, cardsNeeded - 1))) * 100, 100)
                                : 0;

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleCollectionClick(assetName, isOwned)}
                                    className={`relative aspect-[3/4] bg-[#2a2a2a] rounded-lg border-2 flex justify-center items-center cursor-pointer active:scale-95 transition-transform ${isSelected ? 'border-[#fbce47] bg-[#333] scale-105' : 'border-white/10 hover:bg-[#333]'} ${!isOwned ? 'opacity-80' : ''}`}
                                >
                                    <img src={`/assets/${assetName}.png`} alt={baseName} className={`w-[90%] h-[90%] object-contain transition-all ${isInDeck ? 'grayscale brightness-50' : ''} ${!isOwned ? 'grayscale-[0.5]' : ''}`} />

                                    {isOwned ? (
                                        <>
                                             <div className="absolute top-0 left-0 bg-gray-700/80 rounded-br-lg px-1.5 text-[0.7rem] z-10 text-white">Lvl {level}</div>
                                             <div className="absolute top-0 right-0 bg-gray-700/80 rounded-bl-lg px-1.5 text-[0.7rem] z-10 text-[#fbce47] font-bold">x{amount}</div>
                                             
                                             {isSelected && (
                                                <div className="absolute inset-0 border-4 border-[#fbce47] rounded-lg pointer-events-none z-20 shadow-[0_0_15px_rgba(251,206,71,0.5)]"></div>
                                             )}

                                             <div className="absolute bottom-1 w-full flex flex-col items-center gap-1 z-10" onClick={(e) => handleUpgrade(e, assetName)}>
                                                <div className="h-1.5 w-[80%] bg-gray-700 rounded-full overflow-hidden border border-black/50">
                                                    <div 
                                                        className={`h-full ${amount >= cardsNeeded ? 'bg-[#00d048]' : 'bg-[#4da6ff]'}`} 
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[0.5rem] text-[#59ffac] bg-black/60 px-1 rounded">Upgrade</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col justify-end items-center pb-2 bg-black/40 rounded-lg z-20">
                                             <div className="mb-auto mt-2 text-xs text-gray-300 font-bold bg-black/60 px-2 rounded opacity-100">Locked</div>
                                             <button 
                                                onClick={(e) => handleBuy(e, baseName)}
                                                className="bg-green-600 hover:bg-green-500 text-white text-[0.6rem] px-2 py-1.5 rounded shadow-lg border border-green-400 font-bold flex items-center gap-1"
                                             >
                                                <span>Buy</span>
                                                <span className="text-[#fbce47]">100</span>
                                             </button>
                                        </div>
                                    )}
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
