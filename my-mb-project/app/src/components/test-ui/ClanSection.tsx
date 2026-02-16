
import { useState } from "react";
import { useGameProgram } from "../../hooks/use-game-program";
import { TestSection } from "./TestSection";
import toast from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { TEST_TOKENS } from "../../config/tokens";

export function ClanSection() {
    const { createClan, joinClan, requestCards, donateCards, isLoading } = useGameProgram();
    const [clanName, setClanName] = useState("");
    const [clanAddress, setClanAddress] = useState("");
    const [cardId, setCardId] = useState("");
    const [requesterAddress, setRequesterAddress] = useState("");

    const handleCreateClan = async () => {
        if (!clanName) return toast.error("Enter clan name");
        const toastId = toast.loading("Creating Clan...");
        try {
            const tx = await createClan(clanName);
            toast.success(`Clan Created: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleJoinClan = async () => {
        if (!clanAddress) return toast.error("Enter clan address");
        const toastId = toast.loading("Joining Clan...");
        try {
            const tx = await joinClan(new PublicKey(clanAddress));
            toast.success(`Joined Clan: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleRequestCards = async () => {
        if (!clanAddress || !cardId) return toast.error("Enter clan address and card ID");
        const toastId = toast.loading("Requesting Cards...");
        try {
            const tx = await requestCards(new PublicKey(clanAddress), parseInt(cardId));
            toast.success(`Requested Cards: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleDonateCards = async () => {
        if (!clanAddress || !requesterAddress) return toast.error("Enter clan and requester address");
        const toastId = toast.loading("Donating Cards...");
        try {
            // Asuming we are donating the Archer card for test
            const tx = await donateCards(new PublicKey(clanAddress), new PublicKey(requesterAddress), new PublicKey(TEST_TOKENS.ARCHER_MINT));
            toast.success(`Donated Cards: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    return (
        <TestSection title="Clan Management">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Create Clan</h3>
                        <input
                            type="text"
                            placeholder="Clan Name"
                            value={clanName}
                            onChange={(e) => setClanName(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button onClick={handleCreateClan} disabled={isLoading} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
                            Create
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Join Clan</h3>
                        <input
                            type="text"
                            placeholder="Clan Address"
                            value={clanAddress}
                            onChange={(e) => setClanAddress(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button onClick={handleJoinClan} disabled={isLoading} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
                            Join
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Request Cards</h3>
                        <input
                            type="text"
                            placeholder="Clan Address"
                            value={clanAddress}
                            onChange={(e) => setClanAddress(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Card ID"
                            value={cardId}
                            onChange={(e) => setCardId(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button onClick={handleRequestCards} disabled={isLoading} className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700">
                            Request
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Donate Cards</h3>
                        <input
                            type="text"
                            placeholder="Clan Address"
                            value={clanAddress}
                            onChange={(e) => setClanAddress(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Requester Address"
                            value={requesterAddress}
                            onChange={(e) => setRequesterAddress(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button onClick={handleDonateCards} disabled={isLoading} className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700">
                            Donate
                        </button>
                    </div>
                </div>
            </div>
        </TestSection>
    );
}
