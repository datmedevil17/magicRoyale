
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";
import path from "path";

// Configuration
const CONNECTION_URL = "https://api.devnet.solana.com";
const OUTPUT_FILE = "game-tokens.json";

// Starter Card IDs from lib.rs constants
// 1: Archer, 2: Giant, 3: MiniPEKKA, 4: Arrows, 5: Valkyrie, 6: Wizard, 7: Baby Dragon
const STARTER_CARDS = [
    { id: 1, name: "Archer" },
    { id: 2, name: "Giant" },
    { id: 3, name: "MiniPEKKA" },
    { id: 4, name: "Arrows" },
    { id: 5, name: "Valkyrie" },
    { id: 6, name: "Wizard" },
    { id: 7, name: "BabyDragon" }
];

async function main() {
    console.log("Initializing Game Token Mints on Devnet...");
    const connection = new Connection(CONNECTION_URL, "confirmed");

    // Load or Generate Wallet
    let keypair: Keypair;
    const home = process.env.HOME || "/root";
    const keypairPath = path.join(home, ".config", "solana", "id.json");

    try {
        if (fs.existsSync(keypairPath)) {
            const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
            keypair = Keypair.fromSecretKey(secretKey);
            console.log(`Using wallet: ${keypair.publicKey.toBase58()}`);
        } else {
            console.log("No default wallet found. Generating temporary wallet...");
            keypair = Keypair.generate();
            console.log(`GENERATED WALLET: ${keypair.publicKey.toBase58()}`);
            console.log("Please fund this wallet!");
        }
    } catch (e) {
        console.error("Error loading wallet:", e);
        return;
    }

    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    if (balance < LAMPORTS_PER_SOL * 0.05) {
        console.error("Insufficient funds. Please airdrop SOL to:", keypair.publicKey.toBase58());
        return;
    }

    let tokens: any = {};
    if (fs.existsSync(OUTPUT_FILE)) {
        console.log("Loading existing tokens...");
        tokens = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    }

    console.log("\n--- Creating Currency Mints ---");

    // 1. Gold Mint (Currency)
    if (!tokens.Gold) {
        console.log("Creating Gold Mint...");
        const goldMint = await createMint(connection, keypair, keypair.publicKey, null, 9);
        tokens.Gold = goldMint.toBase58();
        console.log(`Gold Mint: ${goldMint.toBase58()}`);
    } else {
        console.log(`Gold Mint exists: ${tokens.Gold}`);
    }

    // 2. Gems Mint (Premium Currency)
    if (!tokens.Gems) {
        console.log("Creating Gems Mint...");
        const gemsMint = await createMint(connection, keypair, keypair.publicKey, null, 9);
        tokens.Gems = gemsMint.toBase58();
        console.log(`Gems Mint: ${gemsMint.toBase58()}`);
    } else {
        console.log(`Gems Mint exists: ${tokens.Gems}`);
    }

    console.log("\n--- Creating Card Mints ---");

    for (const card of STARTER_CARDS) {
        if (tokens[card.name]) {
            console.log(`${card.name} Mint exists: ${tokens[card.name]}`);
            continue;
        }
        console.log(`Creating Mint for ${card.name} (ID: ${card.id})...`);
        // Card mints usually have 0 decimals if they are SFTs/NFTs representing count
        const cardMint = await createMint(connection, keypair, keypair.publicKey, null, 0);
        tokens[card.name] = cardMint.toBase58();
        console.log(`${card.name} Mint: ${cardMint.toBase58()}`);
    }

    console.log("\n--- Minting Initial Supply to Developer ---");

    // Mint some Gold
    try {
        const goldMintPubkey = new PublicKey(tokens.Gold);
        const goldAta = await getOrCreateAssociatedTokenAccount(connection, keypair, goldMintPubkey, keypair.publicKey);
        await mintTo(connection, keypair, goldMintPubkey, goldAta.address, keypair, 10000 * 10 ** 9);
        console.log("Minted 10,000 Gold");
    } catch (err) {
        console.log("Error minting Gold:", err);
    }

    // Mint some Cards
    for (const card of STARTER_CARDS) {
        try {
            const mintPubkey = new PublicKey(tokens[card.name]);
            const ata = await getOrCreateAssociatedTokenAccount(connection, keypair, mintPubkey, keypair.publicKey);
            await mintTo(connection, keypair, mintPubkey, ata.address, keypair, 10); // 10 cards each
            console.log(`Minted 10 ${card.name}`);
        } catch (err) {
            console.log(`Error minting ${card.name}:`, err);
        }
    }

    console.log("\n--- Saving Configuration ---");
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tokens, null, 2));
    console.log(`Token mints saved to ${OUTPUT_FILE}`);
}

main().then(() => console.log("Done")).catch(console.error);
