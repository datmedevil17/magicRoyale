import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { type GameCore } from "../idl/game_core";
import IDL from "../idl/game_core.json";
import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { MINT_CONFIG } from "../game/config/MintConfig";

// Ephemeral Rollup endpoints - configurable via environment
const ER_ENDPOINT = "https://devnet.magicblock.app";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app";
const API_URL = "http://localhost:3000";

const DELEGATION_PROGRAM_ID = new PublicKey(
    "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);

// Helper: derive the battle PDA from a u64 gameId
export const getBattlePda = (gameId: BN, programId: PublicKey): PublicKey => {
    const idBuffer = gameId.toArrayLike(Buffer, "le", 8);
    return PublicKey.findProgramAddressSync(
        [Buffer.from("battle"), idBuffer],
        programId
    )[0];
};

// Helper: derive the battle 2v2 PDA from a u64 gameId
export const getBattle2v2Pda = (gameId: BN, programId: PublicKey): PublicKey => {
    const idBuffer = gameId.toArrayLike(Buffer, "le", 8);
    return PublicKey.findProgramAddressSync(
        [Buffer.from("battle2v2"), idBuffer],
        programId
    )[0];
};

// Helper: derive player profile PDA
const getPlayerProfilePda = (authority: PublicKey, programId: PublicKey): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("player"), authority.toBuffer()],
        programId
    )[0];
};

const getClanPda = (name: string, programId: PublicKey): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("clan"), Buffer.from(name)],
        programId
    )[0];
};

const getClanMemberPda = (
    clan: PublicKey,
    authority: PublicKey,
    programId: PublicKey
): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("clan_member"), clan.toBuffer(), authority.toBuffer()],
        programId
    )[0];
};

const getRequestPda = (
    clan: PublicKey,
    requesterAuthority: PublicKey,
    programId: PublicKey
): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("request"), clan.toBuffer(), requesterAuthority.toBuffer()],
        programId
    )[0];
};

export type DelegationStatus = "undelegated" | "delegated" | "checking";

export interface CardProgress {
    cardId: number;
    level: number;
    xp: number;
    amount: number;
}

export interface PlayerProfile {
    authority: PublicKey;
    mmr: number;
    deck: number[];
    inventory: CardProgress[];
    username: string;
    trophies: number;
}

/**
 * Hook to interact with the Game Core program on Solana.
 * Supports MagicBlock Ephemeral Rollups for high-frequency actions.
 */
