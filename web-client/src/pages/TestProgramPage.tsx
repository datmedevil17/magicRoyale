import React, { useState } from "react";
import { useGameProgram } from "../hooks/use-game-program";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { MINT_CONFIG } from "../game/config/MintConfig";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #444", borderRadius: "8px", backgroundColor: "#1a1a1a" }}>
        <h3 style={{ marginTop: 0, borderBottom: "1px solid #555", paddingBottom: "5px" }}>{title}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>{children}</div>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div style={{ display: "flex", flexDirection: "column", minWidth: "200px" }}>
        <label style={{ fontSize: "12px", marginBottom: "4px", color: "#aaa" }}>{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #666", backgroundColor: "#333", color: "white" }}
        />
    </div>
);

export const TestProgramPage = () => {
    const { connected } = useWallet();
    const gameProgram = useGameProgram();
    const [logs, setLogs] = useState<{ msg: string; type: "info" | "success" | "error"; tx?: string }[]>([]);
    const [battleInfo, setBattleInfo] = useState<{ address: string, baseOwner: string, erOwner: string, is2v2?: boolean }[]>([]);

    const updateBattleInfo = async (currentId: string) => {
        if (!gameProgram.program) return;
        try {
            const id = new BN(currentId);
            const idBuffer = id.toArrayLike(Buffer, "le", 8);

            // Derive PDAs
            const pda1v1 = PublicKey.findProgramAddressSync([Buffer.from("battle"), idBuffer], gameProgram.program.programId)[0];
            const pda2v2 = PublicKey.findProgramAddressSync([Buffer.from("battle2v2"), idBuffer], gameProgram.program.programId)[0];

            const fetchInfo = async (pda: PublicKey, is2v2: boolean) => {
                const baseInfo = await gameProgram.fetchAccountInfo(pda, false);
                const erInfo = await gameProgram.fetchAccountInfo(pda, true);
                if (!baseInfo && !erInfo) return null;
                return {
                    address: pda.toBase58(),
                    baseOwner: baseInfo?.owner || "Not Created",
                    erOwner: erInfo?.owner || "Not Created",
                    is2v2
                };
            };

            const info1v1 = await fetchInfo(pda1v1, false);
            const info2v2 = await fetchInfo(pda2v2, true);

            setBattleInfo([info1v1, info2v2].filter(v => v !== null) as any);
        } catch (err) {
            console.error("Error updating battle info:", err);
        }
    };

    // State for inputs
    const [gameId, setGameId] = useState("12345");
    const [username, setUsername] = useState("testuser");
    const [cardIdx, setCardIdx] = useState("0");
    const [x, setX] = useState("10");
    const [y, setY] = useState("20");
    const [winnerIdx, setWinnerIdx] = useState("0");
    const [mintAddr, setMintAddr] = useState("");
    const [clanName, setClanName] = useState("testclan");
    const [targetAddr, setTargetAddr] = useState("");

    const addLog = (msg: string, type: "info" | "success" | "error" = "info", tx?: string) => {
        setLogs(prev => [{ msg, type, tx }, ...prev].slice(0, 50));
    };

    const handleAction = async (name: string, action: () => Promise<any>) => {
        addLog(`Starting ${name}...`, "info");
        try {
            const result = await action();
            addLog(`${name} SUCCESS`, "success", typeof result === 'string' ? result : undefined);
            console.log(`${name} Result:`, result);
            // Refresh ownership info
            if (["createGame", "joinGame", "delegateGame", "endGame", "commitBattle"].includes(name)) {
                await updateBattleInfo(gameId);
            }
        } catch (err: any) {
            addLog(`${name} ERROR: ${err.message}`, "error");
            console.error(`${name} Error:`, err);
        }
    };

    const autoFill = (type: string) => {
        switch (type) {
            case "giant":
                setMintAddr(MINT_CONFIG.Giant.toString());
                setCardIdx("1");
                break;
            case "archer":
                setMintAddr(MINT_CONFIG.Archer.toString());
                setCardIdx("5");
                break;
            case "gold":
                setMintAddr(MINT_CONFIG.GOLD.toString());
                break;
            case "gems":
                setMintAddr(MINT_CONFIG.GEMS.toString());
                break;
            case "random_game":
                setGameId(Math.floor(Math.random() * 1000000).toString());
                break;
        }
        addLog(`Auto-filled ${type} preset`, "info");
    };

    if (!connected) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#121212", color: "white" }}>
                <h1>Program Test Page</h1>
                <p>Please connect your wallet to continue</p>
                <WalletMultiButton />
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", display: "flex", gap: "20px", height: "100vh", backgroundColor: "#121212", color: "white", boxSizing: "border-box" }}>
            {/* Controls */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h1>Program Test Page</h1>
                    <WalletMultiButton />
                </div>

                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#2d2d2d", borderRadius: "8px", borderLeft: "4px solid #4CAF50" }}>
                    <h3 style={{ marginTop: 0 }}>🚀 Recommended Testing Flow</h3>
                    <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                        <li><strong>Initialize</strong>: Click <code style={{ color: "#81c784" }}>Initialize Player</code> (only once per wallet).</li>
                        <li><strong>Session</strong>: Click <code style={{ color: "#81c784" }}>Create Session</code> (enables fast ER moves).</li>
                        <li><strong>Start</strong>: Click <code style={{ color: "#ffb74d" }}>Random ID</code> then <code style={{ color: "#81c784" }}>Create Game</code>.</li>
                        <li><strong>Delegate</strong>: Click <code style={{ color: "#81c784" }}>Delegate Game</code> (moves game to ER).</li>
                        <li><strong>Combat</strong>: Click <code style={{ color: "#64b5f6" }}>Deploy Troop</code> (uses ER + Session Key).</li>
                        <li><strong>End ER</strong>: Click <code style={{ color: "#e57373" }}>End Game (ER)</code> (finalize on ER using Session Key).</li>
                        <li><strong>Commit L1</strong>: Click <code style={{ color: "#ba68c8" }}>Commit Battle (L1)</code> (moves state back to Solana L1).</li>
                        <li><strong>Reward</strong>: Click <code style={{ color: "#ffd54f" }}>Mint Trophies</code> (requires L1 commitment).</li>
                        <hr style={{ border: "0.5px solid #444", margin: "10px 0" }} />
                        <li><strong>2v2 Flow</strong>: Use the new 2v2 sections below to test 2v2 lifecycle and deployment using the same logic.</li>
                    </ol>
                </div>

                {battleInfo.length > 0 && (
                    <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {battleInfo.map((info, i) => (
                            <div key={i} style={{ padding: "15px", backgroundColor: "#333", borderRadius: "8px", border: "1px solid #555" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <h3 style={{ margin: 0 }}>🔍 {info.is2v2 ? "2v2" : "1v1"} Battle PDA</h3>
                                    <button onClick={() => updateBattleInfo(gameId)} style={{ fontSize: "12px", padding: "4px 8px" }}>🔄</button>
                                </div>
                                <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#aaa" }}>Address:</span>
                                        <span style={{ fontFamily: "monospace", color: "#64b5f6" }}>{info.address}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#aaa" }}>L1 Owner:</span>
                                        <span style={{
                                            fontFamily: "monospace",
                                            color: info.baseOwner.startsWith("DELeGG") ? "#ffb74d" : info.baseOwner === "Not Created" ? "#ef5350" : "#81c784"
                                        }}>
                                            {info.baseOwner}
                                            {info.baseOwner.startsWith("DELeGG") ? " (Delegated)" : ""}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#aaa" }}>ER Owner:</span>
                                        <span style={{
                                            fontFamily: "monospace",
                                            color: info.erOwner.startsWith("DELeGG") ? "#ffb74d" : info.erOwner === "Not Created" ? "#ef5350" : "#81c784"
                                        }}>
                                            {info.erOwner}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Section title="Presets (Auto-fill)">
                    <button onClick={() => autoFill("giant")} style={{ background: "#388e3c" }}>Giant Preset</button>
                    <button onClick={() => autoFill("archer")} style={{ background: "#388e3c" }}>Archer Preset</button>
                    <button onClick={() => autoFill("gold")} style={{ background: "#0288d1" }}>Gold Mint</button>
                    <button onClick={() => autoFill("gems")} style={{ background: "#0288d1" }}>Gems Mint</button>
                    <button onClick={() => autoFill("random_game")} style={{ background: "#f57c00" }}>Random Game ID</button>
                </Section>

                <Section title="Common Inputs">
                    <InputGroup label="Game ID" value={gameId} onChange={setGameId} />
                    <InputGroup label="Username" value={username} onChange={setUsername} />
                    <InputGroup label="Mint Address" value={mintAddr} onChange={setMintAddr} />
                    <InputGroup label="Clan Name" value={clanName} onChange={setClanName} />
                    <InputGroup label="Target Address (Pubkey)" value={targetAddr} onChange={setTargetAddr} />
                </Section>

                <Section title="Player Profile">
                    <button onClick={() => handleAction("initializePlayer", () => gameProgram.initializePlayer(username))}>Initialize Player</button>
                    <button onClick={() => handleAction("createSession", () => gameProgram.createSession())}>Create Session</button>
                </Section>

                <Section title="Game Lifecycle (1v1)">
                    <button onClick={() => handleAction("createGame", () => gameProgram.createGame(new BN(gameId)))}>Create Game</button>
                    <button onClick={() => handleAction("joinGame", () => gameProgram.joinGame(new BN(gameId)))}>Join Game</button>
                    <button onClick={() => handleAction("delegateGame", () => gameProgram.delegateGame(new BN(gameId)))}>Delegate Game</button>
                    <div style={{ width: "100%", display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                        <InputGroup label="Winner Index (0/1)" value={winnerIdx} onChange={setWinnerIdx} />
                        <button onClick={() => handleAction("endGame", () => gameProgram.endGame(new BN(gameId), parseInt(winnerIdx)))} style={{ background: "#c62828" }}>End Game (ER)</button>
                        <button onClick={() => handleAction("commitBattle", () => gameProgram.commitBattle(new BN(gameId)))} style={{ background: "#7b1fa2" }}>Commit Battle (L1)</button>
                    </div>
                    <button onClick={() => handleAction("mintTrophies", () => gameProgram.mintTrophies(new BN(gameId), new PublicKey(mintAddr)))} disabled={!mintAddr}>Mint Trophies</button>
                </Section>

                <Section title="Game Lifecycle (2v2)">
                    <button onClick={() => handleAction("createGame2v2", () => gameProgram.createGame2v2(new BN(gameId)))} style={{ border: "1px solid #4CAF50" }}>Create Game 2v2</button>
                    <button onClick={() => handleAction("joinGame2v2", () => gameProgram.joinGame2v2(new BN(gameId)))} style={{ border: "1px solid #4CAF50" }}>Join Game 2v2</button>
                    <button onClick={() => handleAction("delegateGame2v2", () => gameProgram.delegateGame2v2(new BN(gameId)))} style={{ border: "1px solid #4CAF50" }}>Delegate Game 2v2</button>
                    <div style={{ width: "100%", display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                        <button onClick={() => handleAction("endGame2v2", () => gameProgram.endGame2v2(new BN(gameId), parseInt(winnerIdx)))} style={{ background: "#d32f2f" }}>End Game 2v2 (ER)</button>
                        <button onClick={() => handleAction("commitBattle2v2", () => gameProgram.commitBattle2v2(new BN(gameId)))} style={{ background: "#9c27b0" }}>Commit Battle 2v2 (L1)</button>
                    </div>
                    <button onClick={() => handleAction("mintTrophies2v2", () => gameProgram.mintTrophies2v2(new BN(gameId), new PublicKey(mintAddr)))} disabled={!mintAddr} style={{ border: "1px solid #FFD700" }}>Mint Trophies 2v2</button>
                </Section>

                <Section title="Combat (ER)">
                    <InputGroup label="Card Index" value={cardIdx} onChange={setCardIdx} />
                    <InputGroup label="X" value={x} onChange={setX} />
                    <InputGroup label="Y" value={y} onChange={setY} />
                    <div style={{ width: "100%", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button onClick={() => handleAction("deployTroop", () => gameProgram.deployTroop(new BN(gameId), parseInt(cardIdx), parseInt(x), parseInt(y)))}>Deploy Troop (1v1)</button>
                        <button onClick={() => handleAction("deployTroop2v2", () => gameProgram.deployTroop2v2(new BN(gameId), parseInt(cardIdx), parseInt(x), parseInt(y)))} style={{ border: "1px solid #64b5f6" }}>Deploy Troop (2v2)</button>
                    </div>
                </Section>

                <Section title="Cards">
                    <button onClick={() => handleAction("unlockCard", () => gameProgram.unlockCard(parseInt(cardIdx), new PublicKey(mintAddr)))} disabled={!mintAddr}>Unlock Card</button>
                    <button onClick={() => handleAction("upgradeCard", () => gameProgram.upgradeCard(parseInt(cardIdx), new PublicKey(mintAddr)))} disabled={!mintAddr}>Upgrade Card</button>
                    <button onClick={() => handleAction("setDeck", () => gameProgram.setDeck([parseInt(cardIdx)], new PublicKey(mintAddr)))} disabled={!mintAddr}>Set Deck (Single Card)</button>
                </Section>

                <Section title="Clan">
                    <button onClick={() => handleAction("createClan", () => gameProgram.createClan(clanName))}>Create Clan</button>
                    <button onClick={() => handleAction("joinClan", () => gameProgram.joinClan(new PublicKey(targetAddr)))} disabled={!targetAddr}>Join Clan</button>
                    <button onClick={() => handleAction("requestCards", () => gameProgram.requestCards(new PublicKey(targetAddr), parseInt(cardIdx)))} disabled={!targetAddr}>Request Cards</button>
                    <button onClick={() => handleAction("donateCards", () => gameProgram.donateCards(new PublicKey(targetAddr), new PublicKey(targetAddr), new PublicKey(mintAddr)))} disabled={!targetAddr || !mintAddr}>Donate Cards (Test)</button>
                </Section>

                <Section title="NFT & Resources">
                    <button onClick={() => handleAction("exportNft", () => gameProgram.exportNft(parseInt(cardIdx), new PublicKey(mintAddr)))} disabled={!mintAddr}>Export NFT</button>
                    <button onClick={() => handleAction("exportResource", () => gameProgram.exportResource(parseInt(cardIdx), 10, new PublicKey(mintAddr), new PublicKey(targetAddr)))} disabled={!mintAddr || !targetAddr}>Export Resource (10)</button>
                </Section>
            </div>

            {/* Logs */}
            <div style={{ width: "400px", display: "flex", flexDirection: "column", borderLeft: "1px solid #444", paddingLeft: "20px" }}>
                <h2>Transaction Logs</h2>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{
                            padding: "10px",
                            borderRadius: "4px",
                            border: `1px solid ${log.type === "success" ? "#2e7d32" : log.type === "error" ? "#c62828" : "#0277bd"}`,
                            backgroundColor: log.type === "success" ? "#1b5e20" : log.type === "error" ? "#b71c1c" : "#01579b",
                            opacity: i === 0 ? 1 : 0.7
                        }}>
                            <div>{log.msg}</div>
                            {log.tx && (
                                <a
                                    href={`https://solscan.io/tx/${log.tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#90caf9", wordBreak: "break-all", display: "block", marginTop: "5px" }}
                                >
                                    View on Solscan
                                </a>
                            )}
                        </div>
                    ))}
                    {logs.length === 0 && <p style={{ color: "#666", textAlign: "center" }}>No logs yet</p>}
                </div>
                <button onClick={() => setLogs([])} style={{ marginTop: "10px", padding: "8px" }}>Clear Logs</button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                button {
                    background: #444;
                    color: white;
                    border: 1px solid #666;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s, opacity 0.2s;
                }
                button:hover:not(:disabled) {
                    filter: brightness(1.2);
                }
                button:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                button:active:not(:disabled) {
                    transform: translateY(1px);
                }
                code {
                    background: #000;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
            `}} />
        </div>
    );
};
