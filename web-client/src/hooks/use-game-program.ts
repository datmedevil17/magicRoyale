import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { type GameCore } from "../idl/game_core";
import IDL from "../idl/game_core.json";
import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MINT_CONFIG } from "../game/config/MintConfig";

// Ephemeral Rollup endpoints - configurable via environment
const ER_ENDPOINT = "https://devnet.magicblock.app";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app";
const API_URL = "http://localhost:3000";



// Note: magic_program and magic_context are auto-resolved by Anchor
// because they have fixed addresses in the IDL

// Helper functions for PDA derivation
const getPlayerProfilePda = (authority: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("player"), authority.toBuffer()],
        programId
    )[0];
};

const getClanPda = (name: string, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("clan"), Buffer.from(name)],
        programId
    )[0];
};

const getClanMemberPda = (clan: PublicKey, authority: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("clan_member"), clan.toBuffer(), authority.toBuffer()],
        programId
    )[0];
};



const getRequestPda = (clan: PublicKey, requesterAuthority: PublicKey, programId: PublicKey) => {
    // requester_profile.authority is the requesterAuthority
    return PublicKey.findProgramAddressSync(
        [Buffer.from("request"), clan.toBuffer(), requesterAuthority.toBuffer()],
        programId
    )[0];
};

// ... existing code ...
export type DelegationStatus = "undelegated" | "delegated" | "checking";

// Game State Interfaces (matching IDL)
export interface GameState {
    id: BN;
    players: PublicKey[];
    winner: PublicKey | null;
    status: any; // Enum in IDL
    // ... add other fields from IDL if needed
}

