// Socket event name constants — kept here so frontend and hook share one source of truth.
// The socket lifecycle (connect / disconnect / reconnect) is managed inside useGenerationSocket.
export const SocketEvent = {
  GENERATION_UPDATE: "generation:update",
  PING             : "ping",
  PONG             : "pong",
} as const;
