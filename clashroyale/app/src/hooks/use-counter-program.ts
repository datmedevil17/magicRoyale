import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { type GameCore } from "../idl/game_core";
import IDL from "../idl/game_core.json";
import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";

// Ephemeral Rollup endpoints
const ER_ENDPOINT = "https://devnet.magicblock.app";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app";

// Delegation Program
const DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

// Program ID
const PROGRAM_ID = new PublicKey(IDL.address);

// Delegation status
export type DelegationStatus = "undelegated" | "delegated" | "checking";

// ── PDA derivation helpers ────────────────────────────────────────────────────

/** Derive the PlayerProfile PDA for a given authority */
export function deriveProfilePDA(authority: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player"), authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

/** Derive the BattleState PDA for a given u64 game ID */
export function deriveBattlePDA(gameId: bigint | number): PublicKey {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(gameId));
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("battle"), buf],
        PROGRAM_ID
    );
    return pda;
}

/** Derive the Clan PDA for a given name */
export function deriveClanPDA(name: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("clan"), Buffer.from(name)],
        PROGRAM_ID
    );
    return pda;
}

/** Derive a ClanMember PDA */
export function deriveClanMemberPDA(clan: PublicKey, authority: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("clan_member"), clan.toBuffer(), authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useCounterProgram – primary hook for the Clash Royale on-chain game (game_core).
 *
 * Provides:
 *  - Base-layer operations: initializePlayer, createGame, joinGame, mintTrophies,
 *    setDeck, unlockCard, upgradeCard, createClan, joinClan, requestCards, donateCards,
 *    exportNft, exportResource, importResource
 *  - Ephemeral Rollup operations: delegateGame, deployTroop, endGame
 *  - Session key management via @magicblock-labs/gum-react-sdk
 *  - Real-time BattleState subscription over the ER WebSocket
 */
export function useCounterProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    // ── State ──────────────────────────────────────────────────────────────
    const [profilePubkey, setProfilePubkey] = useState<PublicKey | null>(null);
    const [battlePubkey, setBattlePubkey] = useState<PublicKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDelegating, setIsDelegating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [delegationStatus, setDelegationStatus] = useState<DelegationStatus>("checking");

    // ── Providers & Programs ───────────────────────────────────────────────

    /** Base-layer provider + program */
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
        return new Program<GameCore>(IDL as GameCore, provider);
    }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    /** Ephemeral-Rollup connection */
    const erConnection = useMemo(
        () =>
            new Connection(ER_ENDPOINT, {
                wsEndpoint: ER_WS_ENDPOINT,
                commitment: "confirmed",
            }),
        []
    );

    /** Ephemeral-Rollup Anchor provider */
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

    /** Ephemeral-Rollup program (same IDL, ER connection) */
    const erProgram = useMemo(() => {
        if (!erProvider) return null;
        return new Program<GameCore>(IDL as GameCore, erProvider);
    }, [erProvider]);

    // ── Session Key Manager ────────────────────────────────────────────────
    const sessionWallet = useSessionKeyManager(wallet as any, connection, "devnet");
    const { sessionToken, createSession: sdkCreateSession, isLoading: isSessionLoading } = sessionWallet;

    const createSession = useCallback(async () => {
        return await sdkCreateSession(PROGRAM_ID);
    }, [sdkCreateSession]);

    // ── Auto-derive profile PDA on wallet connect ──────────────────────────
    useEffect(() => {
        if (wallet.publicKey) {
            setProfilePubkey(deriveProfilePDA(wallet.publicKey));
        } else {
            setProfilePubkey(null);
            setBattlePubkey(null);
        }
    }, [wallet.publicKey]);

    // ── Delegation status check ────────────────────────────────────────────

    /**
     * Check whether a given battle PDA is currently delegated to the ER.
     * (owner of the account changes to DELEGATION_PROGRAM_ID when delegated)
     */
    const checkDelegationStatus = useCallback(
        async (battleKey?: PublicKey) => {
            const key = battleKey ?? battlePubkey;
            if (!key) {
                setDelegationStatus("checking");
                return;
            }
            try {
                setDelegationStatus("checking");
                const info = await connection.getAccountInfo(key);
                if (!info) {
                    setDelegationStatus("undelegated");
                    return;
                }
                setDelegationStatus(info.owner.equals(DELEGATION_PROGRAM_ID) ? "delegated" : "undelegated");
            } catch {
                setDelegationStatus("undelegated");
            }
        },
        [battlePubkey, connection]
    );

    // ── ER subscription for active battles ────────────────────────────────
    useEffect(() => {
        if (!erProgram || !battlePubkey || delegationStatus !== "delegated") return;

        const subId = erConnection.onAccountChange(
            battlePubkey,
            (info) => {
                try {
                    // Decode & log updated battle state (consumers can add additional state as needed)
                    const decoded = erProgram.coder.accounts.decode("battleState", info.data);
                    console.debug("[ER] BattleState updated:", decoded);
                } catch (err) {
                    console.error("Failed to decode ER BattleState:", err);
                }
            },
            "confirmed"
        );

        return () => {
            erConnection.removeAccountChangeListener(subId);
        };
    }, [erProgram, battlePubkey, erConnection, delegationStatus]);

    // ── Generic ER action helper ───────────────────────────────────────────

    /**
     * Build, sign with session key (if available) or main wallet, and send a
     * transaction to the Ephemeral Rollup.
     */
    const sendErTx = useCallback(
        async (methodBuilder: any, actionName: string): Promise<string> => {
            if (!erProvider || !wallet.publicKey) {
                throw new Error("Wallet not connected");
            }
            setIsLoading(true);
            setError(null);
            try {
                const hasSession = sessionToken != null && sessionWallet?.publicKey != null;
                const signerKey = hasSession ? sessionWallet.publicKey! : wallet.publicKey;

                let tx = await methodBuilder
                    .accounts({ signer: signerKey, sessionToken: hasSession ? sessionToken : null } as any)
                    .transaction();

                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

                if (hasSession && sessionWallet?.signTransaction) {
                    tx.feePayer = sessionWallet.publicKey!;
                    tx = await sessionWallet.signTransaction(tx);
                } else {
                    tx.feePayer = wallet.publicKey;
                    tx = await erProvider.wallet.signTransaction(tx);
                }

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
                await erConnection.confirmTransaction(txHash, "confirmed");
                return txHash;
            } catch (err) {
                const msg = err instanceof Error ? err.message : `Failed to ${actionName} on ER`;
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet]
    );

    // ══════════════════════════════════════════════════════════════════════
    //  BASE-LAYER INSTRUCTIONS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the player profile.
     * Seeds: ["player", authority] → PlayerProfile PDA
     */
    const initializePlayer = useCallback(
        async (username: string): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .initializePlayer(username)
                    .accounts({ authority: wallet.publicKey })
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to initialize player";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Create a new game / battle room.
     * Seeds: ["battle", gameId u64 LE] → BattleState PDA
     */
    const createGame = useCallback(
        async (gameId: number | bigint): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const gameBN = new BN(gameId.toString());
                const tx = await program.methods
                    .createGame(gameBN)
                    .accounts({ playerOne: wallet.publicKey })
                    .rpc();

                const battleKey = deriveBattlePDA(gameId);
                setBattlePubkey(battleKey);
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to create game";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Join an existing game as player two.
     */
    const joinGame = useCallback(
        async (gameId: number | bigint): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const gameBN = new BN(gameId.toString());
                const tx = await program.methods
                    .joinGame(gameBN)
                    .accounts({ playerTwo: wallet.publicKey })
                    .rpc();

                const battleKey = deriveBattlePDA(gameId);
                setBattlePubkey(battleKey);
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to join game";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Delegate the battle state to the Ephemeral Rollup.
     * Must be called from the base layer before any ER game actions.
     */
    const delegateGame = useCallback(
        async (gameId: number | bigint): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setIsDelegating(true);
            setError(null);
            try {
                const gameBN = new BN(gameId.toString());
                const tx = await program.methods
                    .delegateGame(gameBN)
                    .accounts({ payer: wallet.publicKey })
                    .rpc({ skipPreflight: true });

                // Allow delegation to propagate
                await new Promise((r) => setTimeout(r, 2000));

                const battleKey = deriveBattlePDA(gameId);
                setBattlePubkey(battleKey);
                await checkDelegationStatus(battleKey);

                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to delegate game";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
                setIsDelegating(false);
            }
        },
        [program, wallet.publicKey, checkDelegationStatus]
    );

    /**
     * Set the player's active deck (8 card slots).
     * @param newDeck          Array of 8 card IDs
     * @param mint             The card-token mint account
     * @param userTokenAccount The player's associated token account for that mint
     */
    const setDeck = useCallback(
        async (newDeck: number[], mint: PublicKey, userTokenAccount: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            if (newDeck.length !== 8) throw new Error("Deck must have exactly 8 cards");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .setDeck(newDeck)
                    .accounts({ authority: wallet.publicKey, mint, userTokenAccount } as any)
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to set deck";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Unlock a new card into the player's inventory (burns card tokens).
     * @param cardId           The card ID to unlock
     * @param mint             The card-token mint account
     * @param userTokenAccount The player's associated token account for that mint
     */
    const unlockCard = useCallback(
        async (cardId: number, mint: PublicKey, userTokenAccount: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .unlockCard(cardId)
                    .accounts({ authority: wallet.publicKey, mint, userTokenAccount } as any)
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to unlock card";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Upgrade a card (costs card tokens).
     * @param cardId           The card ID to upgrade
     * @param mint             The card-token mint account
     * @param userTokenAccount The player's associated token account for that mint
     */
    const upgradeCard = useCallback(
        async (cardId: number, mint: PublicKey, userTokenAccount: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .upgradeCard(cardId)
                    .accounts({ authority: wallet.publicKey, mint, userTokenAccount } as any)
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to upgrade card";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /**
     * Mint trophies after a game has been completed.
     * Must be called from the base layer after end_game + undelegation.
     * @param gameId      The game ID (u64)
     * @param mint        The trophy-token mint account
     * @param destination The player's associated token account for the trophy mint
     */
    const mintTrophies = useCallback(
        async (gameId: number | bigint, mint: PublicKey, destination: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const gameBN = new BN(gameId.toString());
                const tx = await program.methods
                    .mintTrophies(gameBN)
                    .accounts({ signer: wallet.publicKey, mint, destination } as any)
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to mint trophies";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ── Clan ──────────────────────────────────────────────────────────────

    /** Create a new clan. */
    const createClan = useCallback(
        async (name: string): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .createClan(name)
                    .accounts({ authority: wallet.publicKey })
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to create clan";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /** Join an existing clan. Pass the clan PublicKey. */
    const joinClan = useCallback(
        async (clanPubkey: PublicKey): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .joinClan()
                    .accounts({ clan: clanPubkey, authority: wallet.publicKey })
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to join clan";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    /** Request card donations from the clan. */
    const requestCards = useCallback(
        async (clanPubkey: PublicKey, cardId: number): Promise<string> => {
            if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const tx = await program.methods
                    .requestCards(cardId)
                    .accounts({ clan: clanPubkey, authority: wallet.publicKey })
                    .rpc();
                return tx;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to request cards";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [program, wallet.publicKey]
    );

    // ══════════════════════════════════════════════════════════════════════
    //  EPHEMERAL ROLLUP INSTRUCTIONS  (signed by session key when available)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Deploy a troop during an active (ER-delegated) game.
     * @param gameId  The game ID (u64)
     * @param cardIdx  Index in the player's 8-card deck (0-7)
     * @param x        Grid X position
     * @param y        Grid Y position
     */
    const deployTroop = useCallback(
        async (
            gameId: number | bigint,
            cardIdx: number,
            x: number,
            y: number
        ): Promise<string> => {
            if (!erProgram) throw new Error("ER program not loaded");
            const gameBN = new BN(gameId.toString());
            return sendErTx(
                erProgram.methods.deployTroop(gameBN, cardIdx, x, y) as any,
                "deployTroop"
            );
        },
        [erProgram, sendErTx]
    );

    /**
     * End the game on the ER (sets winner, triggers undelegation/commit).
     * @param gameId     The game ID (u64)
     * @param isTimeout  true if the game ended by timeout rather than tower destruction
     */
    const endGame = useCallback(
        async (gameId: number | bigint, isTimeout: boolean): Promise<string> => {
            if (!erProvider || !wallet.publicKey) throw new Error("Wallet not connected");
            setIsLoading(true);
            setError(null);
            try {
                const gameBN = new BN(gameId.toString());

                // endGame must always be signed by the main wallet (not session)
                // because it contains magic_program CPI that validates the signer.
                let tx = await (erProgram!.methods
                    .endGame(gameBN, isTimeout) as any)
                    .accounts({ payer: wallet.publicKey })
                    .transaction();

                tx.feePayer = wallet.publicKey;
                tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
                tx = await erProvider.wallet.signTransaction(tx);

                const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
                await erConnection.confirmTransaction(txHash, "confirmed");

                // Allow undelegation to propagate back to base layer
                await new Promise((r) => setTimeout(r, 2000));
                setDelegationStatus("undelegated");

                return txHash;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to end game";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [erProvider, erProgram, erConnection, wallet.publicKey]
    );

    // ── Return ─────────────────────────────────────────────────────────────
    return {
        // Programs
        program,
        erProgram,

        // State
        profilePubkey,
        battlePubkey,
        setBattlePubkey,
        isLoading,
        isDelegating,
        error,
        delegationStatus,

        // PDA helpers (re-exported for convenience)
        deriveProfilePDA,
        deriveBattlePDA,
        deriveClanPDA,
        deriveClanMemberPDA,

        // Base-layer operations
        initializePlayer,
        createGame,
        joinGame,
        delegateGame,
        setDeck,
        unlockCard,
        upgradeCard,
        mintTrophies,

        // Clan operations (base layer)
        createClan,
        joinClan,
        requestCards,

        // Ephemeral Rollup operations
        deployTroop,
        endGame,

        // Delegation utilities
        checkDelegation: checkDelegationStatus,

        // Session key
        createSession,
        sessionToken,
        isSessionLoading,
    };
}
