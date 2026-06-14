"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useGenerationSocket, type ConnectionStatus, type UseGenerationSocketResult } from "@/hooks/useGenerationSocket";

const SocketContext = createContext<UseGenerationSocketResult>({
  status         : "disconnected",
  lastUpdate     : null,
  clearLastUpdate: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useGenerationSocket(true);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocketContext = () => useContext(SocketContext);
export type { ConnectionStatus };
