
const { Keypair } = require("@solana/web3.js");
const secret = [147, 239, 108, 231, 225, 115, 14, 126, 58, 218, 166, 64, 164, 85, 184, 72, 106, 234, 48, 114, 223, 101, 238, 58, 63, 217, 226, 248, 240, 61, 84, 244, 82, 172, 191, 63, 201, 215, 138, 196, 81, 166, 60, 90, 153, 52, 134, 69, 232, 37, 63, 234, 74, 92, 217, 195, 72, 32, 255, 169, 246, 203, 95, 11];
const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
console.log(keypair.publicKey.toBase58());
