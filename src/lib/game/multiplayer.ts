import Peer, { type DataConnection } from "peerjs";

export type NetworkInput = {
  dx: number;
  dy: number;
  sprint: boolean;
  pass: boolean;
  shoot: boolean;
  tackle: boolean;
};

export type MultiplayerMessage =
  | { type: "ready"; name: string }
  | { type: "input"; input: NetworkInput }
  | { type: "score"; home: number; away: number }
  | { type: "clock"; seconds: number }
  | { type: "end"; home: number; away: number };

export type MultiplayerRole = "host" | "guest";

const PREFIX = "dkl-match-";

export function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export class MultiplayerRoom {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private listeners = new Set<(message: MultiplayerMessage) => void>();
  private statusListeners = new Set<(status: string) => void>();
  role: MultiplayerRole;
  code: string;

  constructor(role: MultiplayerRole, code: string) {
    this.role = role;
    this.code = code.toUpperCase();
  }

  onMessage(listener: (message: MultiplayerMessage) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (status: string) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private status(value: string) {
    this.statusListeners.forEach((listener) => listener(value));
  }

  private attach(connection: DataConnection) {
    this.connection = connection;
    connection.on("open", () => this.status("Connected to opponent"));
    connection.on("data", (payload) => {
      if (!payload || typeof payload !== "object") return;
      this.listeners.forEach((listener) => listener(payload as MultiplayerMessage));
    });
    connection.on("close", () => this.status("Opponent disconnected"));
    connection.on("error", () => this.status("Connection error"));
  }

  connect() {
    this.status("Connecting…");
    const id = `${PREFIX}${this.code}`;
    this.peer = this.role === "host" ? new Peer(id) : new Peer();
    this.peer.on("open", () => {
      if (this.role === "host") {
        this.status("Room open — waiting for opponent");
      } else {
        const connection = this.peer?.connect(id, { reliable: true });
        if (connection) this.attach(connection);
      }
    });
    this.peer.on("connection", (connection) => {
      if (this.role === "host") this.attach(connection);
    });
    this.peer.on("error", (error) => {
      this.status(error.type === "unavailable-id" ? "Room code already in use" : "Unable to connect");
    });
  }

  send(message: MultiplayerMessage) {
    if (this.connection?.open) this.connection.send(message);
  }

  close() {
    this.connection?.close();
    this.peer?.destroy();
    this.connection = null;
    this.peer = null;
  }
}
