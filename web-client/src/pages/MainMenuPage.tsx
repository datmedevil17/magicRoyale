import React from 'react';
import { useNavigate } from 'react-router-dom';

export const MainMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Guest';

    return (
        <div className="w-screen h-screen bg-[#222] flex flex-col font-[Supercell-Magic] text-white overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#334d85] to-[#12192b] z-0 pointer-events-none"></div>

            {/* Top Bar / Stats */}
            <div className="relative z-10 w-full max-w-2xl mx-auto mt-4 px-4 flex justify-between items-center bg-black/30 rounded-full py-2 border border-white/10 backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#3b60aa] rounded-full flex justify-center items-center border-2 border-[#6ba1ff] text-shadow-sm shadow-lg">
                        <span className="text-lg">1</span>
                    </div>
                    <div className="text-[#64cbff] text-shadow-sm">{username}</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a]/50 rounded-full border border-white/10">
                    <img src="/assets/trophy.png" alt="Trophies" className="h-6 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="text-[#ffce4b] text-shadow-sm">2000</span>
                </div>
            </div>

            {/* Main Content Area - Grow to fill space */}
            <div className="relative z-10 flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-6">

                {/* Logos */}
                <div className="w-64 animate-bounce-slow">
                    <img src="/assets/clash_royale_logo.png" alt="Clash Royale" className="w-full drop-shadow-2xl" />
                </div>
                <div className="w-48 opacity-90">
                    <img src="/assets/arena_logo.png" alt="Arena" className="w-full drop-shadow-lg" />
                </div>

                {/* Main Action Buttons */}
                <div className="flex gap-6 mt-8">
                    <div
                        className="relative w-40 h-24 flex justify-center items-center cursor-pointer transition-transform active:scale-95 hover:brightness-110"
                        onClick={() => navigate('/waiting')}
                    >
                        <img src="/assets/button_yellow.png" alt="Battle" className="absolute w-full h-full drop-shadow-xl" />
                        <span className="relative z-10 text-xl text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">Battle</span>
                    </div>
                    <div className="relative w-40 h-24 flex justify-center items-center cursor-pointer transition-transform active:scale-95 hover:brightness-110">
                        <img src="/assets/button_blue.png" alt="2v2" className="absolute w-full h-full drop-shadow-xl" />
                        <span className="relative z-10 text-xl text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">2v2</span>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="relative z-20 w-full h-[90px] bg-[#222] border-t-2 border-[#444] flex justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <div className="w-full max-w-md flex justify-around items-center h-full">
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => navigate('/deck')}>
                        <img src="/assets/cards_icon.png" className="h-8 object-contain mb-1 grayscale" />
                        <span className="text-xs text-white">Cards</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Profile coming soon!")}>
                        <div className="w-8 h-8 bg-gray-500 rounded-full mb-1"></div>
                        <span className="text-xs text-white">Profile</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer bg-[#333] border-t-2 border-[#fbce47]">
                        <img src="/assets/battle_icon.png" className="h-8 object-contain mb-1" />
                        <span className="text-xs text-[#fbce47]">Battle</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Camp coming soon!")}>
                        <img src="/assets/training_camp_icon.png" className="h-8 object-contain mb-1 grayscale" />
                        <span className="text-xs text-white">Camp</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] h-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("History coming soon!")}>
                        <img src="/assets/history_icon.png" className="h-8 object-contain mb-1 grayscale" />
                        <span className="text-xs text-white">History</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
