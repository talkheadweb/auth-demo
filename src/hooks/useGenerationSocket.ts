"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketEvent } from "@/lib/socket";
import type { TGenerationUpdatePayload } from "@/lib/socket.types";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type UseGenerationSocketResult = {
  status         : ConnectionStatus;
  lastUpdate     : TGenerationUpdatePayload | null;
  clearLastUpdate: () => void;
};

/**
 * Manages a Socket.io connection for the logged-in user.
 *
 * Auth: the browser sends httpOnly cookies automatically on the WebSocket
 * handshake — no token fetching needed. The socket middleware reads and
 * verifies the access_token (or refresh_token as fallback) server-side.
 *
 * @param enabled - pass false when the user is not logged in
 */
export const useGenerationSocket = (
  enabled: boolean = true,
): UseGenerationSocketResult => {
  const [status,     setStatus]     = useState<ConnectionStatus>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<TGenerationUpdatePayload | null>(null);

  const socketRef  = useRef<Socket | null>(null);
  const pingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearPing = () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
  };

  const connect = () => {
    if (!mountedRef.current) return;

    // Disconnect stale socket before creating a new one
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      // No auth.token — cookies are sent automatically by the browser on the
      // handshake HTTP upgrade request (same as any credentialed fetch).
      withCredentials: true,
      autoConnect    : false,
      transports     : ["websocket", "polling"],
      reconnection   : true,
      reconnectionDelay       : 2_000,
      reconnectionDelayMax    : 10_000,
      reconnectionAttempts    : Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      // Keepalive ping every 25 s — prevents proxy/load-balancer idle timeouts
      pingRef.current = setInterval(() => socket.emit(SocketEvent.PING), 25_000);
    });

    socket.on("disconnect", (reason) => {
      clearPing();
      if (!mountedRef.current) return;
      setStatus("disconnected");
      // Built-in reconnection handles transport errors.
      // Only manual disconnects ("io client disconnect") are final.
      if (reason === "io client disconnect") setStatus("disconnected");
    });

    socket.on("connect_error", () => {
      clearPing();
      if (mountedRef.current) setStatus("error");
      // socket.io built-in reconnection will retry automatically
    });

    socket.on(SocketEvent.GENERATION_UPDATE, (payload: TGenerationUpdatePayload) => {
      if (mountedRef.current) setLastUpdate(payload);
    });

    setStatus("connecting");
    socket.connect();
  };

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      clearPing();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    status,
    lastUpdate,
    clearLastUpdate: () => setLastUpdate(null),
  };
};
