
import { useState } from "react";
import { useGameProgram } from "../../hooks/use-game-program";
import { TestSection } from "./TestSection";
import toast from "react-hot-toast";
import { TEST_TOKENS } from "../../config/tokens";
import { PublicKey } from "@solana/web3.js";

export function DeckSection() {
    const { unlockCard, upgradeCard, setDeck, isLoading } = useGameProgram();
    const [cardId, setCardId] = useState("");
    const [deckString, setDeckString] = useState("0,1,2,3,4,5,6,7");


    // ... inside component ...

    const handleUnlock = async () => {
        if (!cardId) return toast.error("Enter Card ID");
        const toastId = toast.loading("Unlocking Card...");
        try {
            // Use ARCHER_MINT for all cards for testing? 
            // Or assume cardId maps to a mint. 
            // The instructions usually take a mint.
            // Let's use ARCHER_MINT as default for now for all cards. 
            const tx = await unlockCard(parseInt(cardId), new PublicKey(TEST_TOKENS.ARCHER_MINT));
            toast.success(`Card Unlocked: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleUpgrade = async () => {
        if (!cardId) return toast.error("Enter Card ID");
        const toastId = toast.loading("Upgrading Card...");
        try {
            // Upgrade often uses Gold/Gems + Card Mint? 
            // IDL showed upgrade_card takes `mint` (singular) and `user_token_account`.
            // Likely the Card Mint itself? Or the payment mint?
            // Usually it burns resources. But the IDL accounts naming is generic `mint`.
            // Since we only pass one mint, it might be the card mint (to update metadata?) or resource mint.
            // Given typical games: you burn Gold to upgrade. 
            // BUT `upgrade_card` in IDL takes `mint`. 
            // Let's assume it's the Card Mint for now.
            const tx = await upgradeCard(parseInt(cardId), new PublicKey(TEST_TOKENS.ARCHER_MINT));
            toast.success(`Card Upgraded: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    const handleSetDeck = async () => {
        const deck = deckString.split(",").map(n => parseInt(n.trim()));
        if (deck.length !== 8) return toast.error("Deck must have 8 cards");

        const toastId = toast.loading("Setting Deck...");
        try {
            // setDeck takes `mint`? 
            // Possibly to verify ownership of the cards in the deck? 
            // If it takes a single mint, does it mean all cards must be of that collection?
            // For testing, we pass the Archer mint.
            const tx = await setDeck(deck, new PublicKey(TEST_TOKENS.ARCHER_MINT));
            toast.success(`Deck Set: ${tx}`, { id: toastId });
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };

    return (
        <TestSection title="Deck & Card Management">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Manage Card</h3>
                        <input
                            type="number"
                            placeholder="Card ID"
                            value={cardId}
                            onChange={(e) => setCardId(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleUnlock} disabled={isLoading} className="flex-1 bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                                Unlock
                            </button>
                            <button onClick={handleUpgrade} disabled={isLoading} className="flex-1 bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                                Upgrade
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded">
                        <h3 className="font-semibold">Set Deck</h3>
                        <input
                            type="text"
                            placeholder="0,1,2,3,4,5,6,7"
                            value={deckString}
                            onChange={(e) => setDeckString(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <button onClick={handleSetDeck} disabled={isLoading} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
                            Set Deck
                        </button>
                    </div>
                </div>
            </div>
        </TestSection>
    );
}
