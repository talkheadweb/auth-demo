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
  reconnect      : () => void;
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

    console.debug("[socket] connecting to", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      // Cookies are sent automatically by the browser on the handshake HTTP
      // upgrade request. Requires AUTH_COOKIE_SAMESITE=none + AUTH_COOKIE_SECURE=true
      // on the backend when the frontend and API are on different origins.
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
      console.info("[socket] connected — id:", socket.id);
      setStatus("connected");
      // Keepalive ping every 25 s — prevents proxy/load-balancer idle timeouts
      pingRef.current = setInterval(() => socket.emit(SocketEvent.PING), 25_000);
    });

    socket.on("disconnect", (reason) => {
      clearPing();
      console.warn("[socket] disconnected — reason:", reason);
      if (!mountedRef.current) return;
      setStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      clearPing();
      console.error("[socket] connect_error:", err.message,
        "\n  Hint: if message is \"Authentication required\" the backend may not be",
        "receiving cookies. Ensure AUTH_COOKIE_SAMESITE=none + AUTH_COOKIE_SECURE=true",
        "on the backend and that the socket URL is correct:", SOCKET_URL,
      );
      if (mountedRef.current) setStatus("error");
      // socket.io built-in reconnection will retry automatically
    });

    socket.on(SocketEvent.GENERATION_UPDATE, (payload: TGenerationUpdatePayload) => {
      console.debug("[socket] generation:update", payload);
      if (mountedRef.current) setLastUpdate(payload);
    });

    socket.on(SocketEvent.PONG, () => {
      console.debug("[socket] pong received");
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
    reconnect      : connect,
  };
};
