import Peer, { type DataConnection } from "peerjs";
import type { MatchSnapshot } from "./netcode";
import type { PlayerCard } from "./types";

export type NetworkInput = {
  dx: number;
  dy: number;
  sprint: boolean;
  pass: boolean;
  shoot: boolean;
  tackle: boolean;
};

export type TeamPayload = {
  name: string;
  club: string;
  rating: number;
  lineup: PlayerCard[];
};

export type MultiplayerMessage =
  | { type: "hello"; team: TeamPayload }
  | { type: "ready" }
  | { type: "start"; seconds: number }
  | { type: "input"; input: NetworkInput }
  | { type: "snapshot"; snap: MatchSnapshot }
  | { type: "score"; home: number; away: number }
  | { type: "clock"; seconds: number }
  | { type: "end"; home: number; away: number };

export type MultiplayerRole = "host" | "guest";
export type ConnectionState = "idle" | "connecting" | "waiting" | "connected" | "closed" | "error";

const PREFIX = "fdx-match-";

export function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export class MultiplayerRoom {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private listeners = new Set<(message: MultiplayerMessage) => void>();
  private statusListeners = new Set<(status: string, state: ConnectionState) => void>();
  role: MultiplayerRole;
  code: string;
  state: ConnectionState = "idle";

  constructor(role: MultiplayerRole, code: string) {
    this.role = role;
    this.code = code.toUpperCase();
  }

  onMessage(listener: (message: MultiplayerMessage) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (status: string, state: ConnectionState) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  get connected() {
    return Boolean(this.connection?.open);
  }

  private status(value: string, state: ConnectionState) {
    this.state = state;
    this.statusListeners.forEach((listener) => listener(value, state));
  }

  private attach(connection: DataConnection) {
    this.connection = connection;
    connection.on("open", () => this.status("Connected to opponent", "connected"));
    connection.on("data", (payload) => {
      if (!payload || typeof payload !== "object") return;
      this.listeners.forEach((listener) => listener(payload as MultiplayerMessage));
    });
    connection.on("close", () => this.status("Opponent disconnected", "closed"));
    connection.on("error", () => this.status("Connection error", "error"));
  }

  connect() {
    this.status("Connecting…", "connecting");
    const id = `${PREFIX}${this.code}`;
    this.peer = this.role === "host" ? new Peer(id) : new Peer();
    this.peer.on("open", () => {
      if (this.role === "host") {
        this.status("Room open — waiting for opponent", "waiting");
      } else {
        const connection = this.peer?.connect(id, { reliable: true });
        if (connection) this.attach(connection);
      }
    });
    this.peer.on("connection", (connection) => {
      if (this.role === "host") this.attach(connection);
    });
    this.peer.on("error", (error) => {
      this.status(
        error.type === "unavailable-id"
          ? "Room code already in use"
          : error.type === "peer-unavailable"
            ? "No room found for that code"
            : "Unable to connect",
        "error",
      );
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
    this.status("Disconnected", "closed");
  }
}
