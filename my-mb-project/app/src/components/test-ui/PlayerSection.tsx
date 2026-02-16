
import { useState } from "react";
import { useGameProgram } from "../../hooks/use-game-program";
import { TestSection } from "./TestSection";
import toast from "react-hot-toast";

export function PlayerSection() {
    const { initializePlayer, playerProfilePda, isLoading } = useGameProgram();

    const handleInitialize = async () => {
        const toastId = toast.loading("Initializing Player...");
        try {
            const tx = await initializePlayer();
            toast.success(`Player Initialized: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    return (
        <TestSection title="Player Management">
            <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">Initialize your player profile on-chain.</p>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleInitialize}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Initialize Player
                    </button>
                </div>
                {playerProfilePda && (
                    <div className="p-3 bg-gray-100 rounded border border-gray-200 break-all">
                        <span className="font-semibold text-gray-700">Profile PDA:</span>
                        <code className="ml-2 text-sm text-blue-600">{playerProfilePda.toBase58()}</code>
                    </div>
                )}
            </div>
        </TestSection>
    );
}
