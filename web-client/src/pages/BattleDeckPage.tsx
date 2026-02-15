import React from 'react';
import { useNavigate } from 'react-router-dom';

// Mock Data
const BATTLE_DECK = [
    'ArchersCard', 'ArrowsCard', 'FireballCard', 'GiantCard',
    'MiniPEKKACard', 'BabyDragonCard', 'InfernoTowerCard', 'ValkyrieCard'
];

const COLLECTION = [
    'BarbariansCard', 'CannonCard', 'WizardCard', 'RageCard',
    'ArchersCard', 'ArrowsCard', 'FireballCard', 'GiantCard',
    'MiniPEKKACard', 'BabyDragonCard', 'InfernoTowerCard', 'ValkyrieCard',
    'BarbariansCard', 'CannonCard', 'WizardCard', 'RageCard'
    // Added more for scrolling demo
];

export const BattleDeckPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-screen h-screen bg-[#222] flex justify-center items-center font-[Supercell-Magic] text-white overflow-hidden">
            <div className="relative h-full max-h-[946px] w-full max-w-[528px] bg-[#333] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x-4 border-black">

                {/* Header / Battle Deck Area */}
                <div className="flex-none p-4 bg-[#4a6cd6] border-b-4 border-black/50 shadow-lg z-10">
                    <h2 className="text-center text-xl mb-2 text-shadow-md">Battle Deck</h2>
                    <div className="grid grid-cols-4 gap-2 bg-[#2a3c7a] p-2 rounded-xl border-2 border-[#1a254a]">
                        {BATTLE_DECK.map((card, index) => (
                            <div key={index} className="relative aspect-[3/4] bg-[#1c2954] rounded-lg border border-[#4a6cd6]/30 flex justify-center items-center cursor-pointer active:scale-95 transition-transform hover:brightness-110">
                                <img src={`/assets/${card}.png`} alt={card} className="w-[90%] h-[90%] object-contain drop-shadow-md" />
                                <div className="absolute top-0 left-0 bg-purple-600 rounded-br-lg px-1.5 text-[0.7rem] border-b border-r border-black/30">3</div>
                                <div className="absolute bottom-0 w-full text-center text-[0.6rem] bg-black/40 py-0.5 rounded-b-lg text-blue-200">Lvl 1</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-1 text-sm text-blue-200">
                        Avg Elixir: <span className="text-purple-300">3.8</span>
                    </div>
                </div>

                {/* Scrollable Collection Area */}
                <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-4 pb-[80px]"> {/* pb for bottom nav */}
                    <h2 className="text-center text-lg mb-4 text-[#fbce47] text-shadow-sm sticky top-0 bg-[#1a1a1b] py-2 z-10 border-b border-white/10">Card Collection</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {COLLECTION.map((card, index) => (
                            <div key={index} className="relative aspect-[3/4] bg-[#2a2a2a] rounded-lg border border-white/10 flex justify-center items-center cursor-pointer active:scale-95 transition-transform hover:bg-[#333]">
                                <img src={`/assets/${card}.png`} alt={card} className="w-[90%] h-[90%] object-contain grayscale-[30%] hover:grayscale-0 transition-all" />
                                <div className="absolute top-0 left-0 bg-gray-700/80 rounded-br-lg px-1.5 text-[0.7rem]">4</div>
                                <div className="absolute bottom-1 w-full flex justify-center">
                                    <div className="h-1 w-[80%] bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full w-[40%] bg-[#fbce47]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Nav */}
                <div className="absolute bottom-0 left-0 w-full h-[70px] bg-[#222] border-t-2 border-[#444] flex justify-around items-center z-50">
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer bg-[#333] border-t-2 border-[#fbce47]">
                        <img src="/assets/cards_icon.png" className="h-[30px] object-contain mb-1" />
                        <span className="text-[0.6rem] text-[#fbce47]">Cards</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Profile coming soon!")}>
                        {/* Placeholder Icon */}
                        <div className="w-[30px] h-[30px] bg-gray-500 rounded-full mb-1"></div>
                        <span className="text-[0.6rem]">Profile</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => navigate('/menu')}>
                        <img src="/assets/battle_icon.png" className="h-[30px] object-contain mb-1 grayscale" />
                        <span className="text-[0.6rem]">Battle</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Camp coming soon!")}>
                        <img src="/assets/training_camp_icon.png" className="h-[30px] object-contain mb-1 grayscale" />
                        <span className="text-[0.6rem]">Camp</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("History coming soon!")}>
                        <img src="/assets/history_icon.png" className="h-[30px] object-contain mb-1 grayscale" />
                        <span className="text-[0.6rem]">History</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
