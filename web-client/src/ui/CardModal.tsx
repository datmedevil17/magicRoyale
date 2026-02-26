import React, { useRef, useState } from 'react';

interface CardModalProps {
    card: {
        name: string;
        image: string;
        description?: string;
        stats?: { label: string; value: string | number }[];
        level?: number;
    };
    onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');
    const [shine, setShine] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
        setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
        setShine({ x: 50, y: 50 });
    };

    // Simulated Metadata
    const mockMint = "7xK...9z2";
    const mockOwner = "magic...web3";
    const mockTokenId = `#${Math.floor(Math.random() * 9999)}`;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-md animate-fadeIn p-4" onClick={onClose}>
            <div
                ref={cardRef}
                className="relative w-full max-w-sm bg-gradient-to-br from-[#1a254a]/80 to-[#0a1124]/90 rounded-3xl p-6 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out overflow-hidden"
                style={{ transform }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Holographic Flash Reflect */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none z-30 mix-blend-color-dodge transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
                    }}
                />

                {/* Glass Light Border */}
                <div className="absolute inset-[1px] rounded-[22px] border border-white/10 pointer-events-none z-10" />

                <div className="flex flex-col items-center">
                    {/* Header: Name and Token ID */}
                    <div className="w-full flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] text-blue-400 font-bold tracking-widest uppercase mb-1">Epic Unit Card</span>
                            <h2 className="text-3xl text-white font-black tracking-tight drop-shadow-lg">
                                {card.name}
                            </h2>
                        </div>
                        <span className="text-white/40 font-mono text-sm mt-5">{mockTokenId}</span>
                    </div>

                    {/* Image Container with Rarity Glow */}
                    <div className="w-full aspect-square mb-8 relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="relative w-full h-full p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-center items-center">
                            <img
                                src={`/assets/${card.image}.png`}
                                alt={card.name}
                                className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                                onError={(e) => e.currentTarget.src = `https://placehold.co/400x400/1a1a1a/white?text=${card.name}`}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    {card.description && (
                        <div className="w-full mb-6 bg-white/5 border border-white/10 p-3 rounded-xl">
                            <p className="text-blue-100/70 text-xs italic leading-relaxed">
                                "{card.description}"
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    {card.stats && (
                        <div className="grid grid-cols-2 gap-3 w-full mb-8">
                            {card.stats.map((stat, idx) => (
                                <div key={idx} className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-start backdrop-blur-sm">
                                    <span className="text-[0.55rem] text-blue-400 font-bold uppercase tracking-wider mb-1">{stat.label}</span>
                                    <span className="text-white font-mono text-lg leading-none">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Blockchain Metadata Section */}
                    <div className="w-full space-y-2 mb-8 border-t border-white/10 pt-6">
                        <div className="flex justify-between items-center text-[0.65rem]">
                            <span className="text-white/40 uppercase">Mint Address</span>
                            <span className="text-blue-300 font-mono">{mockMint}</span>
                        </div>
                        <div className="flex justify-between items-center text-[0.65rem]">
                            <span className="text-white/40 uppercase">Owner</span>
                            <span className="text-blue-300 font-mono">{mockOwner}</span>
                        </div>
                        <div className="flex justify-between items-center text-[0.65rem]">
                            <span className="text-white/40 uppercase">Platform</span>
                            <span className="text-white">Solana ER</span>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-white text-[#0a1124] font-black py-4 rounded-2xl hover:bg-blue-100 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] uppercase tracking-widest text-sm"
                    >
                        Close
                    </button>

                    <p className="mt-4 text-[0.5rem] text-white/20 uppercase tracking-[0.2em]">Magic Royale Protocol v1.0</p>
                </div>
            </div>
        </div>
    );
};
