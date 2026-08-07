import { useSyncExternalStore } from "react";
import {
  CLUBS,
  LEAGUES,
  makeMarket,
  makeStartingSquad,
  makeTable,
  overall,
  sortTable,
} from "./data";
import type { GameState, MatchResult, PlayerCard, TableRow } from "./types";

const KEY = "football-dynasty:v1";
const VERSION = 1;

export function createInitialState(): GameState {
  const squad = makeStartingSquad();
  return {
    version: VERSION,
    club: "Dynasty FC",
    coins: 1000,
    season: 1,
    league: LEAGUES[0] as string,
    leagueTier: 0,
    stadiumLevel: 1,
    trophies: 0,
    formation: "4-3-3",
    squad,
    lineup: squad.slice(0, 7).map((p) => p.id),
    market: makeMarket(),
    table: makeTable("Dynasty FC"),
    settings: { difficulty: "NORMAL", matchMinutes: 3, sound: true, forceTouchControls: false },
    lastResult: null,
  };
}

let state: GameState = createInitialState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed && parsed.version === VERSION && Array.isArray(parsed.squad)) {
        state = { ...createInitialState(), ...parsed };
      }
    }
  } catch {
    /* ignore corrupt save */
  }
  emit();
}

export function setState(update: (s: GameState) => GameState) {
  state = update(state);
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const serverState = createInitialState();
const getServerSnapshot = () => serverState;

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

/* ---------- derived ---------- */

export function lineupPlayers(s: GameState): PlayerCard[] {
  const byId = new Map(s.squad.map((p) => [p.id, p]));
  const picked = s.lineup.map((id) => byId.get(id)).filter((p): p is PlayerCard => Boolean(p));
  if (picked.length >= 7) return picked.slice(0, 7);
  const rest = s.squad.filter((p) => !picked.includes(p));
  return [...picked, ...rest].slice(0, 7);
}

export function teamRating(s: GameState): number {
  const xi = lineupPlayers(s);
  if (!xi.length) return 0;
  return Math.round(xi.reduce((sum, p) => sum + overall(p), 0) / xi.length);
}

export function upgradeCost(p: PlayerCard): number {
  return 200 + p.level * 250;
}

/* ---------- actions ---------- */

export const actions = {
  setFormation(formation: GameState["formation"]) {
    setState((s) => ({ ...s, formation }));
  },
  toggleLineup(id: string) {
    setState((s) => {
      const inLineup = s.lineup.includes(id);
      if (inLineup) return { ...s, lineup: s.lineup.filter((x) => x !== id) };
      if (s.lineup.length >= 7) return s;
      return { ...s, lineup: [...s.lineup, id] };
    });
  },
  upgradePlayer(id: string) {
    setState((s) => {
      const player = s.squad.find((p) => p.id === id);
      if (!player) return s;
      const cost = upgradeCost(player);
      if (s.coins < cost) return s;
      const bump = (v: number) => Math.min(99, v + 2);
      return {
        ...s,
        coins: s.coins - cost,
        squad: s.squad.map((p) =>
          p.id === id
            ? {
                ...p,
                level: p.level + 1,
                speed: bump(p.speed),
                shooting: bump(p.shooting),
                passing: bump(p.passing),
                defense: bump(p.defense),
                stamina: bump(p.stamina),
              }
            : p,
        ),
      };
    });
  },
  buyPlayer(id: string) {
    setState((s) => {
      const player = s.market.find((p) => p.id === id);
      if (!player || s.coins < player.price) return s;
      return {
        ...s,
        coins: s.coins - player.price,
        squad: [...s.squad, player],
        market: s.market.filter((p) => p.id !== id),
      };
    });
  },
  sellPlayer(id: string) {
    setState((s) => {
      const player = s.squad.find((p) => p.id === id);
      if (!player || s.squad.length <= 8) return s;
      return {
        ...s,
        coins: s.coins + Math.round(player.price * 0.6),
        squad: s.squad.filter((p) => p.id !== id),
        lineup: s.lineup.filter((x) => x !== id),
      };
    });
  },
  refreshMarket() {
    setState((s) => ({ ...s, market: makeMarket(12, 66 + s.leagueTier * 4) }));
  },
  upgradeStadium() {
    setState((s) => {
      const cost = s.stadiumLevel * 1500;
      if (s.coins < cost) return s;
      return { ...s, coins: s.coins - cost, stadiumLevel: s.stadiumLevel + 1 };
    });
  },
  updateSettings(patch: Partial<GameState["settings"]>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  resetSave() {
    setState(() => createInitialState());
  },
  recordMatch(result: MatchResult) {
    setState((s) => {
      const table = simulateRound(s.table, s.club, result);
      const xi = new Set(s.lineup);
      const squad = s.squad.map((p) => {
        if (!xi.has(p.id)) return p;
        const xp = p.xp + result.xp;
        const levels = Math.floor(xp / 100);
        if (levels <= 0) return { ...p, xp };
        return {
          ...p,
          xp: xp % 100,
          level: p.level + levels,
          shooting: Math.min(99, p.shooting + levels),
          passing: Math.min(99, p.passing + levels),
          defense: Math.min(99, p.defense + levels),
        };
      });
      return {
        ...s,
        coins: s.coins + result.coins,
        squad,
        table,
        lastResult: result,
      };
    });
  },
  endSeason() {
    setState((s) => {
      const standings = sortTable(s.table);
      const champion = standings[0]?.club === s.club;
      const promoted = champion && s.leagueTier < LEAGUES.length - 1;
      const tier = promoted ? s.leagueTier + 1 : s.leagueTier;
      return {
        ...s,
        season: s.season + 1,
        leagueTier: tier,
        league: LEAGUES[tier] as string,
        trophies: s.trophies + (champion ? 1 : 0),
        coins: s.coins + (champion ? 2000 : 500),
        table: makeTable(s.club),
        market: makeMarket(12, 66 + tier * 4),
      };
    });
  },
};

function simulateRound(table: TableRow[], club: string, result: MatchResult): TableRow[] {
  const rows = table.map((r) => ({ ...r }));
  const mine = rows.find((r) => r.club === club);
  const foe = rows.find((r) => r.club === result.opponent) ?? rows.find((r) => r.club !== club);
  if (mine) {
    mine.played += 1;
    mine.gf += result.scored;
    mine.ga += result.conceded;
    if (result.outcome === "WIN") mine.wins += 1;
    else if (result.outcome === "DRAW") mine.draws += 1;
    else mine.losses += 1;
  }
  if (foe) {
    foe.played += 1;
    foe.gf += result.conceded;
    foe.ga += result.scored;
    if (result.outcome === "WIN") foe.losses += 1;
    else if (result.outcome === "DRAW") foe.draws += 1;
    else foe.wins += 1;
  }
  // simulate the rest of the round between the remaining clubs
  const others = rows.filter((r) => r !== mine && r !== foe);
  for (let i = 0; i + 1 < others.length; i += 2) {
    const a = others[i] as TableRow;
    const b = others[i + 1] as TableRow;
    const ga = Math.floor(Math.random() * 4);
    const gb = Math.floor(Math.random() * 4);
    a.played += 1;
    b.played += 1;
    a.gf += ga;
    a.ga += gb;
    b.gf += gb;
    b.ga += ga;
    if (ga > gb) {
      a.wins += 1;
      b.losses += 1;
    } else if (ga < gb) {
      b.wins += 1;
      a.losses += 1;
    } else {
      a.draws += 1;
      b.draws += 1;
    }
  }
  return rows;
}

export function nextOpponent(s: GameState): string {
  const pool = CLUBS.filter((c) => c !== s.club);
  const idx = s.table.find((r) => r.club === s.club)?.played ?? 0;
  return pool[idx % pool.length] as string;
}
