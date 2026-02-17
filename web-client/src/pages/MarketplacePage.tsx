import React, { useState, useEffect } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { CardModal } from '../ui/CardModal';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { useGameProgram } from '../hooks/use-game-program';
import { TROOP_NAME_TO_MINT } from '../game/config/MintConfig';

const MOCK_NFT_LISTINGS = [
    { id: 1, name: 'Golden Giant', type: 'Troop', rarity: 'Rare', price: 1.2, image: 'GiantCard', mintNumber: 420 },
    { id: 2, name: 'Royal Archer', type: 'Troop', rarity: 'Common', price: 0.5, image: 'ArchersCard', mintNumber: 1337 },
    { id: 3, name: 'Dragon Lord', type: 'Troop', rarity: 'Legendary', price: 5.0, image: 'BabyDragonCard', mintNumber: 1 },
    { id: 4, name: 'Fireball', type: 'Spell', rarity: 'Rare', price: 0.8, image: 'WizardCard', mintNumber: 99 },
    { id: 5, name: 'Mini PEKKA', type: 'Troop', rarity: 'Rare', price: 0.9, image: 'MiniPEKKACard', mintNumber: 777 },
    { id: 6, name: 'Valkyrie', type: 'Troop', rarity: 'Rare', price: 1.1, image: 'ValkyrieCard', mintNumber: 12 },
];

const MOCK_TRANSACTIONS = [
    { type: 'Buy', item: 'Golden Giant #420', price: 1.2, time: '2m ago' },
    { type: 'Sell', item: 'Skeleton Army #55', price: 0.3, time: '1h ago' },
    { type: 'Buy', item: 'Dragon Lord #2', price: 4.8, time: '1d ago' },
];

