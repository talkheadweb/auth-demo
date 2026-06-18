"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketEvent } from "@/lib/socket";
import type { TGenerationUpdatePayload } from "@/lib/socket.types";

const SOCKET_URL   = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
const SESSION_PATH = `${SOCKET_URL}/api/v1/auth/me`;

// How many consecutive auth failures (after HTTP refresh attempt) before giving up.
const AUTH_FAIL_THRESHOLD = 3;

const isAuthError = (msg: string) =>
  /expired|authentication required|invalid.*token/i.test(msg);

// Attempt an HTTP session refresh — authenticate middleware issues a new
// access_token cookie if the refresh_token is still valid.
const refreshSessionViaHttp = (): Promise<boolean> =>
  fetch(SESSION_PATH, { credentials: "include", cache: "no-store" })
    .then(r => r.ok)
    .catch(() => false);

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type UseGenerationSocketResult = {
  status         : ConnectionStatus;
  sessionExpired : boolean;
  lastUpdate     : TGenerationUpdatePayload | null;
  clearLastUpdate: () => void;
  reconnect      : () => void;
};

/**
 * Manages a Socket.io connection for the logged-in user.
 *
 * Auth error recovery flow:
 *   1. connect_error with auth message detected
 *   2. Fire GET /api/v1/auth/me directly to backend — authenticate middleware
 *      issues a new access_token Set-Cookie if the refresh_token is still valid
 *   3. If HTTP refresh succeeds → reconnect socket (now has fresh access_token)
 *   4. If HTTP refresh also fails → increment failure counter
 *   5. After AUTH_FAIL_THRESHOLD consecutive HTTP refresh failures → sessionExpired
 *
 * Non-auth errors (network, CORS) are left to socket.io's built-in reconnection.
 */
export const useGenerationSocket = (
  enabled: boolean = true,
): UseGenerationSocketResult => {
  const [status,         setStatus]         = useState<ConnectionStatus>("disconnected");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastUpdate,     setLastUpdate]     = useState<TGenerationUpdatePayload | null>(null);

  const socketRef   = useRef<Socket | null>(null);
  const pingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);
  const authFailRef = useRef(0);

  const clearPing = () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
  };

  const connect = () => {
    if (!mountedRef.current) return;

    // Reset on every (re)connect, including manual reconnect button presses.
    authFailRef.current = 0;
    setSessionExpired(false);

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    console.debug("[socket] connecting to", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect    : false,
      transports     : ["websocket", "polling"],
      reconnection         : true,
      reconnectionDelay    : 2_000,
      reconnectionDelayMax : 10_000,
      reconnectionAttempts : 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;
      authFailRef.current = 0;
      console.info("[socket] connected — id:", socket.id);
      setStatus("connected");
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
      console.error("[socket] connect_error:", err.message);
      if (!mountedRef.current) return;

      if (!isAuthError(err.message)) {
        // Non-auth error (network, CORS) — socket.io built-in retry handles it.
        setStatus("error");
        return;
      }

      // Auth error: the socket has no way to refresh its own cookies.
      // Fire an HTTP request directly to the backend — authenticate middleware
      // issues a new access_token Set-Cookie using the refresh_token,
      // so the next socket connect attempt succeeds cleanly.
      console.warn("[socket] auth error — attempting HTTP session refresh before retry");
      setStatus("connecting");

      refreshSessionViaHttp().then(ok => {
        if (!mountedRef.current) return;

        if (ok) {
          // Session refreshed — create a fresh socket with the new cookie.
          console.info("[socket] session refreshed via HTTP — reconnecting socket");
          connect(); // resets authFailRef.current to 0 internally
          return;
        }

        // HTTP refresh also failed — genuine session expiry or Redis issue.
        authFailRef.current += 1;
        console.warn(
          `[socket] HTTP refresh failed — auth failure ${authFailRef.current}/${AUTH_FAIL_THRESHOLD}`,
        );
        setStatus("error");

        if (authFailRef.current >= AUTH_FAIL_THRESHOLD) {
          console.error("[socket] giving up after repeated auth + HTTP refresh failures");
          socket.disconnect();
          setSessionExpired(true);
        }
      });
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
    sessionExpired,
    lastUpdate,
    clearLastUpdate: () => setLastUpdate(null),
    reconnect      : connect,
  };
};