export function useGameProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [playerProfilePda, setPlayerProfilePda] = useState<PublicKey | null>(null);
    const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Base layer Anchor provider and program
    const program = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }

        const provider = new AnchorProvider(
            connection,
            {
                publicKey: wallet.publicKey,
                signTransaction: wallet.signTransaction,
                signAllTransactions: wallet.signAllTransactions,
            },
            { commitment: "confirmed" }
        );

        setProvider(provider);

        return new Program<GameCore>(IDL as unknown as GameCore, provider);
    }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    // Ephemeral Rollup connection and provider
    const erConnection = useMemo(() => {
        return new Connection(ER_ENDPOINT, {
            wsEndpoint: ER_WS_ENDPOINT,
            commitment: "confirmed",
        });
    }, []);

    const erProvider = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }

        return new AnchorProvider(
            erConnection,
            {
                publicKey: wallet.publicKey,
                signTransaction: wallet.signTransaction,
                signAllTransactions: wallet.signAllTransactions,
            },
            { commitment: "confirmed" }
        );
    }, [erConnection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    const erProgram = useMemo(() => {
        if (!erProvider) return null;
        return new Program<GameCore>(IDL as unknown as GameCore, erProvider);
    }, [erProvider]);

    // Session Key Manager
    const sdkWallet = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }
        return {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
            signAllTransactions: wallet.signAllTransactions,
        };
    }, [wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    const sessionWallet = useSessionKeyManager(
        sdkWallet as any,
        connection,
        "devnet"
    );

    const { sessionToken, createSession: sdkCreateSession } = sessionWallet;

    const createSession = useCallback(async () => {
        return await sdkCreateSession(new PublicKey(IDL.address));
    }, [sdkCreateSession]);

    // Derive PDAs
    useEffect(() => {
        if (wallet.publicKey && program) {
            const pda = getPlayerProfilePda(wallet.publicKey, program.programId);
            setPlayerProfilePda(pda);
        } else {
            setPlayerProfilePda(null);
        }
    }, [wallet.publicKey, program]);

    useEffect(() => {
        if (playerProfilePda && program) {
            program.account.playerProfile.fetch(playerProfilePda)
                .then(setPlayerProfile as any)
                .catch(() => setPlayerProfile(null));
        } else {
            setPlayerProfile(null);
        }
    }, [playerProfilePda, program]);

    // ─── Initialize Player (Base Layer) ───────────────────────────────────────

    const initializePlayer = useCallback(
        async (username: string): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .initializePlayer(username)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        authority: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Create Game (Base Layer) ─────────────────────────────────────────────
    // Player One creates a game with a given gameId. The battle PDA is derived
    // from the gameId seed automatically by Anchor.

    const createGame = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .createGame(gameId)
                    .accounts({
                        battle: getBattlePda(gameId, program.programId),
                        playerOneProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        playerOne: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Join Game (Base Layer) ───────────────────────────────────────────────
    // Player Two joins an existing game by its gameId.

    const joinGame = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .joinGame(gameId)
                    .accounts({
                        battle: getBattlePda(gameId, program.programId),
                        playerTwoProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        playerTwo: wallet.publicKey,
                    } as any)
                    .rpc();
                console.log(`[joinGame] Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Create Game 2v2 (Base Layer) ─────────────────────────────────────────

    const createGame2v2 = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .createGame2v2(gameId)
                    .accounts({
                        battle: getBattle2v2Pda(gameId, program.programId),
                        playerOneProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        playerOne: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Join Game 2v2 (Base Layer) ───────────────────────────────────────────

    const joinGame2v2 = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .joinGame2v2(gameId)
                    .accounts({
                        battle: getBattle2v2Pda(gameId, program.programId),
                        playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        player: wallet.publicKey,
                    } as any)
                    .rpc();
                console.log(`[joinGame2v2] Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Delegate Game (Base Layer) ───────────────────────────────────────────
    // Delegates the battle PDA to the Ephemeral Rollup.

    const delegateGame = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const battlePda = getBattlePda(gameId, program.programId);

                const [delegationRecordPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("delegation"), battlePda.toBuffer()],
                    DELEGATION_PROGRAM_ID
                );
                const [delegationMetadataPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("delegation-metadata"), battlePda.toBuffer()],
                    DELEGATION_PROGRAM_ID
                );
                // bufferPda is derived inside the program, but we pass `pda` = battlePda
                // Anchor resolves `buffer_pda` automatically via the IDL seeds.

                const tx = await program.methods
                    .delegateGame(gameId)
                    .accounts({
                        payer: wallet.publicKey,
                        pda: battlePda,
                        // Following derived automatically by Anchor 0.30+ IDL if seeds are in IDL
                        // but keeping explicit if needed for compatibility
                        delegationRecordPda,
                        delegationMetadataPda,
                        delegationProgram: DELEGATION_PROGRAM_ID,
                        ownerProgram: program.programId,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                console.error("Delegation Error:", err);
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Delegate Game 2v2 (Base Layer) ───────────────────────────────────────

    const delegateGame2v2 = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const battlePda = getBattle2v2Pda(gameId, program.programId);

                const [delegationRecordPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("delegation"), battlePda.toBuffer()],
                    DELEGATION_PROGRAM_ID
                );
                const [delegationMetadataPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("delegation-metadata"), battlePda.toBuffer()],
                    DELEGATION_PROGRAM_ID
                );

                const tx = await program.methods
                    .delegateGame2v2(gameId)
                    .accounts({
                        payer: wallet.publicKey,
                        pda: battlePda,
                        delegationRecordPda,
                        delegationMetadataPda,
                        delegationProgram: DELEGATION_PROGRAM_ID,
                        ownerProgram: program.programId,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                console.error("Delegation Error 2v2:", err);
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Deploy Troop (ER – High Frequency) ──────────────────────────────────
    // Sends a troop deployment via the Ephemeral Rollup.
    // gameId is a u64 arg; the battle PDA is derived on-chain from that seed.

    const deployTroop = useCallback(
        async (
            gameId: BN,
            cardIdx: number,
            x: number,
            y: number
        ): Promise<string> => {
            if (!program || !erProvider || !wallet.publicKey)
                throw new Error("Game not ready");
            setIsLoading(true);
            try {
                let hasSession = sessionToken != null && sessionWallet != null;
                const sessionPubkey = sessionToken ? new PublicKey(sessionToken) : null;

                if (hasSession && sessionPubkey) {
                    // Contract requirement: The session_token PDA account MUST exist on-chain.
                    // If it hasn't been created yet or expired/closed, fall back to main wallet
                    // otherwise Anchor will throw "AccountNotInitialized" or "AccountNotFound"
                    const sessionInfo = await erConnection.getAccountInfo(sessionPubkey);
                    if (!sessionInfo) {
                        console.warn("Session token PDA not found on-chain, falling back to main wallet");
                        hasSession = false;
                    }
                }

                const signer = hasSession
                    ? sessionWallet!.publicKey
                    : wallet.publicKey;

                const accounts: any = {
                    signer,
                    battle: getBattlePda(gameId, program.programId),
                    playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    sessionToken: hasSession && sessionPubkey ? sessionPubkey : null,
                };

                let tx = await program.methods
                    .deployTroop(gameId, cardIdx, x, y)
                    .accounts(accounts)
                    .transaction();

                tx.feePayer = signer || undefined;
                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

                if (hasSession && sessionWallet && sessionWallet.signTransaction) {
                    // @ts-ignore
                    tx = await sessionWallet.signTransaction(tx);
                } else {
                    tx = await erProvider.wallet.signTransaction(tx);
                }

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                    skipPreflight: true,
                });

                console.log(`[deployTroop] Transaction Hash: https://solscan.io/tx/${txHash}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);

                // Removed await erConnection.confirmTransaction(txHash, "confirmed") to eliminate latency

                return txHash;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet]
    );

    // ─── Deploy Troop 2v2 (ER – High Frequency) ──────────────────────────────

    const deployTroop2v2 = useCallback(
        async (
            gameId: BN,
            cardIdx: number,
            x: number,
            y: number
        ): Promise<string> => {
            if (!program || !erProvider || !wallet.publicKey)
                throw new Error("Game not ready");
            setIsLoading(true);
            try {
                let hasSession = sessionToken != null && sessionWallet != null;
                const sessionPubkey = sessionToken ? new PublicKey(sessionToken) : null;

                if (hasSession && sessionPubkey) {
                    const sessionInfo = await erConnection.getAccountInfo(sessionPubkey);
                    if (!sessionInfo) {
                        hasSession = false;
                    }
                }

                const signer = hasSession
                    ? sessionWallet!.publicKey
                    : wallet.publicKey;

                const accounts: any = {
                    signer,
                    battle: getBattle2v2Pda(gameId, program.programId),
                    playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    sessionToken: hasSession && sessionPubkey ? sessionPubkey : null,
                };

                let tx = await program.methods
                    .deployTroop2v2(gameId, cardIdx, x, y)
                    .accounts(accounts)
                    .transaction();

                tx.feePayer = signer || undefined;
                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

                if (hasSession && sessionWallet && sessionWallet.signTransaction) {
                    // @ts-ignore
                    tx = await sessionWallet.signTransaction(tx);
                } else {
                    tx = await erProvider.wallet.signTransaction(tx);
                }

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                    skipPreflight: true,
                });

                console.log(`[deployTroop2v2] Transaction Hash: https://solscan.io/tx/${txHash}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);

                return txHash;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet]
    );

    // ─── End Game (ER) ────────────────────────────────────────────────────────
    // Called on the Ephemeral Rollup to finalize and undelegate the battle state.
    // `isTimeout` = true if the game timed out, false if a winner was determined.

    const endGame = useCallback(
        async (gameId: BN, winnerIdx: number): Promise<string> => {
            if (!program || !erProvider || !wallet.publicKey)
                throw new Error("Wallet not connected / ER not ready");
            setIsLoading(true);
            try {
                let hasSession = sessionToken != null && sessionWallet != null;
                const sessionPubkey = sessionToken ? new PublicKey(sessionToken) : null;

                if (hasSession && sessionPubkey) {
                    const sessionInfo = await erConnection.getAccountInfo(sessionPubkey);
                    if (!sessionInfo) {
                        console.warn("Session token PDA not found on-chain, falling back to main wallet");
                        hasSession = false;
                    }
                }

                const signer = hasSession
                    ? sessionWallet!.publicKey
                    : wallet.publicKey;

                const accounts: any = {
                    signer,
                    battle: getBattlePda(gameId, program.programId),
                    playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    sessionToken: hasSession && sessionPubkey ? sessionPubkey : null,
                };

                let tx = await program.methods
                    .endGame(gameId, winnerIdx)
                    .accounts(accounts)
                    .transaction();

                tx.feePayer = signer || undefined;
                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

                if (hasSession && sessionWallet && sessionWallet.signTransaction) {
                    // @ts-ignore
                    tx = await sessionWallet.signTransaction(tx);
                } else {
                    tx = await erProvider.wallet.signTransaction(tx);
                }

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                    skipPreflight: true,
                });
                await erConnection.confirmTransaction(txHash, "confirmed");

                console.log(`[endGame] Transaction Hash: https://solscan.io/tx/${txHash}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);

                return txHash;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet]
    );

    // ─── End Game 2v2 (ER) ──────────────────────────────────────────────────

    const endGame2v2 = useCallback(
        async (gameId: BN, winnerIdx: number): Promise<string> => {
            if (!program || !erProvider || !wallet.publicKey)
                throw new Error("Wallet not connected / ER not ready");
            setIsLoading(true);
            try {
                let hasSession = sessionToken != null && sessionWallet != null;
                const sessionPubkey = sessionToken ? new PublicKey(sessionToken) : null;

                if (hasSession && sessionPubkey) {
                    const sessionInfo = await erConnection.getAccountInfo(sessionPubkey);
                    if (!sessionInfo) {
                        hasSession = false;
                    }
                }

                const signer = hasSession
                    ? sessionWallet!.publicKey
                    : wallet.publicKey;

                const accounts: any = {
                    signer,
                    battle: getBattle2v2Pda(gameId, program.programId),
                    playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    sessionToken: hasSession && sessionPubkey ? sessionPubkey : null,
                };

                let tx = await program.methods
                    .endGame2v2(gameId, winnerIdx)
                    .accounts(accounts)
                    .transaction();

                tx.feePayer = signer || undefined;
                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

                if (hasSession && sessionWallet && sessionWallet.signTransaction) {
                    // @ts-ignore
                    tx = await sessionWallet.signTransaction(tx);
                } else {
                    tx = await erProvider.wallet.signTransaction(tx);
                }

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                    skipPreflight: true,
                });
                await erConnection.confirmTransaction(txHash, "confirmed");

                console.log(`[endGame2v2] Transaction Hash: https://solscan.io/tx/${txHash}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);

                return txHash;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet]
    );

    const commitBattle = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!erProgram || !program || !wallet.publicKey) throw new Error("Wallet not connected or ER not ready");
            setIsLoading(true);
            try {
                const battlePda = getBattlePda(gameId, program.programId);

                const tx = await erProgram.methods
                    .commitBattle(gameId)
                    .accounts({
                        payer: wallet.publicKey,
                        battle: battlePda,
                    } as any)
                    .rpc();

                console.log(`[commitBattle] ER Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [erProgram, program, wallet.publicKey]
    );

    const commitBattle2v2 = useCallback(
        async (gameId: BN): Promise<string> => {
            if (!erProgram || !program || !wallet.publicKey) throw new Error("Wallet not connected or ER not ready");
            setIsLoading(true);
            try {
                const idBuffer = gameId.toArrayLike(Buffer, "le", 8);
                const [battlePda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("battle2v2"), idBuffer],
                    program.programId
                );

                const tx = await erProgram.methods
                    .commitBattle2v2(gameId)
                    .accounts({
                        payer: wallet.publicKey,
                        battle: battlePda,
                    } as any)
                    .rpc();

                console.log(`[commitBattle2v2] ER Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [erProgram, program, wallet.publicKey]
    );

    // ─── Mint Trophies (Base Layer) ───────────────────────────────────────────
    // Called after endGame has committed back to base. Mints trophy tokens
    // for the calling player if they were the winner.

    const mintTrophies = useCallback(
        async (gameId: BN, mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const destination = getAssociatedTokenAddressSync(mint, wallet.publicKey);

                const preInstructions = [];
                const destInfo = await connection.getAccountInfo(destination);
                if (!destInfo) {
                    preInstructions.push(
                        createAssociatedTokenAccountInstruction(
                            wallet.publicKey,
                            destination,
                            wallet.publicKey,
                            mint
                        )
                    );
                }

                const tx = await program.methods
                    .mintTrophies(gameId)
                    .accounts({
                        battle: getBattlePda(gameId, program.programId),
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        destination,
                        mintAuthority: PublicKey.findProgramAddressSync(
                            [Buffer.from("mint_authority")],
                            program.programId
                        )[0],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        signer: wallet.publicKey,
                    } as any)
                    .preInstructions(preInstructions)
                    .rpc();
                console.log(`[mintTrophies] Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey, connection]
    );

    // ─── Mint Trophies 2v2 (Base Layer) ───────────────────────────────────────

    const mintTrophies2v2 = useCallback(
        async (gameId: BN, mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const destination = getAssociatedTokenAddressSync(mint, wallet.publicKey);

                const preInstructions = [];
                const destInfo = await connection.getAccountInfo(destination);
                if (!destInfo) {
                    preInstructions.push(
                        createAssociatedTokenAccountInstruction(
                            wallet.publicKey,
                            destination,
                            wallet.publicKey,
                            mint
                        )
                    );
                }

                const tx = await program.methods
                    .mintTrophies2v2(gameId)
                    .accounts({
                        battle: getBattle2v2Pda(gameId, program.programId),
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        destination,
                        mintAuthority: PublicKey.findProgramAddressSync(
                            [Buffer.from("mint_authority")],
                            program.programId
                        )[0],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        signer: wallet.publicKey,
                    } as any)
                    .preInstructions(preInstructions)
                    .rpc();
                console.log(`[mintTrophies2v2] Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey, connection]
    );

    // ─── Unlock Card (Base Layer) ─────────────────────────────────────────────

    const unlockCard = useCallback(
        async (cardId: number, mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

                const preInstructions = [];
                const ataInfo = await connection.getAccountInfo(ata);
                if (!ataInfo) {
                    preInstructions.push(
                        createAssociatedTokenAccountInstruction(
                            wallet.publicKey,
                            ata,
                            wallet.publicKey,
                            mint
                        )
                    );
                }

                const tx = await program.methods
                    .unlockCard(cardId)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        userTokenAccount: ata,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .preInstructions(preInstructions)
                    .rpc();
                console.log(`[unlockCard] Transaction Hash: https://solscan.io/tx/${tx}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`);
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey, connection]
    );

    // ─── Upgrade Card (Base Layer) ────────────────────────────────────────────

    const upgradeCard = useCallback(
        async (cardId: number, mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

                const tx = await program.methods
                    .upgradeCard(cardId)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        userTokenAccount: ata,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Set Deck (Base Layer) ────────────────────────────────────────────────

    const setDeck = useCallback(
        async (newDeck: number[], mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const userTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
                const tx = await program.methods
                    .setDeck(newDeck as any)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        userTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Create Clan (Base Layer) ─────────────────────────────────────────────

    const createClan = useCallback(
        async (name: string): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const clanPda = getClanPda(name, program.programId);
                const tx = await program.methods
                    .createClan(name)
                    .accounts({
                        clan: clanPda,
                        clanMember: getClanMemberPda(clanPda, wallet.publicKey, program.programId),
                        authority: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Join Clan (Base Layer) ───────────────────────────────────────────────

    const joinClan = useCallback(
        async (clan: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .joinClan()
                    .accounts({
                        clan,
                        clanMember: getClanMemberPda(clan, wallet.publicKey, program.programId),
                        authority: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Request Cards (Base Layer) ───────────────────────────────────────────

    const requestCards = useCallback(
        async (clan: PublicKey, cardId: number): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .requestCards(cardId)
                    .accounts({
                        clan,
                        clanMember: getClanMemberPda(clan, wallet.publicKey, program.programId),
                        request: getRequestPda(clan, wallet.publicKey, program.programId),
                        authority: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Donate Cards (Base Layer) ────────────────────────────────────────────

    const donateCards = useCallback(
        async (
            clan: PublicKey,
            requesterProfile: PublicKey,
            mint: PublicKey
        ): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const donorTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);

                const tx = await program.methods
                    .donateCards()
                    .accounts({
                        clan,
                        donorProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        donorMember: getClanMemberPda(clan, wallet.publicKey, program.programId),
                        requesterProfile,
                        // request PDA derived by Anchor from clan + requester_profile.authority
                        mint,
                        donorTokenAccount,
                        mintAuthority: PublicKey.findProgramAddressSync(
                            [Buffer.from("mint_authority")],
                            program.programId
                        )[0],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Export NFT (Base Layer) ──────────────────────────────────────────────

    const exportNft = useCallback(
        async (cardId: number, mint: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
                const [metadata] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("metadata"),
                        METADATA_PROGRAM_ID.toBuffer(),
                        mint.toBuffer()
                    ],
                    METADATA_PROGRAM_ID
                );

                const tx = await program.methods
                    .exportNft(cardId)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        mint,
                        metadata,
                        metadataProgram: METADATA_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Export Resource (Base Layer) ─────────────────────────────────────────

    const exportResource = useCallback(
        async (cardId: number, amount: number, resourceMint: PublicKey, destination: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .exportResource(cardId, amount)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        resourceMint,
                        destination,
                        resourceAuthority: PublicKey.findProgramAddressSync(
                            [Buffer.from("resource_authority")],
                            program.programId
                        )[0],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Import Resource (Base Layer) ─────────────────────────────────────────

    const importResource = useCallback(
        async (cardId: number, amount: number, resourceMint: PublicKey, source: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            try {
                const tx = await program.methods
                    .importResource(cardId, amount)
                    .accounts({
                        profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                        resourceMint,
                        source,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        authority: wallet.publicKey,
                    } as any)
                    .rpc();
                return tx;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ─── Fetch / Read helpers ─────────────────────────────────────────────────

    const fetchPlayerProfile = useCallback(
        async (pda: PublicKey) => {
            if (!program) return null;
            try {
                return await program.account.playerProfile.fetch(pda);
            } catch (err) {
                console.log("Profile not found or error fetching:", err);
                return null;
            }
        },
        [program]
    );

    const fetchBattleState = useCallback(
        async (gameId: BN) => {
            if (!program) return null;
            try {
                const pda = getBattlePda(gameId, program.programId);
                return await program.account.battleState.fetch(pda);
            } catch (err) {
                console.log("Battle not found or error fetching:", err);
                return null;
            }
        },
        [program]
    );

    const fetchBattleState2v2 = useCallback(
        async (gameId: BN) => {
            if (!program) return null;
            try {
                const pda = getBattle2v2Pda(gameId, program.programId);
                return await program.account.battleState2v2.fetch(pda);
            } catch (err) {
                console.log("Battle 2v2 not found or error fetching:", err);
                return null;
            }
        },
        [program]
    );

    const fetchAllClans = useCallback(async () => {
        if (!program) return [];
        try {
            const clans = await program.account.clan.all();
            return clans.map((c) => ({ publicKey: c.publicKey, account: c.account }));
        } catch (err) {
            console.error("Error fetching clans:", err);
            return [];
        }
    }, [program]);

    const fetchUserClan = useCallback(async () => {
        if (!program || !wallet.publicKey) return null;
        try {
            const memberAccounts = await program.account.clanMember.all([
                {
                    memcmp: {
                        offset: 40, // discriminator(8) + clan(32)
                        bytes: wallet.publicKey.toBase58(),
                    },
                },
            ]);

            if (memberAccounts.length > 0) {
                const member = memberAccounts[0];
                const clan = await program.account.clan.fetch(member.account.clan);
                return {
                    memberKey: member.publicKey,
                    memberAccount: member.account,
                    clanKey: member.account.clan,
                    clanAccount: clan,
                };
            }
            return null;
        } catch (err) {
            console.error("Error fetching user clan:", err);
            return null;
        }
    }, [program, wallet.publicKey]);

    const fetchClanMembers = useCallback(async (clan: PublicKey) => {
        if (!program) return [];
        if (!program) return [];
        try {
            const memberAccounts = await program.account.clanMember.all([
                {
                    memcmp: {
                        offset: 8, // discriminator(8)
                        bytes: clan.toBase58(),
                    },
                },
            ]);

            const profiles = await Promise.all(
                memberAccounts.map(async (m) => {
                    try {
                        const profilePda = getPlayerProfilePda(m.account.player, program.programId);
                        const profile = await program.account.playerProfile.fetch(profilePda);
                        return { username: profile.username, trophies: profile.trophies };
                    } catch {
                        return { username: null, trophies: 0 };
                    }
                })
            );

            return memberAccounts.map((m, i) => ({
                publicKey: m.publicKey,
                account: m.account,
                profile: profiles[i],
            }));
        } catch (err) {
            console.error("Error fetching clan members:", err);
            return [];
        }
    }, [program]);

    const leaveClan = useCallback(async () => {
        // No on-chain instruction yet — placeholder
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Mock Leave Clan");
    }, []);

    const fetchAccountInfo = useCallback(
        async (address: PublicKey, useER: boolean = false) => {
            try {
                const conn = useER ? erConnection : connection;
                const info = await conn.getAccountInfo(address, "confirmed");
                return info ? {
                    owner: info.owner.toBase58(),
                    executable: info.executable,
                    lamports: info.lamports,
                    dataSize: info.data.length
                } : null;
            } catch (err) {
                console.error("Error fetching account info:", err);
                return null;
            }
        },
        [connection, erConnection]
    );

    // ─── Platform Token Balance ───────────────────────────────────────────────

    const [platformBalance, setPlatformBalance] = useState<number>(0);

    const fetchPlatformBalance = useCallback(async () => {
        if (!wallet.publicKey) return;
        try {
            const ata = getAssociatedTokenAddressSync(MINT_CONFIG.PLATFORM, wallet.publicKey);
            // Check if the account exists first to avoid noisy JSON-RPC errors
            const accountInfo = await connection.getAccountInfo(ata);
            if (!accountInfo) {
                setPlatformBalance(0);
                return;
            }
            const balance = await connection.getTokenAccountBalance(ata);
            setPlatformBalance(balance.value.uiAmount || 0);
        } catch (err) {
            // If it still fails for any reason, quietly set to 0
            setPlatformBalance(0);
        }
    }, [wallet.publicKey, connection]);

    useEffect(() => {
        fetchPlatformBalance();
    }, [fetchPlatformBalance]);

    // ─── Off-chain Market API (Node Server) ──────────────────────────────────

    const fetchMarketListings = useCallback(async (): Promise<{ cardId: number; price: number }[]> => {
        try {
            const res = await fetch(`${API_URL}/market`);
            if (!res.ok) throw new Error("Failed to fetch market listings");
            return await res.json();
        } catch (err) {
            console.error("Error fetching market:", err);
            return [];
        }
    }, []);

    const addMarketListing = useCallback(
        async (cardId: number, price: number): Promise<boolean> => {
            try {
                const res = await fetch(`${API_URL}/market`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardId, price }),
                });
                if (!res.ok) throw new Error("Failed to add listing");
                return true;
            } catch (err) {
                console.error("Error adding listing:", err);
                return false;
            }
        },
        []
    );

    // ─── Exports ──────────────────────────────────────────────────────────────

    return {
        program,
        erProgram,
        erConnection,
        erProvider,
        isLoading,
        error,
        platformBalance,
        fetchPlatformBalance,
        playerProfilePda,
        playerProfile,
        // Player
        initializePlayer,
        fetchPlayerProfile,
        // Cards
        unlockCard,
        upgradeCard,
        setDeck,
        // Game flow
        createGame,
        createGame2v2,
        joinGame,
        joinGame2v2,
        delegateGame,
        delegateGame2v2,
        deployTroop,
        deployTroop2v2,
        endGame,
        endGame2v2,
        commitBattle,
        commitBattle2v2,
        mintTrophies,
        mintTrophies2v2,
        fetchBattleState,
        fetchBattleState2v2,
        // NFT / Resources
        exportNft,
        exportResource,
        importResource,
        // Clan
        createClan,
        joinClan,
        requestCards,
        donateCards,
        fetchAllClans,
        fetchUserClan,
        fetchClanMembers,
        leaveClan,
        // Session keys
        createSession,
        sessionToken,
        // Market (off-chain)
        fetchMarketListings,
        addMarketListing,
        // Utils
        fetchAccountInfo,
    };
}
