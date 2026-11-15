import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io("http://localhost:5000", {
    auth: { token },
    // withCredentials isn't needed here — we're authenticating via the `auth` payload,
    // not cookies, since sockets don't automatically carry httpOnly cookies the way fetch/axios do
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
