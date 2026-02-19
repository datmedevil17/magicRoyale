
const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");

const privateKeyBase58 = "4osjFtbTXsPQyYryBprU6TTvMB1CUJdqkmKUS6APhbURUZQjMTDn4e8pDRa16xPKqE3B4cgmDfpk9uk81Ye5v9Z3";
try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
    console.log("Public Key:", keypair.publicKey.toBase58());
} catch (e) {
    console.error("Error:", e.message);
}
