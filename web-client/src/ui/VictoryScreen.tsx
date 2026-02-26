import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BN } from '@coral-xyz/anchor';
import { toast } from 'react-hot-toast';
import { useGameProgram } from '../hooks/use-game-program';
import { MINT_CONFIG } from '../game/config/MintConfig';

interface VictoryScreenProps {
    winner: 'player' | 'opponent' | 'draw';
    playerCrowns: number;
    opponentCrowns: number;
    playerTowersDestroyed: number;
    opponentTowersDestroyed: number;
    victoryReason?: string;
    gameId?: string; // u64 as decimal string
    role?: 'player1' | 'player2';
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
    winner,
    playerCrowns,
    opponentCrowns,
    playerTowersDestroyed,
    opponentTowersDestroyed,
    victoryReason,
    gameId,
    role
}) => {
    const navigate = useNavigate();
    const { mintTrophies, endGame, isLoading, error } = useGameProgram();
    const [countdown, setCountdown] = React.useState(8);

    // New states for the multi-step ending process
    const [hasEndedGame, setHasEndedGame] = React.useState(false);
    const [isEndingGame, setIsEndingGame] = React.useState(false);

    React.useEffect(() => {
        if (winner === 'opponent') {
            const timer = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [winner]);

    // ─── Automated End-Game Sequence ──────────────────────────────────────────
    const sequenceTriggered = React.useRef(false);

    React.useEffect(() => {
        if (winner !== 'player' || !gameId || sequenceTriggered.current) return;

        sequenceTriggered.current = true;

        const runSequence = async () => {
            try {
                // Step 1: End Game (on-chain)
                setIsEndingGame(true);
                let winnerIdx = role === 'player1' ? 0 : 1;

                console.log(`[VictorySequence] Ending Game: ${gameId}, WinnerIdx: ${winnerIdx}`);
                await endGame(new BN(gameId), winnerIdx);
                setHasEndedGame(true);
                setIsEndingGame(false);

                // Step 2: Mint Trophies (Base Layer)
                // Small delay to ensure Base node has seen the commitment
                await new Promise(r => setTimeout(r, 2000));

                let mintRetries = 3;
                while (mintRetries > 0) {
                    try {
                        console.log(`[VictorySequence] Minting Trophies, Attempt: ${4 - mintRetries}`);
                        await mintTrophies(new BN(gameId), MINT_CONFIG.GOLD);
                        toast.success('🏆 Trophies Minted! 🏆');
                        break;
                    } catch (err: any) {
                        console.warn(`[VictorySequence] Mint failed: ${err.message}`);
                        mintRetries--;
                        if (mintRetries > 0) {
                            await new Promise(r => setTimeout(r, 4000));
                        } else {
                            throw err; // Out of retries
                        }
                    }
                }
            } catch (err: any) {
                console.error('[VictorySequence] Sequence failed:', err);
                toast.error(`Automated settlement failed: ${err.message}`);
            }
        };

        runSequence();
    }, [winner, gameId, role, endGame, mintTrophies]);

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

                {/* Loser Redirection Countdown */}
                {winner === 'opponent' && (
                    <div className="mb-6 text-red-400 font-medium animate-pulse">
                        Returning to menu in {countdown}s...
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

                {/* Multi-Step Blockchain Actions for Winner */}
                {winner === 'player' && gameId && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="w-full bg-black/40 rounded-xl p-4 border border-blue-500/30">
                            <div className="flex flex-col gap-3">
                                {/* Step 1: Commitment */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">1. Committing Battle</span>
                                    {hasEndedGame ? (
                                        <span className="text-green-400 font-bold">✓ DONE</span>
                                    ) : isEndingGame ? (
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="text-gray-500">PENDING</span>
                                    )}
                                </div>

                                {/* Step 2: Minting */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">2. Claiming Trophies</span>
                                    {isLoading && hasEndedGame ? (
                                        <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : hasEndedGame && error ? (
                                        <span className="text-red-400 font-bold">FAILED</span>
                                    ) : hasEndedGame && !isLoading ? (
                                        <span className="text-yellow-400 font-bold">✓ DONE</span>
                                    ) : (
                                        <span className="text-gray-500">WAITING</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-3 text-red-400 text-xs flex flex-col items-center gap-2">
                                <p>{error}</p>
                                <button
                                    onClick={() => {
                                        sequenceTriggered.current = false;
                                        window.location.reload(); // Simplest way to reset all states and hooks correctly
                                    }}
                                    className="text-white bg-red-600/50 hover:bg-red-600 px-4 py-1 rounded text-[10px] uppercase font-bold"
                                >
                                    Try Sequence Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
