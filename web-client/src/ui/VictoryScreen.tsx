import React from 'react';
import { useNavigate } from 'react-router-dom';

interface VictoryScreenProps {
    winner: 'player' | 'opponent' | 'draw';
    playerCrowns: number;
    opponentCrowns: number;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, playerCrowns, opponentCrowns }) => {
    const navigate = useNavigate();

    const getTitle = () => {
        if (winner === 'player') return 'VICTORY!';
        if (winner === 'opponent') return 'DEFEAT';
        return 'DRAW';
    };

    const getTitleColor = () => {
        if (winner === 'player') return 'text-yellow-400';
        if (winner === 'opponent') return 'text-red-500';
        return 'text-gray-400';
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black/80 flex flex-col items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-4 border-yellow-500 rounded-2xl p-8 shadow-2xl max-w-md text-center">
                <h1 className={`text-5xl font-bold mb-6 ${getTitleColor()} [text-shadow:3px_3px_0_#000]`}>
                    {getTitle()}
                </h1>

                <div className="flex justify-center items-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="text-xl text-blue-300 mb-2">You</div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`text-4xl ${i <= playerCrowns ? 'opacity-100' : 'opacity-30'}`}>
                                    👑
                                </div>
                            ))}
                        </div>
                        <div className="text-3xl font-bold text-white mt-2">{playerCrowns}</div>
                    </div>

                    <div className="text-5xl text-gray-500">vs</div>

                    <div className="text-center">
                        <div className="text-xl text-red-300 mb-2">Opponent</div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`text-4xl ${i <= opponentCrowns ? 'opacity-100' : 'opacity-30'}`}>
                                    👑
                                </div>
                            ))}
                        </div>
                        <div className="text-3xl font-bold text-white mt-2">{opponentCrowns}</div>
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => navigate('/menu')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-transform active:scale-95 shadow-lg"
                    >
                        Main Menu
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-transform active:scale-95 shadow-lg"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
};
