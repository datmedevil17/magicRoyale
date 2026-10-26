// Game server (Socket.IO + REST). Set VITE_SERVER_URL in .env.local (dev) or the
// deployment environment; defaults to the local node-server.
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
