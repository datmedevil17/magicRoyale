import React from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';

const TOURNAMENTS = [
    {
        id: 1,
        title: 'Global Grand Tournament',
        subtitle: 'Sudden Death Mode',
        endsIn: 'Ends in 2d 14h',
        isActive: true, // This is the single major active tournament
    },
    {
        id: 2,
        title: 'Classic Challenge',
        subtitle: '12 Wins',
        endsIn: 'Starts in 12h',
        bannerColor: 'from-[#c98e26] to-[#8d5e0f]',
        stakeAmount: 10
    },
    {
        id: 3,
        title: 'Grand Challenge',
        subtitle: 'Draft Mode',
        endsIn: 'Starts in 1d',
        bannerColor: 'from-[#8a3ab9] to-[#4a1a6a]',
        stakeAmount: 100
    },
    {
        id: 4,
        title: 'Mega Draft',
        subtitle: '2v2 Battles',
        endsIn: 'Starts in 3d',
        bannerColor: 'from-[#2e6d3e] to-[#15381d]',
        stakeAmount: 50
    }
];

const TournamentBracket = () => {
    return (
        <div className="bg-black/40 rounded-xl p-4 mt-4 border border-white/10 overflow-x-auto">
            <h3 className="text-xs text-[#d496ff] uppercase tracking-wider mb-3">Live Bracket (Semi-Finals)</h3>
            <div className="flex items-center gap-2 min-w-[300px]">
                {/* Semi-finals */}
                <div className="flex flex-col gap-4">
                    {/* Match 1 */}
                    <div className="bg-[#2a1a35] border border-white/10 rounded-lg p-2 text-xs w-28 relative">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white truncate">Player_0X</span>
                            <span className="text-green-400 font-bold">2</span>
                        </div>
                        <div className="flex justify-between items-center opacity-50">
                            <span className="text-white truncate">Alice</span>
                            <span className="text-white">1</span>
                        </div>
                    </div>
                    {/* Match 2 (Active/Next) */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] rounded-lg p-2 text-xs w-28 relative">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-yellow-400 font-bold truncate">You</span>
                            <span className="text-yellow-400">-</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white truncate">Bob</span>
                            <span className="text-white">-</span>
                        </div>
                        <div className="absolute -top-2 -right-2 bg-red-500 text-[9px] px-1.5 py-0.5 rounded text-white font-bold animate-pulse">UPCOMING</div>
                    </div>
                </div>

                {/* Connectors */}
                <div className="flex flex-col justify-center h-24">
                    <div className="w-4 border-t-2 border-r-2 border-white/20 h-6 rounded-tr"></div>
                    <div className="w-4 border-b-2 border-r-2 border-white/20 h-6 rounded-br"></div>
                </div>
                <div className="w-4 border-t-2 border-white/20"></div>

                {/* Finals */}
                <div className="flex flex-col justify-center">
                    <div className="bg-black/60 border border-white/5 rounded-lg p-2 text-xs w-28 opacity-70">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-300 truncate">Player_0X</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-[10px] italic">TBD</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TournamentPage: React.FC = () => {
    const activeTournament = TOURNAMENTS.find(t => t.isActive);
    const upcomingTournaments = TOURNAMENTS.filter(t => !t.isActive);

    return (
        <MobileLayout bgClass="bg-[#1c1124]" className=" text-white">
            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-5 pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col pb-[90px] overflow-y-auto">
                <div className="p-4 pt-6 text-center">
                    <h1 className="text-2xl text-[#d496ff] text-shadow-[0_2px_0_#000] tracking-wider mb-1">TOURNAMENTS</h1>
                    <div className="w-16 h-1 bg-[#d496ff]/50 mx-auto rounded-full"></div>
                </div>

                <div className="px-4 flex flex-col gap-6">
                    {/* Major Active Tournament */}
                    {activeTournament && (
                        <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-[#d496ff]/50 bg-gradient-to-b from-[#3a1a5a] to-[#1a0a2a]">
                            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                            <div className="p-5 relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="inline-block px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-[10px] font-bold tracking-wider mb-2 uppercase animate-pulse">
                                            Live Event
                                        </div>
                                        <h2 className="text-2xl text-white font-bold text-shadow-md leading-tight">{activeTournament.title}</h2>
                                        <p className="text-sm text-[#d496ff]">{activeTournament.subtitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-300 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                                            {activeTournament.endsIn}
                                        </div>
                                    </div>
                                </div>

                                <TournamentBracket />

                                <div className="mt-5 flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-xs text-gray-400">Next Upcoming Battle</div>
                                        <div className="text-sm text-white font-semibold">You vs Bob</div>
                                    </div>
                                    <button className="bg-gradient-to-b from-[#fbce47] to-[#e0a800] text-black px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_4px_0_#9c7600] active:shadow-none active:translate-y-1 transition-all uppercase">
                                        Battle Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-3 ml-1">Upcoming Tournaments</h3>

                        <div className="flex flex-col gap-3">
                            {upcomingTournaments.map(event => (
                                <div key={event.id} className="bg-[#2a1a35] border border-white/5 rounded-xl p-1 flex shadow-md">
                                    <div className={`w-16 bg-gradient-to-br ${event.bannerColor} rounded-l-lg flex justify-center items-center border-r border-black/20 shrink-0`}>
                                        <img src="/assets/swords_icon.png" className="w-8 h-8 opacity-80" alt="swords" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                    <div className="flex-1 p-3 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-sm text-white font-bold leading-tight mb-0.5">{event.title}</h4>
                                                <span className="text-[10px] text-[#d496ff] bg-[#d496ff]/10 px-1.5 py-0.5 rounded">{event.subtitle} • {event.endsIn}</span>
                                            </div>
                                        </div>
                                        <button className="w-full bg-[#352243] hover:bg-[#4a305d] text-[#59ffac] border border-[#59ffac]/30 py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1.5 uppercase tracking-wide">
                                            Stake {event.stakeAmount} Tokens to Join
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};
