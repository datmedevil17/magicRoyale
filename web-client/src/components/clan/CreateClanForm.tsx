import React, { useState } from 'react';
import { useGameProgram } from '../../hooks/use-game-program';

interface CreateClanFormProps {
    onBack: () => void;
    onSuccess: () => void;
}

export const CreateClanForm: React.FC<CreateClanFormProps> = ({ onBack, onSuccess }) => {
    const { createClan } = useGameProgram();
    const [name, setName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        try {
            await createClan(name);
            onSuccess();
        } catch (e: any) {
            console.error(e);
            alert("Failed to create clan: " + (e.message || e.toString()));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 text-white bg-[#1a1a1b] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-5 pointer-events-none"></div>

            <button onClick={onBack} className="self-start text-gray-400 hover:text-white mb-6 flex items-center gap-1 font-bold text-sm">
                ← Back
            </button>

            <h2 className="text-2xl font-bold mb-2 text-center text-shadow-lg text-[#fbce47]">Create New Clan</h2>
            <p className="text-center text-gray-400 text-xs mb-8">Build your community and rise to the top!</p>

            <div className="flex flex-col gap-6 relative z-10 max-w-sm mx-auto w-full">
                
                <div className="bflex flex-col items-center gap-2 mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border-2 border-[#fbce47] flex justify-center items-center shadow-[0_0_20px_rgba(40,100,255,0.3)]">
                        <img src="/assets/clan_badge.png" className="w-12 h-12 object-contain drop-shadow-md" />
                    </div>
                    <span className="text-xs text-blue-300">Default Badge</span>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-300 ml-1">CLAN NAME</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter clan name..."
                        maxLength={32}
                        className="bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4a6cd6] focus:ring-1 focus:ring-[#4a6cd6] transition-all shadow-inner"
                    />
                    <div className="text-right text-[0.6rem] text-gray-500">{name.length}/32</div>
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !name.trim()}
                        className={`w-full py-4 rounded-xl font-bold text-base shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                            isCreating || !name.trim()
                                ? 'bg-gray-600 text-gray-400 border-gray-800'
                                : 'bg-[#fbce47] text-black border-[#cc9000] hover:brightness-110'
                        }`}
                    >
                        {isCreating ? (
                            <div className="flex justify-center items-center gap-2">
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </div>
                        ) : 'Create & Join'}
                    </button>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                    <div className="flex items-start gap-2">
                        <span className="text-yellow-500 text-lg">💡</span>
                        <p className="text-[0.6rem] text-yellow-200/80 pt-1">
                            Creating a clan costs nothing right now, but leads to eternal glory! Make sure your name respects the community guidelines.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
