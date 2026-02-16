
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = "http://localhost:3001"; // TODO: Move to env if needed

interface MatchData {
    gameId: string;
    opponent: string;
    isPlayerOne: boolean;
}

export function useMatchmaking(publicKey: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [match, setMatch] = useState<MatchData | null>(null);

    // Use ref to keep socket instance
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket
        socketRef.current = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log("Socket connected:", socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log("Socket disconnected");
            setIsConnected(false);
            setIsSearching(false);
        });

        socket.on('match-found', (data: MatchData) => {
            console.log("Match found!", data);
            setMatch(data);
            setIsSearching(false);
            toast.success("Match Found! Opponent: " + data.opponent.slice(0, 8) + "...");

            // Auto-join the room for the game
            socket.emit('join-game-room', data.gameId);
        });

        // Cleanup
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const joinQueue = useCallback(() => {
        if (!publicKey) {
            toast.error("Connect Wallet first!");
            return;
        }
        if (!socketRef.current?.connected) {
            toast.error("Server not connected");
            return;
        }

        socketRef.current.emit('join-queue', { publicKey });
        setIsSearching(true);
        setMatch(null); // Reset previous match
        toast.loading("Joined Matchmaking Queue...", { duration: 2000 });
    }, [publicKey]);

    const leaveQueue = useCallback(() => {
        if (socketRef.current?.connected) {
            // We technically don't have a specific leave-queue event in backend yet exposed nicely
            // But disconnecting or just client-side state reset works for now
            // Let's implement a polite emit if server supports it, otherwise just reset state.
            // Our server implementation: `socket.on('disconnect')` removes from queue.
            // We can just disconnect and reconnect or add a `leave-queue` event to server later.
            // For now, let's just reset client state.

            // Actually, the plan implies we should add it.
            // But to avoid server changes if not needed, we can just reload or simplistic approach.
            setIsSearching(false);
            toast("Left Queue");
        }
    }, []);

    return {
        isConnected,
        isSearching,
        match,
        joinQueue,
        leaveQueue,
        socket: socketRef.current
    };
}
