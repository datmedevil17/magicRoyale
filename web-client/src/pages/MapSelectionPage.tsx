import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../ui/MobileLayout';
import { BottomNav } from '../ui/BottomNav';
import { MAPS, getSelectedMap, setSelectedMap, type MapType } from '../game/config/Maps';

export const MapSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<MapType>(getSelectedMap);

    const selectMap = (id: MapType) => {
        setSelected(id);
        setSelectedMap(id);
    };

    return (
        <MobileLayout className="text-white">
            <div className="absolute inset-0 bg-[#0f172a] z-0 pointer-events-none"></div>
            
            <div className="relative z-10 w-full px-6 py-8 flex flex-col h-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
                        SELECT <span className="text-amber-400 text-shadow-glow">ARENA</span>
                    </h1>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1">
                        Choose your battleground — used for matches you create
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto pb-24 space-y-6 pr-2 -mr-2">
                    {MAPS.map((map) => (
                        <div 
                            key={map.id}
                            onClick={() => selectMap(map.id)}
                            className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${map.color} p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-2xl ${selected === map.id ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-white/10 hover:border-white/30'}`}
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
                                    {selected === map.id && (
                                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[0.65rem] font-black tracking-widest">
                                            SELECTED
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(map.previewRoute);
                                    }}
                                    className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[0.65rem] font-black tracking-widest transition-colors"
                                >
                                    PREVIEW
                                </button>
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
