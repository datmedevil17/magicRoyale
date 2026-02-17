import { PublicKey } from "@solana/web3.js";

export const MINT_CONFIG = {
    // Currencies
    GOLD: new PublicKey("3yrXat8Z6FwEoiPhTFrUw43LHGqnGgNtKVFZ9QRzLyCT"),
    GEMS: new PublicKey("23t3mDz1ciDXUo9a1B1LDnExtBLya3Hzswa997ufhV8w"),

    // Troop Mints
    Archer: new PublicKey("36iaURU1R2eZKKHfvucxx36QmBRArsmP2jjEfkjsUPsN"),
    Giant: new PublicKey("EqGn8dMWPJWqSy4XEYf3eRHoaB2yfjELeNYWtBPXu4cH"),
    MiniPEKKA: new PublicKey("7DxFrCbbF1en4DVfy4s3MYsGKXUfdcRU3dTzU3F2p2Mp"),
    Arrows: new PublicKey("HkEd9zQAt92FwNqbiTtyppGcivsEAxi5DGnf3W1xi9VP"),
    Valkyrie: new PublicKey("AeuCR5d2nQDpgz9RoxPwyp5ShCTHfBp1qGTXk9siiczY"),
    Wizard: new PublicKey("AGGudi7rTfawmGTLWTyvaPhfhrsn3kJtaQsr2YTiqZN5"),
    BabyDragon: new PublicKey("86Meyq6JU2QxuK88SaEDJr8JwG2FyeF2KH3xVbsLfR6p"),
};

// Map from card ID (program) to Mint
export const CARD_ID_TO_MINT: Record<number, PublicKey> = {
    1: MINT_CONFIG.Archer,
    2: MINT_CONFIG.Giant,
    3: MINT_CONFIG.MiniPEKKA,
    4: MINT_CONFIG.Arrows,
    5: MINT_CONFIG.Valkyrie,
    6: MINT_CONFIG.Wizard,
    7: MINT_CONFIG.BabyDragon,
};

// Map from Troop Name (frontend) to Mint
export const TROOP_NAME_TO_MINT: Record<string, PublicKey> = {
    "Archer": MINT_CONFIG.Archer,
    "Archers": MINT_CONFIG.Archer,
    "Giant": MINT_CONFIG.Giant,
    "MiniPEKKA": MINT_CONFIG.MiniPEKKA,
    "Arrows": MINT_CONFIG.Arrows,
    "Valkyrie": MINT_CONFIG.Valkyrie,
    "Wizard": MINT_CONFIG.Wizard,
    "BabyDragon": MINT_CONFIG.BabyDragon,
};
