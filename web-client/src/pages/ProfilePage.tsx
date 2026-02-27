import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { useGameProgram, type PlayerProfile } from '../hooks/use-game-program';
import { getCardData } from '../game/config/CardConfig';
import { MINT_CONFIG } from '../game/config/MintConfig';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchPlayerProfile, playerProfilePda, platformBalance, upgradeCard } = useGameProgram();
    const [profile, setProfile] = useState<PlayerProfile | null>(null);

    useEffect(() => {
        if (playerProfilePda) {
            fetchPlayerProfile(playerProfilePda).then(setProfile);
        }
    }, [playerProfilePda, fetchPlayerProfile]);

    const username = profile?.username || localStorage.getItem('username') || 'Guest';
    const trophies = profile?.trophies ?? 0;

    return (
        <MobileLayout bgClass="bg-[#222]" className="text-white">
            <div className="absolute inset-0 bg-[#222] pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col p-4 overflow-y-auto pb-[90px]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/menu')} className="bg-[#333] border-2 border-white/20 rounded-lg px-3 py-1 text-sm hover:bg-[#444]">
                        &lt; Back
                    </button>
                    <h1 className="text-xl text-shadow-md">Player Profile</h1>

                    {/* Token Balance */}
                    <div className="flex flex-col items-end">
                        <span className="text-[0.5rem] text-gray-400 uppercase">Balance</span>
                        <span className="text-[#fbce47] text-sm font-bold">{platformBalance ? platformBalance.toLocaleString() : '0'} <span className="text-[0.6rem]">TOKENS</span></span>
                    </div>
                </div>

                {/* Profile Hero Section */}
                <div className="bg-[#1a3a6e] border-2 border-[#4da6ff] rounded-xl p-6 mb-6 relative overflow-hidden shadow-lg flex flex-col items-center justify-center">
                    {/* Username and Trophies Row */}
                    <div className="flex items-center gap-4 mb-2 z-10">
                        <h2 className="text-2xl text-[#64cbff] text-shadow-md font-bold">{username}</h2>
                        <div className="w-px h-6 bg-white/30"></div>
                        <div className="flex items-center gap-2">
                            <img src="/assets/cup_icon.png" alt="Trophies" className="h-8 drop-shadow-md" />
                            <span className="text-2xl text-[#ffce4b] font-bold text-shadow-sm">{trophies}</span>
                        </div>
                    </div>
                </div>

                {/* Cards Collection */}
                <h3 className="text-lg font-bold mb-3 pl-1 border-l-4 border-[#fbce47] leading-none ml-1">Card Collection</h3>
                <div className="grid grid-cols-4 gap-2">
                    {profile?.inventory && profile.inventory.length > 0 ? (
                        profile.inventory.map((card, idx) => {
                            const cardData = getCardData(card.cardId);
                            const cardName = cardData?.name || `Card ${card.cardId}`;
                            const imageUrl = cardData?.icon ? `/${cardData.icon}` : '/assets/cards/unknown.png';

                            const cardsNeeded = card.level * 2;
                            const canUpgrade = card.amount >= cardsNeeded;
                            const upgradeCost = 50 * Math.pow(card.level, 2);

                            return (
                                <div key={idx} className="flex flex-col items-center">
                                    {/* Card Container */}
                                    <div className="relative w-full aspect-[3/4] bg-[#333] rounded-lg overflow-hidden border border-[#555] mb-1 group flex flex-col cursor-pointer">

                                        {/* Image Area (Takes most space) */}
                                        <div className="flex-1 w-full bg-[#222] flex justify-center items-center overflow-hidden">
                                            <img
                                                src={imageUrl}
                                                alt={cardName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.src = '/assets/cards/unknown.png')}
                                            />
                                        </div>

                                        {/* Level Badge Area (Bottom block) */}
                                        <div className="w-full bg-black/90 text-center text-[0.6rem] font-bold py-0.5 text-[#fbce47] z-10">
                                            Lvl {card.level}
                                        </div>

                                        {/* Hover Overlay */}
                                        {canUpgrade && (
                                            <div className="absolute top-0 left-0 right-0 bottom-4 bg-black/80 flex flex-col items-center justify-center p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <button
                                                    className="bg-[#00d048] hover:bg-[#00e050] text-white text-[0.5rem] font-bold px-1 py-1 rounded shadow-md w-full mb-1 leading-tight transform hover:scale-105 active:scale-95 transition-transform"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Upgrade ${cardName} to Level ${card.level + 1} for ${upgradeCost} Tokens?`)) {
                                                            try {
                                                                await upgradeCard(card.cardId, MINT_CONFIG.PLATFORM);
                                                                if (profile && playerProfilePda) fetchPlayerProfile(playerProfilePda).then(setProfile);
                                                            } catch (err: any) {
                                                                alert("Upgrade Failed: " + err.message);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    UPGRADE
                                                </button>
                                                <span className="text-[0.5rem] text-[#fbce47] font-bold drop-shadow-md">{upgradeCost} T</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar Container */}
                                    <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden border border-[#333] relative">
                                        <div
                                            className={`h-full transition-all duration-300 ${canUpgrade ? 'bg-[#00d048] animate-pulse' : 'bg-[#4da6ff]'}`}
                                            style={{ width: `${Math.min((card.amount / cardsNeeded) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[0.45rem] font-bold text-gray-400 mt-0.5 leading-none">
                                        {card.amount} / {cardsNeeded}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-4 text-center text-gray-500 text-xs py-4">No cards found. Play games to earn valid cards!</div>
                    )}
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};
