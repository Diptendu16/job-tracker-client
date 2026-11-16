import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectSocket(token: string): Socket {
  // Same token and a socket already exists (even if it's still connecting): reuse it.
  if (socket && currentToken === token) return socket;

  // New or different token: drop any old connection before creating a new one.
  socket?.disconnect();
  currentToken = token;
  socket = io("http://localhost:5000", { auth: { token } });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}

export function getSocket(): Socket | null {
  return socket;
}
