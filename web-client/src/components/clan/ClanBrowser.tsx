import React, { useState, useEffect } from 'react';
import { useGameProgram } from '../../hooks/use-game-program';
import { SkeletonLoader } from '../../ui/SkeletonLoader';
import { PublicKey } from '@solana/web3.js';

interface ClanBrowserProps {
    onCreateClick: () => void;
    onJoinSuccess: () => void;
}

export const ClanBrowser: React.FC<ClanBrowserProps> = ({ onCreateClick, onJoinSuccess }) => {
    const { fetchAllClans, joinClan } = useGameProgram();
    const [clans, setClans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [joiningClan, setJoiningClan] = useState<string | null>(null);

    useEffect(() => {
        loadClans();
    }, [fetchAllClans]);

    const loadClans = async () => {
        setIsLoading(true);
        const data = await fetchAllClans();
        setClans(data);
        setIsLoading(false);
    };

    const handleJoin = async (clanKey: PublicKey) => {
        setJoiningClan(clanKey.toBase58());
        try {
            await joinClan(clanKey);
            onJoinSuccess();
        } catch (e: any) {
            console.error(e);
            alert("Failed to join clan: " + (e.message || e.toString()));
        } finally {
            setJoiningClan(null);
        }
    };

    const filteredClans = clans.filter(c => 
        c.account.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white text-shadow-lg">Find a Clan</h2>
                <button 
                    onClick={onCreateClick}
                    className="bg-[#fbce47] text-black border-2 border-black border-b-[4px] active:border-b-2 active:translate-y-1 rounded-xl px-4 py-2 font-bold text-sm shadow-lg hover:brightness-110 transition-all"
                >
                    Create Clan
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clans..."
                    className="w-full bg-[#1a1a1b] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4a6cd6] shadow-inner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-20">
                {isLoading ? (
                    <SkeletonLoader count={6} className="h-16 rounded-xl" />
                ) : filteredClans.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        {search ? "No clans found matching your search." : "No clans available yet. Be the first to create one!"}
                    </div>
                ) : (
                    filteredClans.map((clan) => (
                        <div key={clan.publicKey.toBase58()} className="bg-[#2a2a2a] p-3 rounded-xl border border-black/20 flex justify-between items-center shadow-lg hover:bg-[#333] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border border-[#fbce47] flex justify-center items-center shadow-md">
                                    <img src="/assets/clan_badge.png" className="w-6 h-6 object-contain drop-shadow" onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-base leading-tight">{clan.account.name}</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>👥 {clan.account.memberCount}/50</span>
                                        <span>🏆 {clan.account.minTrophies}+</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleJoin(clan.publicKey)}
                                disabled={joiningClan === clan.publicKey.toBase58() || clan.account.memberCount >= 50}
                                className={`px-4 py-2 rounded-lg font-bold text-xs shadow-md border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                                    joiningClan === clan.publicKey.toBase58() 
                                        ? 'bg-gray-500 text-gray-300 border-gray-700 cursor-wait' 
                                        : clan.account.memberCount >= 50
                                            ? 'bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed'
                                            : 'bg-[#59ffac] text-[#0a4d2e] border-[#2e8f5b] hover:brightness-110'
                                }`}
                            >
                                {joiningClan === clan.publicKey.toBase58() ? 'Joining...' : clan.account.memberCount >= 50 ? 'Full' : 'Join'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
