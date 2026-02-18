import React, { useEffect, useState } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { useGameProgram } from '../hooks/use-game-program';
import { CARD_ID_TO_NAME } from '../game/config/CardConfig';
import { MINT_CONFIG } from '../game/config/MintConfig';

export const MarketplacePage: React.FC = () => {
    const { unlockCard, isLoading: isTxLoading, platformBalance, fetchPlayerProfile, playerProfilePda, fetchMarketListings } = useGameProgram();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [marketListings, setMarketListings] = useState<{ cardId: number, price: number }[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetchMarketListings().then(setMarketListings);
    }, [fetchMarketListings]);

    useEffect(() => {
        if (playerProfilePda) {
            fetchPlayerProfile(playerProfilePda).then(setProfile);
        }
    }, [playerProfilePda, fetchPlayerProfile]);

    const handleBuy = async (cardId: number) => {
        try {
            await unlockCard(cardId, MINT_CONFIG.PLATFORM);
            alert(`Successfully bought ${CARD_ID_TO_NAME[cardId]}!`);
            // Refresh profile to update balance/inventory if needed
            if (playerProfilePda) fetchPlayerProfile(playerProfilePda).then(setProfile);
        } catch (err: any) {
            console.error("Purchase failed", err);
            alert("Purchase failed: " + err.message);
        }
    };

    return (
        <MobileLayout bgClass="bg-[#121212]" className="text-white">

            <div className="relative z-10 flex-1 w-full flex flex-col px-4 pt-6 overflow-y-auto pb-[90px]">
                {/* Header / Wallet */}
                <div className="flex justify-between items-center mb-8 bg-[#1e1e1e] p-4 rounded-xl border border-[#333] shadow-lg relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex justify-center items-center shadow-inner">
                            <span className="text-xs">W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] text-gray-400 uppercase tracking-widest leading-tight">Balance</span>
                            <span className="text-[#fbce47] text-lg leading-tight">{platformBalance.toLocaleString()} <span className="text-xs text-[#fbce47]/70">TOKENS</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-shadow-md">Daily Shop</h2>
                    <div className="text-xs text-gray-400">Refreshes in 12h 30m</div>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-3 gap-3">
                     {/* Listings */}
                     {marketListings.length === 0 ? (
                        <div className="col-span-3 text-center text-gray-500 py-8">
                            Loading market...
                        </div>
                     ) : (
                        marketListings.map((listing) => {
                            const id = listing.cardId;
                            const name = CARD_ID_TO_NAME[id];
                            const price = listing.price;

                            // Skip if name is 'Unknown' or ID is out of bounds
                            if (!name || name === 'Unknown') return null;

                            const imageUrl = `/assets/${name}Card.png`;
                            
                            // Check ownership
                            const isOwned = profile?.inventory?.some((item: any) => item.cardId === id);

                            return (
                                <div key={id} className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#333] shadow-lg flex flex-col relative group">
                                    <div className="aspect-[4/5] relative bg-[#111]">
                                        <img 
                                            src={imageUrl} 
                                            alt={name}
                                            className={`w-full h-full object-contain p-2 transition-all ${!isOwned ? 'grayscale opacity-50' : ''}`}
                                            onError={(e) => (e.currentTarget.src = '/assets/card_box.png')}
                                        />
                                    </div>
                                    
                                    <div className="p-2 flex flex-col items-center bg-[#252525]">
                                        <span className="text-xs font-bold mb-1 truncate w-full text-center">{name}</span>
                                        <button 
                                            className={`text-[0.6rem] font-bold px-3 py-1.5 rounded-full w-full shadow-md transition-transform flex items-center justify-center gap-1
                                                ${isOwned 
                                                    ? 'bg-[#fbce47] hover:bg-[#ffda6b] text-black active:scale-95' 
                                                    : 'bg-[#4a6cd6] hover:bg-[#5a7ce6] text-white active:scale-95'}
                                            `}
                                            onClick={() => handleBuy(id)}
                                            disabled={isTxLoading}
                                        >
                                            {isOwned ? (
                                                <>
                                                    {price} <span className="text-[0.5rem] opacity-80">TOKENS</span>
                                                </>
                                            ) : (
                                                <>
                                                    Unlock <span className="text-[0.5rem] text-[#fbce47]">{price}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                     )}
                </div>

                {/* Helper Text */}
                <div className="mt-8 text-center text-xs text-gray-500 max-w-xs mx-auto">
                    Buy duplicate cards to upgrade your troops!
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};

