import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Guest';

    return (
        <MobileLayout bgClass="bg-[#222]" className=" text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#334d85] to-[#12192b] z-0 pointer-events-none"></div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 w-full flex flex-col p-4 overflow-y-auto pb-[90px]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/menu')} className="bg-[#333] border-2 border-white/20 rounded-lg px-3 py-1 text-sm hover:bg-[#444]">
                        &lt; Back
                    </button>
                    <h1 className="text-xl text-shadow-md">Player Profile</h1>
                    <div className="w-16"></div> {/* Spacer */}
                </div>

                {/* Player Card */}
                <div className="bg-[#1a3a6e] border-2 border-[#4da6ff] rounded-xl p-6 mb-6 relative overflow-hidden shadow-lg">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#3b60aa] rounded-full flex justify-center items-center border-4 border-[#6ba1ff] text-shadow-sm shadow-lg mb-3">
                            <span className="text-3xl">1</span>
                        </div>
                        <h2 className="text-2xl text-[#64cbff] text-shadow-md mb-1">{username}</h2>
                        <div className="text-gray-300 text-sm mb-4">#29V0UQJ9</div>

                        {/* Clan Tag */}
                        <div className="bg-[#000]/30 px-4 py-1 rounded-full border border-white/10 text-yellow-400 text-sm mb-4">
                            No Clan
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Trophies */}
                    <div className="bg-[#2a2a2a] border border-white/10 rounded-lg p-3 flex flex-col items-center">
                        <img src="/assets/trophy.png" className="h-8 mb-1" />
                        <span className="text-gray-400 text-xs">Current Trophies</span>
                        <span className="text-xl text-[#ffce4b]">2000</span>
                    </div>

                    {/* Highest Trophies */}
                    <div className="bg-[#2a2a2a] border border-white/10 rounded-lg p-3 flex flex-col items-center">
                        <img src="/assets/trophy.png" className="h-8 mb-1 grayscale brightness-50" />
                        <span className="text-gray-400 text-xs">Highest Trophies</span>
                        <span className="text-xl text-white">2000</span>
                    </div>

                    {/* Wins */}
                    <div className="bg-[#2a2a2a] border border-white/10 rounded-lg p-3 flex flex-col items-center">
                        <img src="/assets/battle_icon.png" className="h-8 mb-1" />
                        <span className="text-gray-400 text-xs">Total Wins</span>
                        <span className="text-xl text-green-400">142</span>
                    </div>

                    {/* Three Crown Wins */}
                    <div className="bg-[#2a2a2a] border border-white/10 rounded-lg p-3 flex flex-col items-center">
                        <img src="/assets/crown_blue.png" className="h-8 mb-1" />
                        <span className="text-gray-400 text-xs">Three Crown Wins</span>
                        <span className="text-xl text-blue-300">89</span>
                    </div>
                </div>

                {/* Wrapper for Battle Log Button */}
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/history')}
                        className="w-full bg-[#3b60aa] hover:bg-[#4a72be] border-2 border-[#6ba1ff] text-white py-3 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <img src="/assets/history_icon.png" className="w-6 h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-shadow-sm uppercase tracking-wider text-sm">Battle Log</span>
                    </button>
                </div>
            </div>

            <BottomNav />
        </MobileLayout >
    );
};
