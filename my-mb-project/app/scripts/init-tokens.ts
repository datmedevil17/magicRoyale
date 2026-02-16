
import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";

// Load wallet from keypair file or use a new one for testing
// Assuming user has a keypair at ~/.config/solana/id.json or similar, 
// OR we can generate one and ask user to fund it.
// For simplicity in this script, let's look for standard Solana CLI keypair or generte new and ask to fund.

const CONNECTION_URL = "https://api.devnet.solana.com";

async function main() {
    console.log("Initializing connection to Devnet...");
    const connection = new Connection(CONNECTION_URL, "confirmed");

    // Load keypair
    let keypair: Keypair;
    const home = process.env.HOME || "/root";
    const keypairPath = `${home}/.config/solana/id.json`;

    try {
        const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
        keypair = Keypair.fromSecretKey(secretKey);
        console.log(`Using wallet: ${keypair.publicKey.toBase58()}`);
    } catch (e) {
        console.log("Could not find default Solana keypair. Generating a new temporary one.");
        keypair = Keypair.generate();
        console.log(`GENERATED NEW WALLET: ${keypair.publicKey.toBase58()}`);
        console.log("PLEASE FUND THIS WALLET WITH SOL (e.g. 'solana airdrop 2 <PUBKEY>') AND RERUN IF BALANCE IS 0.");
    }

    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    if (balance < LAMPORTS_PER_SOL * 0.1) {
        console.error("Not enough SOL to pay for mint creation. Please request airdrop.");
        return;
    }

    console.log("--- Creating Mints ---");

    // 1. Create Gold Mint
    console.log("Creating Gold Mint...");
    const goldMint = await createMint(
        connection,
        keypair,
        keypair.publicKey, // mint authority
        null, // freeze authority
        9 // decimals
    );
    console.log(`Gold Mint: ${goldMint.toBase58()}`);

    // 2. Create Gems Mint
    console.log("Creating Gems Mint...");
    const gemsMint = await createMint(
        connection,
        keypair,
        keypair.publicKey,
        null,
        9
    );
    console.log(`Gems Mint: ${gemsMint.toBase58()}`);

    // 3. Create Card Mint (Collection/Example)
    // In reality, cards are likely NFTs or SFTs. For testing `unlock_card` which takes a `mint`,
    // it likely expects a specific mint address for that card type (SFT) or unique for NFT.
    // If it's SFT (e.g., "Archer Card Mint"), we create one.
    console.log("Creating Archer Card Mint...");
    const archerMint = await createMint(
        connection,
        keypair,
        keypair.publicKey,
        null,
        0 // decimals = 0 for NFT/SFT
    );
    console.log(`Archer Mint: ${archerMint.toBase58()}`);

    console.log("--- Minting Initial Supply to Wallet ---");

    // Mint Gold
    const goldAta = await getOrCreateAssociatedTokenAccount(connection, keypair, goldMint, keypair.publicKey);
    await mintTo(connection, keypair, goldMint, goldAta.address, keypair, 1000 * 10 ** 9);
    console.log(`Minted 1000 Gold to ${goldAta.address.toBase58()}`);

    // Mint Gems
    const gemsAta = await getOrCreateAssociatedTokenAccount(connection, keypair, gemsMint, keypair.publicKey);
    await mintTo(connection, keypair, gemsMint, gemsAta.address, keypair, 100 * 10 ** 9);
    console.log(`Minted 100 Gems to ${gemsAta.address.toBase58()}`);

    // Mint Archer Card
    const archerAta = await getOrCreateAssociatedTokenAccount(connection, keypair, archerMint, keypair.publicKey);
    await mintTo(connection, keypair, archerMint, archerAta.address, keypair, 1);
    console.log(`Minted 1 Archer to ${archerAta.address.toBase58()}`);

    console.log("\n--- SUMMARY ---");
    console.log(`Gold Mint: ${goldMint.toBase58()}`);
    console.log(`Gems Mint: ${gemsMint.toBase58()}`);
    console.log(`Archer Mint: ${archerMint.toBase58()}`);
    console.log("\nCopy these mint addresses to your frontend config or use them for testing.");

    // Write to a file for easy access
    const config = {
        goldMint: goldMint.toBase58(),
        gemsMint: gemsMint.toBase58(),
        archerMint: archerMint.toBase58()
    };
    fs.writeFileSync("test-tokens.json", JSON.stringify(config, null, 2));
    console.log("Saved to test-tokens.json");
}

main().catch(err => console.error(err));
