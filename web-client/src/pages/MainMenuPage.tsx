import React, { useEffect, useState } from 'react';
import { useGameProgram, type PlayerProfile } from '../hooks/use-game-program';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';

export const MainMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchPlayerProfile, playerProfilePda, platformBalance, createSession, sessionToken } = useGameProgram();
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    
    useEffect(() => {
        if (playerProfilePda) {
            fetchPlayerProfile(playerProfilePda).then(setProfile);
        }
    }, [playerProfilePda, fetchPlayerProfile]);

    const username = profile?.username || localStorage.getItem('username') || 'Guest';
    const trophies = profile?.trophies ?? 0;

    return (
        <MobileLayout className=" text-white">
            {/* Background Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#334d85] to-[#12192b] z-0 pointer-events-none"></div>

            {/* Top Bar / Stats */}
            <div 
                className="relative z-10 w-full mt-4 px-4 flex justify-between items-center bg-black/30 rounded-full py-2 border border-white/10 backdrop-blur-sm shadow-md mx-auto max-w-[95%] cursor-pointer hover:bg-black/40 transition-colors"
                onClick={() => navigate('/profile')}
            >
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#3b60aa] rounded-full flex justify-center items-center border-2 border-[#6ba1ff] text-shadow-sm shadow-lg">
                        <span className="text-lg">1</span>
                    </div>
                    <div className="text-[#64cbff] text-shadow-sm">{username}</div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Session Key Status */}
                    {sessionToken ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-900/50 rounded border border-green-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[0.6rem] text-green-400 font-bold uppercase tracking-wider">Session Active</span>
                        </div>
                    ) : (
                        <button 
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600/80 hover:bg-blue-500 rounded border border-blue-400/50 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                createSession().catch(err => alert("Failed to create session: " + err.message));
                            }}
                        >
                            <span className="text-[0.6rem] text-white font-bold uppercase tracking-wider">Enable Session</span>
                        </button>
                    )}

                     {/* Coins / Balance */}
                     <div className="flex items-center gap-1">
                        <span className="text-[#fbce47] font-bold text-shadow-sm text-sm">{platformBalance.toLocaleString()}</span>
                        <div className="w-4 h-4 rounded-full bg-[#fbce47] border border-[#d4af37] shadow-sm"></div>
                    </div>

                    {/* Trophies */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a]/50 rounded-full border border-white/10">
                        <img src="/assets/trophy.png" alt="Trophies" className="h-6 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-[#ffce4b] text-shadow-sm">{trophies}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Grow to fill space */}
            <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center gap-6 overflow-hidden">

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
            <BottomNav />
        </MobileLayout>
    );
};
