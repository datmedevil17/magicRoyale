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

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -20; // Max 20deg rotation
        const rotateY = ((x - centerX) / centerX) * 20;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                ref={cardRef}
                className="relative w-72 bg-[#1a254a] rounded-xl p-6 border-4 border-[#4a6cd6] shadow-[0_0_50px_rgba(74,108,214,0.5)] transition-transform duration-100 ease-out"
                style={{ transform }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
            >
                {/* Holographic Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-xl z-20" />

                <div className="flex flex-col items-center">
                    <h2 className="text-2xl text-white text-shadow-md mb-4 bg-[#0a1124]/50 px-4 py-1 rounded-full border border-white/10">
                        {card.name}
                    </h2>

                    <div className="w-48 h-60 mb-6 relative">
                        <img
                            src={`/assets/${card.image}.png`}
                            alt={card.name}
                            className="w-full h-full object-contain drop-shadow-2xl"
                            onError={(e) => e.currentTarget.src = `https://placehold.co/200x300/1a1a1a/white?text=${card.name}`}
                        />
                        {/* Rarity Glow */}
                        <div className="absolute inset-0 bg-radial-gradient from-[#fbce47]/20 to-transparent pointer-events-none" />
                    </div>

                    {card.description && (
                        <p className="text-gray-300 text-sm text-center mb-4 italic">
                            "{card.description}"
                        </p>
                    )}

                    {/* Stats Grid */}
                    {card.stats && (
                        <div className="grid grid-cols-2 gap-3 w-full mb-4">
                            {card.stats.map((stat, idx) => (
                                <div key={idx} className="bg-[#0a1124] p-2 rounded border border-white/5 flex flex-col items-center">
                                    <span className="text-[0.6rem] text-gray-400 uppercase">{stat.label}</span>
                                    <span className="text-[#fbce47] font-bold">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="mt-2 bg-[#ff5e5e] hover:bg-[#ff4444] text-white px-6 py-2 rounded-lg border-b-4 border-[#b30000] active:border-b-0 active:translate-y-1 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
