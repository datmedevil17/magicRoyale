
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./index.css";
import { TestLayout } from "./components/test-ui/TestLayout";
import { PlayerSection } from "./components/test-ui/PlayerSection";
import { ClanSection } from "./components/test-ui/ClanSection";
import { DeckSection } from "./components/test-ui/DeckSection";
import { SessionSection } from "./components/test-ui/SessionSection";
import { GameSection } from "./components/test-ui/GameSection";
import { useWallet } from "@solana/wallet-adapter-react";

export function App() {
  const { publicKey } = useWallet();

  return (
    <TestLayout>
      {!publicKey ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Connect Wallet to Begin Testing</h2>
          <p className="text-gray-500">You need to connect a Solana wallet to interact with the game.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <PlayerSection />
          <SessionSection />
          <DeckSection />
          <ClanSection />
          <GameSection />
        </div>
      )}
    </TestLayout>
  );
}

export default App;
