import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../ui/MobileLayout';
import { BottomNav } from '../ui/BottomNav';

const MAPS = [
    {
        id: 'base',
        name: 'Classic Arena',
        description: 'The original battleground. Perfectly balanced.',
        route: '/map-test',
        image: '/assets/map_cover.png',
        color: 'from-green-500/20 to-green-900/40'
    },
    {
        id: 'map2',
        name: 'Solana Arena',
        description: 'Neon synthwave vibes with Solana branding.',
        route: '/map2',
        image: '/solanamap/logo.png',
        color: 'from-purple-500/20 to-blue-900/40'
    },
    {
        id: 'map3',
        name: 'Magicblock Arena',
        description: 'Dark, mysterious, and powered by Magicblock.',
        route: '/map3',
        image: '/magicblock/logo.png',
        color: 'from-teal-500/20 to-gray-900/40'
    }
];

export const MapSelectionPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <MobileLayout className="text-white">
            <div className="absolute inset-0 bg-[#0f172a] z-0 pointer-events-none"></div>
            
            <div className="relative z-10 w-full px-6 py-8 flex flex-col h-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
                        SELECT <span className="text-amber-400 text-shadow-glow">ARENA</span>
                    </h1>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1">
                        Choose your battleground
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto pb-24 space-y-6 pr-2 -mr-2">
                    {MAPS.map((map) => (
                        <div 
                            key={map.id}
                            onClick={() => navigate(map.route)}
                            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${map.color} p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:border-white/30 shadow-2xl`}
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors" />
                            
                            <div className="relative flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={map.image} 
                                        alt={map.name} 
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            e.currentTarget.src = '/assets/arena_logo.png';
                                        }}
                                    />
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-xl font-black italic tracking-tight text-white group-hover:text-amber-400 transition-colors">
                                        {map.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm font-medium mt-1 leading-tight">
                                        {map.description}
                                    </p>
                                </div>

                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Hover highlight line */}
                            <div className="absolute bottom-0 left-0 h-1 bg-amber-400 transition-all duration-300 w-0 group-hover:w-full" />
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};
