"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket1 = (0, socket_io_client_1.io)("http://localhost:3001");
const socket2 = (0, socket_io_client_1.io)("http://localhost:3001");
const player1Key = "PlayerOnePublicKey111111111111111111111111";
const player2Key = "PlayerTwoPublicKey222222222222222222222222";
console.log("Connecting clients...");
socket1.on("connect", () => {
    console.log("Player 1 connected:", socket1.id);
    socket1.emit("join-queue", { publicKey: player1Key });
});
socket2.on("connect", () => {
    console.log("Player 2 connected:", socket2.id);
    socket2.emit("join-queue", { publicKey: player2Key });
});
socket1.on("match-found", (data) => {
    console.log("Player 1 Match Found:", data);
    socket1.emit("join-game-room", data.gameId);
});
socket2.on("match-found", (data) => {
    console.log("Player 2 Match Found:", data);
    socket2.emit("join-game-room", data.gameId);
    // Simulate signing process after match
    setTimeout(() => {
        console.log("Simulating Player 2 signing...");
        socket2.emit("submit-signature", {
            gameId: data.gameId,
            signature: "sig_player2_dummy",
            publicKey: player2Key
        });
    }, 1000);
});
socket1.on("signature-received", (data) => {
    console.log("Player 1 received signature:", data);
    // Simulate final submission
    console.log("Player 1 submitting final tx (simulation)...");
    // socket1.emit("submit-transaction", ...);
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