export const MarketplacePage: React.FC = () => {
    const { unlockCard, isLoading: isTxLoading, error: txError } = useGameProgram();
    const [selectedCard, setSelectedCard] = useState<any | null>(null);
    const [filter, setFilter] = useState<'All' | 'Troop' | 'Spell'>('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const filteredListings = MOCK_NFT_LISTINGS.filter(item => filter === 'All' || item.type === filter);

    return (
        <MobileLayout bgClass="bg-[#121212]" className="text-white">
            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col px-4 pt-6 overflow-y-auto pb-[90px]">

                {/* Header / Wallet */}
                <div className="flex justify-between items-center mb-8 bg-[#1e1e1e] p-4 rounded-xl border border-[#333] shadow-lg relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex justify-center items-center shadow-inner">
                            <span className="text-xs">W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] text-gray-400 uppercase tracking-widest leading-tight">Balance</span>
                            <span className="text-[#fbce47] text-lg leading-tight">1,250 <span className="text-xs text-[#fbce47]/70">SOL</span></span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 items-center justify-start">
                    {['All', 'Troop', 'Spell'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-5 py-2 rounded-full text-sm border-2 transition-all whitespace-nowrap ${filter === f ? 'bg-white text-black border-white shadow-md transform scale-105' : 'bg-transparent text-gray-400 border-gray-600 hover:border-white/50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* NFT Grid */}
                <h2 className="text-xl text-white mb-6 flex items-center gap-2">
                    Market Listings <span className="text-xs text-black bg-[#fbce47] px-2 py-0.5 rounded-full font-bold shadow-sm">{isLoading ? '...' : filteredListings.length}</span>
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {isLoading ? (
                        <>
                            <SkeletonLoader className="h-48 rounded-xl" count={1} />
                            <SkeletonLoader className="h-48 rounded-xl" count={1} />
                            <SkeletonLoader className="h-48 rounded-xl" count={1} />
                            <SkeletonLoader className="h-48 rounded-xl" count={1} />
                        </>
                    ) : (
                        filteredListings.map((nft) => (
                            <div
                                key={nft.id}
                                onClick={() => setSelectedCard(nft)}
                                className="bg-[#1e1e1e] rounded-xl border border-[#333] p-3 flex flex-col cursor-pointer hover:border-[#fbce47]/50 hover:shadow-[0_0_15px_rgba(251,206,71,0.1)] transition-all group"
                            >
                                <div className="relative aspect-[3/4] w-full mb-3 bg-[#111] rounded-lg overflow-hidden flex justify-center items-center border border-white/5">
                                    <img src={`/assets/${nft.image}.png`} className="w-[85%] h-[85%] object-contain transition-transform group-hover:scale-110" />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[0.6rem] text-[#fbce47] border border-[#fbce47]/20">
                                        #{nft.mintNumber}
                                    </div>
                                </div>

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-sm text-white truncate w-24">{nft.name}</h3>
                                        <span className={`text-[0.6rem] px-1.5 rounded ${nft.rarity === 'Legendary' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : nft.rarity === 'Rare' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {nft.rarity}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Price</span>
                                    <span className="text-[#fbce47] text-sm font-bold">{nft.price} SOL</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Transaction History */}
                <div className="mt-4">
                    <h2 className="text-lg text-white mb-3">Activity</h2>
                    <div className="bg-[#1e1e1e] rounded-xl border border-[#333] overflow-hidden">
                        {MOCK_TRANSACTIONS.map((tx, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0 hover:bg-[#252525]">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex justify-center items-center ${tx.type === 'Buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <span className="text-xs">{tx.type}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-white">{tx.item}</span>
                                        <span className="text-xs text-gray-500">{tx.time}</span>
                                    </div>
                                </div>
                                <span className="text-white text-sm">{tx.price} SOL</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {selectedCard && (
                <CardModal
                    card={{
                        name: selectedCard.name,
                        image: selectedCard.image,
                        description: 'A genuine minted NFT card for Magic Royale.',
                        stats: [
                            { label: 'Mint #', value: selectedCard.mintNumber },
                            { label: 'Rarity', value: selectedCard.rarity },
                            { label: 'Price', value: `${selectedCard.price} SOL` }
                        ]
                    }}
                    onClose={() => setSelectedCard(null)}
                />
            )}

            {/* Buy Confirmation Button (Floating when card selected) */}
            {selectedCard && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-slideUp">
                    <button
                        onClick={async () => {
                            const canonicalName = selectedCard.name.split(' ').pop(); // e.g., 'Golden Giant' -> 'Giant'
                            const mint = TROOP_NAME_TO_MINT[canonicalName || ''];
                            const nameToId: Record<string, number> = {
                                'Archer': 1, 'Giant': 2, 'MiniPEKKA': 3, 'Arrows': 4, 'Valkyrie': 5, 'Wizard': 6, 'BabyDragon': 7
                            };
                            const cardId = nameToId[canonicalName || ''];

                            if (!mint || !cardId) {
                                alert(`Could not find mint or ID for ${canonicalName}`);
                                return;
                            }

                            try {
                                console.log(`Unlocking ${canonicalName} (ID: ${cardId})`);
                                await unlockCard(cardId, mint);
                                alert(`Successfully unlocked ${selectedCard.name}!`);
                                setSelectedCard(null);
                            } catch (err) {
                                console.error('Unlock failed:', err);
                            }
                        }}
                        disabled={isTxLoading}
                        className="bg-[#fbce47] hover:bg-[#ffe082] text-black font-black px-12 py-4 rounded-full shadow-[0_10px_30px_rgba(251,206,71,0.4)] border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all text-xl uppercase tracking-wider"
                    >
                        {isTxLoading ? 'Processing...' : `Buy for ${selectedCard.price} SOL`}
                    </button>
                </div>
            )}

            {/* Transaction feedback - simplified for brevity */}
            {txError && (
                <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg z-50 text-sm">
                    {txError}
                </div>
            )}

            <BottomNav />
        </MobileLayout>
    );
};
