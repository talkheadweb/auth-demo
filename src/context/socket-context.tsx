"use client";

import { createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import {
  useGenerationSocket,
  type ConnectionStatus,
  type UseGenerationSocketResult,
} from "@/hooks/useGenerationSocket";

const SocketContext = createContext<UseGenerationSocketResult>({
  status         : "disconnected",
  sessionExpired : false,
  lastUpdate     : null,
  clearLastUpdate: () => {},
  reconnect      : () => {},
});

// ── Session-expired modal ──────────────────────────────────────────────────
// Shown after AUTH_FAIL_THRESHOLD consecutive auth failures on the socket.
// The user must log in again or retry (in case it was a transient cookie issue).
function SessionExpiredModal({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl space-y-4">
        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-100">Session expired</h2>
          <p className="text-sm text-slate-400">
            Your session has expired and the real-time connection could not be restored.
            Please log in again to continue.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-sky-500 py-2.5 text-center text-sm font-medium text-white transition hover:bg-sky-400"
          >
            Log in again
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────
export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useGenerationSocket(true);

  return (
    <SocketContext.Provider value={socket}>
      {children}
      {socket.sessionExpired && (
        <SessionExpiredModal onRetry={socket.reconnect} />
      )}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
export type { ConnectionStatus };
