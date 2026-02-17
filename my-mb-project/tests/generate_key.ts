
import { Keypair } from "@solana/web3.js";

const k = Keypair.generate();
console.log("SECRET:", `[${k.secretKey.toString()}]`);
console.log("PUBKEY:", k.publicKey.toString());
