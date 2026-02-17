
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GameCore } from "../target/types/game_core";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { BN } from "bn.js";

describe("game_functional_test", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.GameCore as Program<GameCore>;

    const backendAuthority = Keypair.fromSecretKey(
        new Uint8Array([98, 167, 58, 168, 193, 158, 224, 244, 2, 208, 190, 68, 164, 3, 178, 128, 228, 207, 168, 132, 93, 112, 97, 77, 187, 69, 119, 35, 5, 48, 198, 122, 36, 231, 166, 22, 183, 111, 81, 149, 66, 176, 255, 76, 147, 239, 144, 22, 20, 215, 28, 86, 245, 122, 15, 238, 69, 151, 156, 68, 4, 137, 205, 172])
    );
    // Corresponding Public Key: 4192... (Must match BACKEND_AUTHORITY const in lib.rs if hardcoded, or be updated)
    // NOTE: If the program has a hardcoded BACKEND_AUTHORITY check, we need to ensure this keypair matches it.

    const player = Keypair.generate();
    const player2 = Keypair.generate();

    let mint: PublicKey;
    let playerTokenAccount: PublicKey;
    let mintAuthority = Keypair.generate();

    let gamePda: PublicKey;
    let battlePda: PublicKey;
    let playerProfilePda: PublicKey;

    before(async () => {
        // 1. Airdrop SOL to player and backend
        const signature = await provider.connection.requestAirdrop(player.publicKey, 10 * LAMPORTS_PER_SOL);
        const signature2 = await provider.connection.requestAirdrop(backendAuthority.publicKey, 10 * LAMPORTS_PER_SOL);
        const signature3 = await provider.connection.requestAirdrop(player2.publicKey, 10 * LAMPORTS_PER_SOL);

        await provider.connection.confirmTransaction(signature);
        await provider.connection.confirmTransaction(signature2);
        await provider.connection.confirmTransaction(signature3);

        // 2. Create SPL Token Mint (Mock R-Tokens)
        mint = await createMint(
            provider.connection,
            player,
            mintAuthority.publicKey,
            null,
            6
        );

        // 3. Create Associated Token Account for Player
        const playerTokenAccountInfo = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            player,
            mint,
            player.publicKey
        );
        playerTokenAccount = playerTokenAccountInfo.address;

        // 4. Mint tokens to player for testing upgrades/unlocks
        await mintTo(
            provider.connection,
            player,
            mint,
            playerTokenAccount,
            mintAuthority,
            1000000 * 1000 // 1000 tokens
        );

        // Derive Player Profile PDA
        [playerProfilePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("player"), player.publicKey.toBuffer()],
            program.programId
        );
    });

    it("Initializes Player Profile", async () => {
        const username = "PlayerOne";
        await program.methods
            .initializePlayer(username)
            .accountsPartial({
                profile: playerProfilePda,
                authority: player.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([player])
            .rpc();

        const profile = await program.account.playerProfile.fetch(playerProfilePda);
        assert.equal(profile.authority.toString(), player.publicKey.toString());
        assert.equal(profile.mmr, 1000);
        assert.equal(profile.username, username);
        assert.equal(profile.trophies, 0);
        assert.isAbove(profile.inventory.length, 0); // Should have starter cards
    });

    it("Unlocks a New Card", async () => {
        const cardIdToUnlock = 5; // Assuming 5 is a valid non-starter card ID

        // First, verify player doesn't have it
        let profile = await program.account.playerProfile.fetch(playerProfilePda);
        // Casting to any because the type definition might not have updated yet in client
        let card = (profile.inventory as any[]).find(c => c.cardId === cardIdToUnlock);
        assert.isUndefined(card);

        await program.methods
            .unlockCard(cardIdToUnlock)
            .accountsPartial({
                profile: playerProfilePda,
                mint: mint,
                userTokenAccount: playerTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                authority: player.publicKey,
            })
            .signers([player])
            .rpc();

        profile = await program.account.playerProfile.fetch(playerProfilePda);
        card = (profile.inventory as any[]).find(c => c.cardId === cardIdToUnlock);
        assert.isDefined(card);
        assert.equal(card.amount, 1);
        assert.equal(card.level, 1);
    });

    it("Upgrades a Card", async () => {
        // Need enough cards to upgrade. Let's unlock the same card multiple times to boost amount.
        // Level 1 -> 2 needs 2 cards. We have 1 from unlock. Need 1 more.
        const cardIdToUpgrade = 5;

        await program.methods
            .unlockCard(cardIdToUpgrade)
            .accountsPartial({
                profile: playerProfilePda,
                mint: mint,
                userTokenAccount: playerTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                authority: player.publicKey,
            })
            .signers([player])
            .rpc();

        let profile = await program.account.playerProfile.fetch(playerProfilePda);
        let card = profile.inventory.find(c => c.cardId === cardIdToUpgrade);
        assert.equal(card.amount, 2);

        // Now Upgrade
        await program.methods
            .upgradeCard(cardIdToUpgrade)
            .accountsPartial({
                profile: playerProfilePda,
                mint: mint,
                userTokenAccount: playerTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                authority: player.publicKey,
            })
            .signers([player])
            .rpc();

        profile = await program.account.playerProfile.fetch(playerProfilePda);
        card = profile.inventory.find(c => c.cardId === cardIdToUpgrade);
        assert.equal(card.level, 2);
        assert.equal(card.amount, 0); // Consumed 2 cards
    });

    it("Sets Deck", async () => {
        const newDeck = [1, 2, 3, 4, 5, 0, 0, 0]; // Valid cards we own

        await program.methods
            .setDeck(newDeck)
            .accountsPartial({
                profile: playerProfilePda,
                mint: mint,
                userTokenAccount: playerTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID, // Not used but required in struct? No, check IDL/instruction.
                authority: player.publicKey,
            })
            .signers([player])
            .rpc();

        const profile = await program.account.playerProfile.fetch(playerProfilePda);
        // Anchor returns numbers as BN or sometimes regular numbers in arrays? Let's verify.
        // Actually, u8 array comes back as Buffer or number array.
        assert.deepEqual(Array.from(profile.deck as unknown as Uint8Array).slice(0, 5), [1, 2, 3, 4, 5]);
    });

    it("Starts Game", async () => {
        // Need to initialize player 2 first
        const [player2ProfilePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("player"), player2.publicKey.toBuffer()],
            program.programId
        );
        await program.methods
            .initializePlayer("PlayerTwo")
            .accountsPartial({
                profile: player2ProfilePda,
                authority: player2.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([player2])
            .rpc();

        // Derive Game PDA and Battle PDA
        // Assuming randomness or seed for game, but typical patterns might use a counter or random seed.
        // Looking at StartGame instruction: 
        // #[account(init, payer = authority, space = 8 + GameState::INIT_SPACE)] pub game: Account<'info, GameState>
        // It's a keypair likely, not a PDA with seeds, unless specified in lib.rs or I missed it.
        // The instructions/battle.rs snippet shows simple init. Let's start with Keypairs.

        const gameKeypair = Keypair.generate();
        gamePda = gameKeypair.publicKey;

        const battleKeypair = Keypair.generate();
        battlePda = battleKeypair.publicKey;

        await program.methods
            .startGame()
            .accountsPartial({
                game: gamePda,
                battle: battlePda,
                playerOne: player.publicKey,
                playerTwo: player2.publicKey,
                authority: backendAuthority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([backendAuthority, gameKeypair, battleKeypair])
            .rpc();

        const gameState = await program.account.gameState.fetch(gamePda);
        const battleState = await program.account.battleState.fetch(battlePda);

        assert.equal(gameState.status.active !== undefined, true);
        assert.equal(battleState.elixir[0].toNumber(), 500);
        assert.equal(battleState.towers.length, 6);
    });

    it("Deploys Troop", async () => {
        // Deploy at x=10, y=10 using card index 0 (which is card ID 1, Archer)
        const cardIdx = 0;
        const x = 10;
        const y = 10;


        await program.methods
            .deployTroop(cardIdx, x, y)
            .accountsPartial({
                battle: battlePda,
                game: gamePda,
                playerProfile: playerProfilePda,
                signer: player.publicKey,
                sessionToken: null, // Optional
            })
            .signers([player])
            .rpc();

        const battleState = await program.account.battleState.fetch(battlePda);
        assert.equal(battleState.entities.length, 1);
        assert.equal(battleState.entities[0].cardId, 1);
        assert.equal(battleState.entities[0].x, x);
        assert.equal(battleState.entities[0].y, y);
        // Elixir cost check (Archer cost * 100)
        // base cost 3 * 100 = 300. Start 500 -> 200.
        assert.equal(battleState.elixir[0].toNumber(), 500 - 300);
    });

    it("Resolves Game", async () => {
        // Force Player 1 (index 0) to win
        const winnerIdx = 0;

        await program.methods
            .resolveGame(winnerIdx)
            .accountsPartial({
                game: gamePda,
                battle: battlePda,
                playerOne: player.publicKey,
                playerTwo: player2.publicKey,
                authority: backendAuthority.publicKey,
            })
            .signers([backendAuthority])
            .rpc();

        const gameState = await program.account.gameState.fetch(gamePda);
        assert.equal(gameState.winner.toString(), player.publicKey.toString());
        assert.deepEqual(gameState.status, { completed: {} });
    });

    it("Claims Rewards", async () => {
        // Check initial profile
        let profile = await program.account.playerProfile.fetch(playerProfilePda);
        const initialMMR = profile.mmr;
        const initialTrophies = profile.trophies;

        assert.equal(initialTrophies, 0);

        // Transfer Mint Authority to PDA (required for minting rewards)
        const [mintAuthorityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("mint_authority")],
            program.programId
        );

        const { setAuthority, AuthorityType } = require("@solana/spl-token");
        await setAuthority(
            provider.connection,
            player, // payer
            mint,
            mintAuthority, // current authority
            AuthorityType.MintTokens,
            mintAuthorityPda
        );

        // Call claimRewards
        await program.methods
            .claimRewards()
            .accountsPartial({
                game: gamePda,
                profile: playerProfilePda,
                mint: mint,
                destination: playerTokenAccount,
                mintAuthority: mintAuthorityPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                signer: player.publicKey,
            })
            .signers([player])
            .rpc();

        profile = await program.account.playerProfile.fetch(playerProfilePda);
        assert.equal(profile.mmr, initialMMR + 30);
        assert.equal(profile.trophies, initialTrophies + 30);
    });
});
