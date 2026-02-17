import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameProgram } from '../hooks/use-game-program';
import { MINT_CONFIG } from '../game/config/MintConfig';
import { PublicKey } from '@solana/web3.js';

interface VictoryScreenProps {
    winner: 'player' | 'opponent' | 'draw';
    playerCrowns: number;
    opponentCrowns: number;
    playerTowersDestroyed: number;
    opponentTowersDestroyed: number;
    victoryReason?: string;
    gameId?: string;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
    winner,
    playerCrowns,
    opponentCrowns,
    playerTowersDestroyed,
    opponentTowersDestroyed,
    victoryReason,
    gameId
}) => {
    const navigate = useNavigate();
    const { claimRewards, isLoading, error } = useGameProgram();

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

                {/* Tower Destruction Stats */}
                <div className="flex justify-center items-center gap-8 mb-6">
                    <div className="text-center">
                        <div className="text-sm text-blue-300">Towers Destroyed</div>
                        <div className="text-2xl font-bold text-white">{opponentTowersDestroyed}/3</div>
                    </div>
                    <div className="text-2xl text-gray-500">vs</div>
                    <div className="text-center">
                        <div className="text-sm text-red-300">Towers Destroyed</div>
                        <div className="text-2xl font-bold text-white">{playerTowersDestroyed}/3</div>
                    </div>
                </div>

                {/* Victory Reason */}
                {victoryReason && (
                    <div className="mb-6 text-center">
                        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
                            <span className="text-yellow-300 font-semibold">{victoryReason}</span>
                        </div>
                    </div>
                )}

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

                {winner === 'player' && gameId && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            onClick={async () => {
                                try {
                                    await claimRewards(new PublicKey(gameId), MINT_CONFIG.GOLD);
                                    alert('Rewards claimed successfully!');
                                } catch (err: any) {
                                    console.error('Claim rewards failed:', err);
                                    alert(`Claim failed: ${err.message}`);
                                }
                            }}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-black py-4 px-8 rounded-xl transition-all active:scale-95 shadow-[0_5px_15px_rgba(249,115,22,0.4)] border-b-4 border-orange-800 disabled:opacity-50"
                        >
                            {isLoading ? 'Claiming...' : '🏆 CLAIM REWARDS 🏆'}
                        </button>
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
