
import { useState, useEffect } from "react";
import { useGameProgram } from "../../hooks/use-game-program";
import { useMatchmaking } from "../../hooks/use-matchmaking";
import { TestSection } from "./TestSection";
import toast from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

import { TEST_TOKENS } from "../../config/tokens";
export function GameSection() {
    const { publicKey } = useWallet();
    const { startGame, deployTroop, commitBattle, resolveGame, claimRewards, delegate, isLoading } = useGameProgram();
    const { isConnected, isSearching, match, joinQueue, leaveQueue } = useMatchmaking(publicKey?.toBase58() || null);

    // Inputs
    const [gameId, setGameId] = useState("");
    const [opponent, setOpponent] = useState("");
    const [battleId, setBattleId] = useState("");

    // Deploy inputs
    const [cardIdx, setCardIdx] = useState("0");
    const [x, setX] = useState("0");
    const [y, setY] = useState("0");

    // Resolve inputs
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");

    // Auto-fill from match
    useEffect(() => {
        if (match) {
            setGameId(match.gameId);
            setOpponent(match.opponent);
            if (match.isPlayerOne) {
                toast("You are Player 1! Please Start Game.", { icon: "🎮" });
            } else {
                toast("You are Player 2! Wait for Player 1 to Start.", { icon: "⏳" });
            }
        }
    }, [match]);

    const handleStartGame = async () => {
        if (!opponent) return toast.error("Enter Opponent");
        const toastId = toast.loading("Starting Game...");
        try {
            const tx = await startGame(new PublicKey(opponent));
            toast.success(`Game Started: ${tx}`, { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleDeployTroop = async () => {
        if (!gameId) return toast.error("Enter Game ID");
        const toastId = toast.loading("Deploying Troop (ER)...");
        try {
            // Using gameId as battleId for now if not provided, or we should add battleId input next to deploy
            // The previous code used gameId for both.
            const targetBattleId = battleId ? new PublicKey(battleId) : new PublicKey(gameId);
            const tx = await deployTroop(new PublicKey(gameId), targetBattleId, parseInt(cardIdx), parseInt(x), parseInt(y));
            toast.success(`Troop Deployed: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleCommitBattle = async () => {
        if (!battleId) return toast.error("Enter Battle ID");
        const toastId = toast.loading("Committing Battle...");
        try {
            const tx = await commitBattle(new PublicKey(battleId));
            toast.success(`Battle Committed: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleResolveGame = async () => {
        if (!gameId || !battleId || !p1 || !p2) return toast.error("Enter Game, Battle, P1 & P2");
        const toastId = toast.loading("Resolving Game...");
        try {
            const tx = await resolveGame(new PublicKey(gameId), new PublicKey(battleId), new PublicKey(p1), new PublicKey(p2));
            toast.success(`Game Resolved: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    return (
        <TestSection title="Game Actions (Base & Ephemeral)">
            <div className="flex flex-col gap-6">

                {/* Matchmaking Section */}
                <div className="flex flex-col gap-2 p-4 border rounded bg-indigo-50 border-indigo-100">
                    <h3 className="font-medium text-indigo-800 flex justify-between">
                        <span>Matchmaking (Socket Server)</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </h3>
                    <div className="flex gap-4 items-center">
                        {!isSearching ? (
                            <button
                                onClick={joinQueue}
                                disabled={!isConnected || isSearching}
                                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Find Match
                            </button>
                        ) : (
                            <button
                                onClick={leaveQueue}
                                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                            >
                                Cancel Search
                            </button>
                        )}

                        {isSearching && <span className="text-sm text-indigo-600 animate-pulse">Searching for opponent...</span>}
                        {match && <span className="text-sm text-green-600 font-medium">Match Found!</span>}
                    </div>
                </div>

                {/* Start Game */}
                <div className="flex flex-col gap-2 p-4 border rounded">
                    <h3 className="font-medium text-gray-700">Start Game (Base Layer)</h3>
                    <div className="flex gap-2">
                        {/* Game ID is now generated internally, so we don't input it */}
                        <div className="flex-1 p-2 border rounded bg-gray-100 text-gray-500 italic">
                            Game ID generated automatically
                        </div>
                        <input
                            type="text"
                            placeholder="Opponent PubKey"
                            value={opponent}
                            onChange={(e) => setOpponent(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                        <button onClick={handleStartGame} disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded">
                            Start
                        </button>
                    </div>
                </div>

                {/* Delegate Game (ER Authorization) */}
                <div className="flex flex-col gap-2 p-4 border rounded bg-orange-50">
                    <h3 className="font-medium text-orange-800">Delegate Game (Authorize ER)</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Game/Battle Address"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                        <button
                            onClick={async () => {
                                if (!gameId) return toast.error("Enter Game Address");
                                const toastId = toast.loading("Delegating Game...");
                                try {
                                    const tx = await delegate(new PublicKey(gameId));
                                    toast.success(`Game Delegated: ${tx}`, { id: toastId });
                                } catch (error: any) {
                                    toast.error(`Error: ${error.message}`, { id: toastId });
                                }
                            }}
                            disabled={isLoading}
                            className="bg-orange-600 text-white px-4 py-2 rounded"
                        >
                            Delegate
                        </button>
                    </div>
                </div>

                {/* Deploy Troop */}
                <div className="flex flex-col gap-2 p-4 border rounded bg-blue-50">
                    <h3 className="font-medium text-blue-800">Deploy Troop (Ephemeral Rollup)</h3>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Game Account Address"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Battle Address (same as game?)"
                            value={battleId}
                            onChange={(e) => setBattleId(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input type="number" placeholder="Card Idx" value={cardIdx} onChange={e => setCardIdx(e.target.value)} className="w-20 p-2 border rounded" />
                        <input type="number" placeholder="X" value={x} onChange={e => setX(e.target.value)} className="w-20 p-2 border rounded" />
                        <input type="number" placeholder="Y" value={y} onChange={e => setY(e.target.value)} className="w-20 p-2 border rounded" />
                        <button onClick={handleDeployTroop} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">
                            Deploy
                        </button>
                    </div>
                </div>

                {/* Commit Battle */}
                <div className="flex flex-col gap-2 p-4 border rounded">
                    <h3 className="font-medium text-gray-700">Commit Battle (Settle on Base)</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Battle Address"
                            value={battleId}
                            onChange={(e) => setBattleId(e.target.value)}
                            className="flex-1 p-2 border rounded"
                        />
                        <button onClick={handleCommitBattle} disabled={isLoading} className="bg-gray-800 text-white px-4 py-2 rounded">
                            Commit
                        </button>
                    </div>
                </div>

                {/* Resolve Game */}
                <div className="flex flex-col gap-2 p-4 border rounded bg-purple-50">
                    <h3 className="font-medium text-purple-800">Resolve Game (Finalize)</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="Game Address"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Battle Address"
                            value={battleId}
                            onChange={(e) => setBattleId(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Player 1 PubKey"
                            value={p1}
                            onChange={(e) => setP1(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Player 2 PubKey"
                            value={p2}
                            onChange={(e) => setP2(e.target.value)}
                            className="p-2 border rounded"
                        />
                    </div>
                    <button onClick={handleResolveGame} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded w-full mt-2">
                        Resolve Game
                    </button>

                    <div className="mt-4 pt-4 border-t border-purple-200">
                        <h4 className="font-medium text-sm text-purple-800 mb-2">Claim Rewards</h4>
                        <button
                            onClick={async () => {
                                if (!gameId) return toast.error("Enter Game Address");
                                const toastId = toast.loading("Claiming Rewards...");
                                try {
                                    // Testing with GOLD MINT
                                    const tx = await claimRewards(new PublicKey(gameId), new PublicKey(TEST_TOKENS.GOLD_MINT));
                                    toast.success(`Rewards Claimed: ${tx}`, { id: toastId });
                                } catch (error: any) {
                                    toast.error(`Error: ${error.message}`, { id: toastId });
                                }
                            }}
                            disabled={isLoading}
                            className="bg-yellow-600 text-white px-4 py-2 rounded w-full hover:bg-yellow-700"
                        >
                            Claim Gold Rewards
                        </button>
                    </div>
                </div>
            </div>
        </TestSection>
    );
}
