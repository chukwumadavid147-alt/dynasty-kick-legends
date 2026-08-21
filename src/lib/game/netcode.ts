/** Compact wire format for host-authoritative match sync. */

export type ActorSnap = [x: number, y: number];

export interface MatchSnapshot {
  /** monotonic sequence number, older packets are dropped */
  seq: number;
  /** flattened actor positions, rounded to whole pitch units */
  a: number[];
  /** ball x, y */
  b: [number, number];
  /** index of the home / away controlled actor */
  c: [number, number];
  /** score */
  s: [number, number];
  /** clock seconds remaining */
  t: number;
  /** celebration timer (goal overlay) */
  g: number;
}

export function encodeSnapshot(snapshot: MatchSnapshot): MatchSnapshot {
  return {
    seq: snapshot.seq,
    a: snapshot.a.map((v) => Math.round(v)),
    b: [Math.round(snapshot.b[0]), Math.round(snapshot.b[1])],
    c: snapshot.c,
    s: snapshot.s,
    t: Math.round(snapshot.t * 10) / 10,
    g: Math.round(snapshot.g * 100) / 100,
  };
}

export function isNewer(next: MatchSnapshot, current: MatchSnapshot | null) {
  return !current || next.seq > current.seq;
}

/** Snapshot send rate for the host simulation. */
export const SNAPSHOT_HZ = 20;