export interface BattleState {
    // ... add fields from IDL
}

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
        if (!erProvider) {
            return null;
        }

        return new Program<GameCore>(IDL as unknown as GameCore, erProvider);
    }, [erProvider]);

    // Session Key Manager
    const sessionWallet = useSessionKeyManager(
        wallet as any,
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
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("player"), wallet.publicKey.toBuffer()],
                program.programId
            );
            setPlayerProfilePda(pda);
        } else {
            setPlayerProfilePda(null);
        }
    }, [wallet.publicKey, program]);

    // Initialize Player (Base Layer)
    const initializePlayer = useCallback(async (username: string): Promise<string> => {
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
    }, [program, wallet.publicKey]);

    // Start Game (Base Layer)
    const startGame = useCallback(async (opponent: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

        setIsLoading(true);
        try {
            // Generate Keypairs for Game and Battle
            const gameKeypair = Keypair.generate();
            const battleKeypair = Keypair.generate();

            const tx = await program.methods
                .startGame()
                .accounts({
                    game: gameKeypair.publicKey,
                    battle: battleKeypair.publicKey,
                    playerOne: wallet.publicKey,
                    playerTwo: opponent,
                    authority: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .signers([gameKeypair, battleKeypair])
                .rpc();
            return tx;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey]);

    // Deploy Troop (ER - High Frequency)
    const deployTroop = useCallback(async (gameId: PublicKey, battleId: PublicKey, cardIdx: number, x: number, y: number): Promise<string> => {
        if (!program || !erProvider || !wallet.publicKey) throw new Error("Game not ready");

        setIsLoading(true);
        try {
            const hasSession = sessionToken != null && sessionWallet != null;
            const signer = hasSession ? sessionWallet.publicKey : wallet.publicKey;

            const accounts: any = {
                battle: battleId,
                game: gameId,
                playerProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                signer: signer,
                sessionToken: (hasSession && sessionToken) ? sessionToken : undefined,
            };

            let tx = await program.methods
                .deployTroop(cardIdx, x, y)
                .accounts(accounts)
                .transaction();

            tx.feePayer = (hasSession && sessionWallet ? sessionWallet.publicKey : wallet.publicKey) || undefined;
            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

            if (hasSession && sessionWallet && sessionWallet.signTransaction) {
                // @ts-ignore
                tx = await sessionWallet.signTransaction(tx);
            } else {
                tx = await erProvider.wallet.signTransaction(tx);
            }

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");

            return txHash;

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet, playerProfilePda]);

    // Delegate Profile/Game to ER
    const delegate = useCallback(async (pdaToDelegate: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

        setIsLoading(true);

        try {
            console.log("Delegating PDA:", pdaToDelegate.toBase58());
            console.log("Program Methods:", Object.keys(program.methods));

            // Explicitly derive PDAs to avoid resolution errors
            const DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
            const [delegationRecordPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("delegation"), pdaToDelegate.toBuffer()],
                DELEGATION_PROGRAM_ID
            );
            const [delegationMetadataPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("delegation-metadata"), pdaToDelegate.toBuffer()],
                DELEGATION_PROGRAM_ID
            );
            const [bufferPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("buffer"), pdaToDelegate.toBuffer()],
                program.programId
            );

            const tx = await program.methods
                .delegate()
                .accounts({
                    payer: wallet.publicKey,
                    pda: pdaToDelegate,
                    delegationRecordPda: delegationRecordPda,
                    delegationMetadataPda: delegationMetadataPda,
                    bufferPda: bufferPda,
                    delegationProgram: DELEGATION_PROGRAM_ID,
                    ownerProgram: program.programId,
                    systemProgram: new PublicKey("11111111111111111111111111111111"),
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
    }, [program, wallet.publicKey]);

    // Unlock Card (Base Layer)
    const unlockCard = useCallback(async (cardId: number, mint: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

            const preInstructions = [];
            const ataInfo = await connection.getAccountInfo(ata);
            if (!ataInfo) {
                console.log("Creating ATA for", mint.toBase58());
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
                    mint: mint,
                    userTokenAccount: ata,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    authority: wallet.publicKey,
                } as any)
                .preInstructions(preInstructions)
                .rpc();
            return tx;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, connection]);

    // Upgrade Card (Base Layer)
    const upgradeCard = useCallback(async (cardId: number, mint: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

            const tx = await program.methods
                .upgradeCard(cardId)
                .accounts({
                    profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    mint: mint,
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
    }, [program, wallet.publicKey]);

    // Set Deck (Base Layer)
    const setDeck = useCallback(async (newDeck: number[], mint: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const userTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
            const tx = await program.methods
                .setDeck(newDeck)
                .accounts({
                    profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    mint: mint,
                    userTokenAccount: userTokenAccount,
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
    }, [program, wallet.publicKey]);

    // Create Clan (Base Layer)
    const createClan = useCallback(async (name: string): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const clanPda = getClanPda(name, program.programId); // We need to derive this based on name
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
    }, [program, wallet.publicKey]);

    // Join Clan (Base Layer)
    const joinClan = useCallback(async (clan: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const tx = await program.methods
                .joinClan()
                .accounts({
                    clan: clan,
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
    }, [program, wallet.publicKey]);

    // Request Cards (Base Layer)
    const requestCards = useCallback(async (clan: PublicKey, cardId: number): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const tx = await program.methods
                .requestCards(cardId)
                .accounts({
                    clan: clan,
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
    }, [program, wallet.publicKey]);

    // Donate Cards (Base Layer)
    const donateCards = useCallback(async (clan: PublicKey, requesterAuthority: PublicKey, mint: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const donorTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);

            const tx = await program.methods
                .donateCards()
                .accounts({
                    clan: clan,
                    donorProfile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    donorMember: getClanMemberPda(clan, wallet.publicKey, program.programId),
                    requesterProfile: getPlayerProfilePda(requesterAuthority, program.programId),
                    request: getRequestPda(clan, requesterAuthority, program.programId),
                    mint: mint,
                    donorTokenAccount: donorTokenAccount,
                    mintAuthority: PublicKey.findProgramAddressSync([Buffer.from("mint_authority")], program.programId)[0],
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
    }, [program, wallet.publicKey]);

    // Resolve Game (Base Layer)
    const resolveGame = useCallback(async (game: PublicKey, battle: PublicKey, playerOne: PublicKey, playerTwo: PublicKey, winnerIdx?: number): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const tx = await program.methods
                .resolveGame(winnerIdx !== undefined ? winnerIdx : null)
                .accounts({
                    game: game,
                    battle: battle,
                    playerOne: playerOne,
                    playerTwo: playerTwo,
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
    }, [program, wallet.publicKey]);

    // Claim Rewards (Base Layer)
    const claimRewards = useCallback(async (game: PublicKey, mint: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        try {
            const destination = getAssociatedTokenAddressSync(mint, wallet.publicKey);

            const preInstructions = [];
            const destInfo = await connection.getAccountInfo(destination);
            if (!destInfo) {
                console.log("Creating ATA for rewards", mint.toBase58());
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
                .claimRewards()
                .accounts({
                    game: game,
                    profile: getPlayerProfilePda(wallet.publicKey, program.programId),
                    mint: mint,
                    destination: destination,
                    mintAuthority: PublicKey.findProgramAddressSync([Buffer.from("mint_authority")], program.programId)[0],
                    tokenProgram: TOKEN_PROGRAM_ID,
                    signer: wallet.publicKey,
                    systemProgram: SystemProgram.programId, // Just in case
                } as any)
                .preInstructions(preInstructions)
                .rpc();
            return tx;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, connection]);

    // Commit Battle (ER -> Base)
    const commitBattle = useCallback(async (battle: PublicKey): Promise<string> => {
        if (!program || !erProvider || !wallet.publicKey) throw new Error("Wallet not connected / ER not ready");
        setIsLoading(true);
        try {
            let tx = await program.methods
                .commitBattle()
                .accounts({
                    payer: wallet.publicKey,
                    battle: battle,
                    // magic_program and magic_context auto-resolved by Anchor
                } as any)
                .transaction();

            tx.feePayer = wallet.publicKey;
            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx = await erProvider.wallet.signTransaction(tx);

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");

            // Try to get commitment signature (optional/advanced)
            // Commitment signature fetch removed to avoid import errors

            return txHash;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, erProvider, erConnection, wallet.publicKey]);

    // Undelegate Battle (ER -> Base)
    const undelegateBattle = useCallback(async (battle: PublicKey): Promise<string> => {
        if (!program || !erProvider || !wallet.publicKey) throw new Error("Wallet not connected / ER not ready");
        setIsLoading(true);
        try {
            let tx = await program.methods
                .undelegateBattle()
                .accounts({
                    payer: wallet.publicKey,
                    battle: battle,
                    // magic_program and magic_context auto-resolved by Anchor
                } as any)
                .transaction();

            tx.feePayer = wallet.publicKey;
            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx = await erProvider.wallet.signTransaction(tx);

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");

            return txHash;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, erProvider, erConnection, wallet.publicKey]);


    // Fetch all clans
    const fetchAllClans = useCallback(async () => {
        if (!program) return [];
        try {
            const clans = await program.account.clan.all();
            return clans.map(c => ({
                publicKey: c.publicKey,
                account: c.account
            }));
        } catch (err) {
            console.error("Error fetching clans:", err);
            return [];
        }
    }, [program]);

    // Fetch User's Clan
    const fetchUserClan = useCallback(async () => {
        if (!program || !wallet.publicKey) return null;
        try {
            // ClanMember layout: discriminator(8) + clan(32) + player(32)
            // We filter by player matches wallet.publicKey
            const memberAccounts = await program.account.clanMember.all([
                {
                    memcmp: {
                        offset: 40, // 8 + 32
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
                    clanAccount: clan
                };
            }
            return null;
        } catch (err) {
            console.error("Error fetching user clan:", err);
            return null;
        }
    }, [program, wallet.publicKey]);

    // Leave Clan (Mock)
    const leaveClan = useCallback(async () => {
        // No instruction for this yet.
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Mock Left Clan");
    }, []);

    // Fetch Player Profile
    const fetchPlayerProfile = useCallback(async (pda: PublicKey) => {
        if (!program) return null;
        try {
            const profile = await program.account.playerProfile.fetch(pda);
            return profile;
        } catch (err) {
            console.log("Profile not found or error fetching:", err);
            return null;
        }
    }, [program]);

    const [platformBalance, setPlatformBalance] = useState<number>(0);

    // Fetch Platform Token Balance
    const fetchPlatformBalance = useCallback(async () => {
        if (!wallet.publicKey) return;
        try {
            const ata = getAssociatedTokenAddressSync(MINT_CONFIG.PLATFORM, wallet.publicKey);
            const balance = await connection.getTokenAccountBalance(ata);
            setPlatformBalance(balance.value.uiAmount || 0);
        } catch (err) {
            console.log("Error fetching platform balance (likely no ATA):", err);
            setPlatformBalance(0);
        }
    }, [wallet.publicKey, connection]);

    // Initial fetch
    useEffect(() => {
        fetchPlatformBalance();
    }, [fetchPlatformBalance]);

    // Market API (Node Server)
    const fetchMarketListings = useCallback(async (): Promise<{ cardId: number; price: number; }[]> => {
        try {
            const res = await fetch(`${API_URL}/market`);
            if (!res.ok) throw new Error('Failed to fetch market listings');
            return await res.json();
        } catch (err) {
            console.error('Error fetching market:', err);
            return [];
        }
    }, []);

    const addMarketListing = useCallback(async (cardId: number, price: number): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/market`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, price })
            });
            if (!res.ok) throw new Error('Failed to add listing');
            return true;
        } catch (err) {
            console.error('Error adding listing:', err);
            return false;
        }
    }, []);

    return {
        program,
        erProgram,
        isLoading,
        error,
        platformBalance,
        fetchPlatformBalance,
        // ... (rest of exports)
        initializePlayer,
        fetchPlayerProfile,
        unlockCard,
        upgradeCard,
        setDeck,
        startGame,
        deployTroop,
        resolveGame,
        claimRewards,
        createClan,
        joinClan,
        requestCards,
        donateCards,
        delegate,
        commitBattle,
        undelegateBattle,
        createSession,
        sessionToken,
        playerProfilePda,
        fetchAllClans,
        fetchUserClan,
        leaveClan,
        fetchMarketListings,
        addMarketListing,
    };
}
