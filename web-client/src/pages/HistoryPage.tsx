import React from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';

const MOCK_HISTORY = [
    { type: '1v1', result: 'Victory', trophies: '+30', opponent: 'KingArthur', time: '5m ago' },
    { type: '1v1', result: 'Defeat', trophies: '-24', opponent: 'GoblinSlayer', time: '1h ago' },
    { type: '1v1', result: 'Victory', trophies: '+29', opponent: 'ArcherQueen', time: '2h ago' },
    { type: '2v2', result: 'Draw', trophies: '+0', opponent: 'ClanWarriors', time: '1d ago' },
    { type: '1v1', result: 'Victory', trophies: '+31', opponent: 'Knight', time: '1d ago' },
];

export const HistoryPage: React.FC = () => {
    return (
        <MobileLayout bgClass="bg-[#222]" className=" text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1e2a4a] to-[#0f1422] z-0 pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col p-4 overflow-y-auto pb-[90px]">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => window.history.back()} className="bg-[#333] border-2 border-white/20 rounded-lg px-3 py-1 text-sm hover:bg-[#444] shadow-md active:translate-y-0.5 transition-all">
                        &lt; Back
                    </button>
                    <h1 className="text-xl text-center text-shadow-md flex-1 pr-12">Battle Log</h1>
                </div>

                <div className="flex flex-col gap-3">
                    {MOCK_HISTORY.map((match, idx) => (
                        <div key={idx} className={`bg-[#2a2a2a] border-l-4 ${match.result === 'Victory' ? 'border-l-green-500' : match.result === 'Defeat' ? 'border-l-red-500' : 'border-l-gray-400'} rounded-r-lg p-4 shadow-md flex justify-between items-center`}>
                            <div>
                                <div className={`text-lg ${match.result === 'Victory' ? 'text-green-400' : match.result === 'Defeat' ? 'text-red-400' : 'text-gray-300'}`}>
                                    {match.result}
                                </div>
                                <div className="text-xs text-gray-400">{match.type} • vs {match.opponent}</div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[#ffce4b] text-shadow-sm">{match.trophies}</span>
                                <span className="text-[0.6rem] text-gray-500">{match.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </MobileLayout>
    );
};
