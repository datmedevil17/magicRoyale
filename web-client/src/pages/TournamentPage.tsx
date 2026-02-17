import React from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';

const EVENTS = [
    {
        id: 1,
        title: 'Global Tournament',
        subtitle: 'Sudden Death',
        endsIn: '2d 14h',
        bannerColor: 'from-[#602588] to-[#3a0d58]',
        icon: 'trophy',
        free: true
    },
    {
        id: 2,
        title: 'Classic Challenge',
        subtitle: '12 Wins',
        endsIn: 'Always Open',
        bannerColor: 'from-[#c98e26] to-[#8d5e0f]',
        icon: 'swords',
        free: false,
        cost: '10'
    },
    {
        id: 3,
        title: 'Grand Challenge',
        subtitle: '12 Wins',
        endsIn: 'Always Open',
        bannerColor: 'from-[#c98e26] to-[#8d5e0f]',
        icon: 'swords',
        free: false,
        cost: '100'
    }
];

export const TournamentPage: React.FC = () => {
    return (
        <MobileLayout bgClass="bg-[#1c1124]" className=" text-white">
            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-5 pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col pb-[90px] overflow-y-auto">
                <div className="p-4 pt-6 text-center">
                    <h1 className="text-2xl text-[#d496ff] text-shadow-[0_2px_0_#000] tracking-wider mb-1">EVENTS</h1>
                    <div className="w-16 h-1 bg-[#d496ff]/50 mx-auto rounded-full"></div>
                </div>

                <div className="px-4 flex flex-col gap-4">
                    {/* Featured Event */}
                    <div className="relative h-48 rounded-xl overflow-hidden shadow-lg border-2 border-[#d496ff]/50 group cursor-pointer transition-transform active:scale-95">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8a3ab9] to-[#4a1a6a]"></div>
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-20 mix-blend-overlay"></div>

                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-[0.6rem] text-white font-bold">Ends in 2d 14h</span>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                            <h2 className="text-xl text-white text-shadow-md mb-1">Global Tournament</h2>
                            <p className="text-xs text-[#d496ff] mb-2">Sudden Death Mode</p>
                            <button className="bg-[#fbce47] text-black px-6 py-2 rounded-lg text-sm shadow-[0_4px_0_#c39006] active:shadow-none active:translate-y-1 transition-all font-bold uppercase">
                                Enter
                            </button>
                        </div>
                    </div>

                    <h3 className="text-sm text-gray-400 uppercase tracking-widest mt-2 ml-1">Challenges</h3>

                    {/* Basic Challenges */}
                    {EVENTS.slice(1).map(event => (
                        <div key={event.id} className="bg-[#2a1a35] border border-white/5 rounded-xl p-1 flex shadow-md active:bg-[#352243] transition-colors cursor-pointer">
                            <div className={`w-20 bg-gradient-to-br ${event.bannerColor} rounded-l-lg flex justify-center items-center border-r border-black/20`}>
                                <img src={`/assets/${event.icon === 'trophy' ? 'trophy.png' : 'swords_icon.png'}`} className="w-8 h-8 opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                            <div className="flex-1 p-3 flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm text-white mb-0.5">{event.title}</h4>
                                    <span className="text-[0.6rem] text-[#d496ff] bg-[#d496ff]/10 px-1.5 py-0.5 rounded">{event.subtitle}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <button className={`${event.free ? 'bg-[#fbce47]' : 'bg-[#59ffac]'} text-black px-3 py-1.5 rounded text-xs shadow-sm font-bold min-w-[60px] flex justify-center items-center gap-1`}>
                                        {event.free ? 'Free' : (
                                            <>
                                                <span>{event.cost}</span>
                                                <div className="w-3 h-3 bg-green-700 rounded-full border border-green-400"></div>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};
