
import { useState } from "react";
import { useGameProgram } from "../../hooks/use-game-program";
import { TestSection } from "./TestSection";
import toast from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";

export function SessionSection() {
    const { createSession, delegate, sessionToken, isLoading } = useGameProgram();
    const [delegatePda, setDelegatePda] = useState("");

    const handleCreateSession = async () => {
        const toastId = toast.loading("Creating Session...");
        try {
            const tx = await createSession();
            toast.success(`Session Created!`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleDelegate = async () => {
        if (!delegatePda) return toast.error("Enter PDA to delegate");
        const toastId = toast.loading("Delegating PDA...");
        try {
            const tx = await delegate(new PublicKey(delegatePda));
            toast.success(`Delegated: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    return (
        <TestSection title="Session & Delegation (Ephemeral Rollup)">
            <div className="flex flex-col gap-4">
                <div className="p-4 border rounded bg-gray-50">
                    <p className="text-sm font-mono break-all">
                        Session Token: {sessionToken ? "Active" : "None"}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={handleCreateSession} disabled={isLoading} className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
                        Create Session
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="PDA to Delegate (Player/Game)"
                        value={delegatePda}
                        onChange={(e) => setDelegatePda(e.target.value)}
                        className="flex-1 p-2 border rounded"
                    />
                    <button onClick={handleDelegate} disabled={isLoading} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                        Delegate
                    </button>
                </div>
            </div>
        </TestSection>
    );
}
