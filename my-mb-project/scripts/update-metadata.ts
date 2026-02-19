
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createV1,
    updateV1,
    findMetadataPda,
    mplTokenMetadata,
    fetchMetadata,
    TokenStandard
} from '@metaplex-foundation/mpl-token-metadata';
import {
    fetchMint,
} from '@metaplex-foundation/umi-signer-wallet-adapters'; // Not here, use from umi
import {
    publicKey,
    signerIdentity,
    createSignerFromKeypair,
    none,
    some,
    percentAmount
} from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configuration
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const KEYPAIR_PATH = path.join(os.homedir(), '.config', 'solana', 'id.json');

// Mint Mappings (from mints.md)
const MINTS = {
    "Gold": { addr: "3yrXat8Z6FwEoiPhTFrUw43LHGqnGgNtKVFZ9QRzLyCT", decimals: 9 },
    "Gems": { addr: "23t3mDz1ciDXUo9a1B1LDnExtBLya3Hzswa997ufhV8w", decimals: 9 },
    "Platform": { addr: "GT6jVixgxz55EYGMitA5YKXY5s5XUp1DXk5vPxvyXuBZ", decimals: 9 },
    "Archer": { addr: "36iaURU1R2eZKKHfvucxx36QmBRArsmP2jjEfkjsUPsN", decimals: 0 },
    "Giant": { addr: "EqGn8dMWPJWqSy4XEYf3eRHoaB2yfjELeNYWtBPXu4cH", decimals: 0 },
    "MiniPEKKA": { addr: "7DxFrCbbF1en4DVfy4s3MYsGKXUfdcRU3dTzU3F2p2Mp", decimals: 0 },
    "Arrows": { addr: "HkEd9zQAt92FwNqbiTtyppGcivsEAxi5DGnf3W1xi9VP", decimals: 0 },
    "Valkyrie": { addr: "AeuCR5d2nQDpgz9RoxPwyp5ShCTHfBp1qGTXk9siiczY", decimals: 0 },
    "Wizard": { addr: "AGGudi7rTfawmGTLWTyvaPhfhrsn3kJtaQsr2YTiqZN5", decimals: 0 },
    "BabyDragon": { addr: "86Meyq6JU2QxuK88SaEDJr8JwG2FyeF2KH3xVbsLfR6p", decimals: 0 }
};

const METADATA_BASE_URL = "https://raw.githubusercontent.com/datmedevil17/magicRoyale/main/my-mb-project/metadata/";

async function main() {
    console.log("Starting metadata update (Debug Mode)...");

    // 1. Initialize Umi
    const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());

    // 2. Load Keypair
    if (!fs.existsSync(KEYPAIR_PATH)) {
        console.error(`Keypair not found at ${KEYPAIR_PATH}`);
        return;
    }
    const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));

    console.log(`Using Authority: ${signer.publicKey}`);

    for (const [name, config] of Object.entries(MINTS)) {
        console.log(`\nProcessing ${name} (${config.addr})...`);
        const mint = publicKey(config.addr);
        const metadataPda = findMetadataPda(umi, { mint });

        const metadataJsonFile = `${name.toLowerCase()}.json`;
        const uri = `${METADATA_BASE_URL}${metadataJsonFile}`;

        const formattedName = name === "MiniPEKKA" ? "Mini PEKKA" : name === "BabyDragon" ? "Baby Dragon" : name;
        const symbol = name.substring(0, 4).toUpperCase();

        try {
            // Check if metadata exists
            let metadata;
            try {
                metadata = await fetchMetadata(umi, metadataPda);
                console.log(`Fetched existing metadata for ${name}`);
            } catch (e) {
                metadata = null;
            }

            if (!metadata) {
                console.log(`Creating metadata for ${name}...`);
                await createV1(umi, {
                    mint,
                    authority: signer,
                    name: formattedName,
                    symbol: symbol,
                    uri: uri,
                    sellerFeeBasisPoints: percentAmount(0),
                    tokenStandard: config.decimals > 0 ? TokenStandard.Fungible : TokenStandard.FungibleAsset,
                }).sendAndConfirm(umi);
                console.log(`Successfully created metadata for ${name}`);
            } else {
                console.log(`Updating metadata for ${name}...`);
                await updateV1(umi, {
                    mint,
                    authority: signer,
                    data: some({
                        name: formattedName,
                        symbol: symbol,
                        uri: uri,
                        sellerFeeBasisPoints: 0,
                        creators: none(),
                        collection: none(),
                        uses: none(),
                    })
                }).sendAndConfirm(umi);
                console.log(`Successfully updated metadata for ${name}`);
            }
        } catch (err: any) {
            console.error(`Error processing ${name}:`);
            if (err.transactionLogs) {
                console.log("Transaction Logs:");
                err.transactionLogs.forEach((line: string) => console.log(`  ${line}`));
            } else {
                console.error(err);
            }
        }
    }

    console.log("\nAll metadata updates completed!");
}

main().catch(console.error);
