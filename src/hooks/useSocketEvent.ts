import { useEffect, useRef } from "react";
import { getSocket } from "../socket/socket";

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void,
) {
  const handlerRef = useRef(handler);

  // Keep the ref pointing at the latest handler, so the listener never sees stale state.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
