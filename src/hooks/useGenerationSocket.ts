"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketEvent } from "@/lib/socket";
import type { TGenerationUpdatePayload } from "@/lib/socket.types";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

// How many consecutive auth failures before we give up and show the session-
// expired modal. Non-auth errors (network, CORS) are handled by socket.io's
// built-in reconnection and do not count toward this limit.
const AUTH_FAIL_THRESHOLD = 3;

const isAuthError = (msg: string) =>
  /expired|authentication required|invalid.*token/i.test(msg);

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
 * Auth errors are counted separately from network errors. After
 * AUTH_FAIL_THRESHOLD consecutive auth failures the socket stops retrying and
 * sets sessionExpired=true so the UI can prompt the user to log in again.
 * Calling reconnect() resets the counter and tries again.
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

    // Reset auth failure counter and clear session-expired state on every
    // (re)connect attempt — including manual reconnect button presses.
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
      // Built-in reconnection handles transient network drops.
      // Auth errors are handled separately — see connect_error below.
      reconnection         : true,
      reconnectionDelay    : 2_000,
      reconnectionDelayMax : 10_000,
      reconnectionAttempts : 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;
      authFailRef.current = 0; // reset on successful connect
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

      if (isAuthError(err.message)) {
        authFailRef.current += 1;
        console.warn(
          `[socket] auth failure ${authFailRef.current}/${AUTH_FAIL_THRESHOLD}:`,
          err.message,
        );

        if (authFailRef.current >= AUTH_FAIL_THRESHOLD) {
          // Session is definitively expired — stop retrying and tell the UI.
          console.error("[socket] giving up after repeated auth failures");
          socket.disconnect();
          setSessionExpired(true);
          setStatus("error");
          return;
        }

        // Still under threshold — let built-in reconnection retry.
        setStatus("error");
        return;
      }

      // Non-auth error (network, CORS, etc.) — built-in reconnection handles it.
      setStatus("error");
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
