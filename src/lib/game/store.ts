import { useSyncExternalStore } from "react";
import {
  ATT_POS,
  CLUBS,
  DEF_POS,
  LEAGUES,
  MID_POS,
  makeMarket,
  makePlayer,
  makeStartingSquad,
  makeTable,
  overall,
  POSITIONS,
  sortTable,
  withSeed,
} from "./data";
import { makeChallenges, makeEvents, STORE_ITEMS } from "./content";
import type {
  Challenge,
  GameState,
  MatchResult,
  PlayerCard,
  Position,
  TableRow,
  TournamentState,
} from "./types";

const KEY = "football-dynasty:v3";
const VERSION = 3;

const CUP_ROUNDS = ["Quarter-final", "Semi-final", "Final"];

function makeTournament(club: string): TournamentState {
  const pool = CLUBS.filter((c) => c !== club);
  return {
    active: false,
    round: 0,
    ties: CUP_ROUNDS.map((_, i) => ({
      round: i,
      opponent: pool[(i * 3 + 1) % pool.length] as string,
      scored: null,
      conceded: null,
    })),
    won: 0,
    titles: 0,
  };
}

export function createInitialState(): GameState {
  return withSeed(20260807, () => {
    const squad = makeStartingSquad();
    return {
      version: VERSION,
      club: "Dynasty FC",
      coins: 1000,
      gems: 10,
      energy: 10,
      maxEnergy: 10,
      managerName: "New Manager",
      managerLevel: 1,
      managerXp: 0,
      reputation: 20,
      season: 1,
      league: LEAGUES[0] as string,
      leagueTier: 0,
      stadiumLevel: 1,
      youthLevel: 1,
      staff: { coach: 1, scout: 1, physio: 1 },
      trophies: 0,
      formation: "4-3-3",
      tactics: {
        mentality: "BALANCED",
        passing: "MIXED",
        pressing: "MEDIUM",
        defensiveLine: "NORMAL",
        instructions: [],
      },
      squad,
      lineup: squad.slice(0, 11).map((p) => p.id),
      captainId: squad[10]?.id ?? null,
      market: makeMarket(),
      table: makeTable("Dynasty FC"),
      settings: { difficulty: "NORMAL", matchMinutes: 3, sound: true, forceTouchControls: false },
      lastResult: null,
      notifications: ["Welcome to Football Dynasty X — your first season starts now."],
      transferHistory: [],
      challenges: makeChallenges(),
      events: makeEvents(0),
      tournament: makeTournament("Dynasty FC"),
      stats: {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        cleanSheets: 0,
        tournamentWins: 0,
      },
      ownedItems: [],
      nextMatchMode: "LEAGUE",
    };
  });
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
    // refresh event deadlines relative to now
    const now = Date.now();
    if (state.events.every((e) => e.endsAt < now)) {
      state = { ...state, events: makeEvents(now) };
    } else {
      state = {
        ...state,
        events: state.events.map((e, i) =>
          e.endsAt < now ? { ...e, endsAt: now + (i + 2) * 86_400_000, progress: 0, claimed: false } : e,
        ),
      };
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

export const XI_SIZE = 11;

export function lineupPlayers(s: GameState): PlayerCard[] {
  const byId = new Map(s.squad.map((p) => [p.id, p]));
  const picked = s.lineup.map((id) => byId.get(id)).filter((p): p is PlayerCard => Boolean(p));
  if (picked.length >= XI_SIZE) return picked.slice(0, XI_SIZE);
  const rest = s.squad.filter((p) => !picked.includes(p));
  return [...picked, ...rest].slice(0, XI_SIZE);
}

export function benchPlayers(s: GameState): PlayerCard[] {
  const xi = new Set(lineupPlayers(s).map((p) => p.id));
  return s.squad.filter((p) => !xi.has(p.id));
}

/** Fitness-adjusted effectiveness: 100 fitness = full rating, 50 = ~-10%. */
export function fitnessFactor(p: PlayerCard): number {
  return 0.8 + (Math.max(0, Math.min(100, p.fitness)) / 100) * 0.2;
}

export function effectiveOverall(p: PlayerCard): number {
  return Math.round(overall(p) * fitnessFactor(p));
}

function avg(list: PlayerCard[]): number {
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, p) => sum + effectiveOverall(p), 0) / list.length);
}

function group(s: GameState, positions: Position[]): PlayerCard[] {
  return lineupPlayers(s).filter((p) => positions.includes(p.position));
}

export function defenceRating(s: GameState): number {
  return avg(group(s, DEF_POS));
}
export function midfieldRating(s: GameState): number {
  return avg(group(s, MID_POS));
}
export function attackRating(s: GameState): number {
  return avg(group(s, ATT_POS));
}

export function teamRating(s: GameState): number {
  return avg(lineupPlayers(s));
}

export function squadMorale(s: GameState): number {
  if (!s.squad.length) return 0;
  return Math.round(s.squad.reduce((sum, p) => sum + p.morale, 0) / s.squad.length);
}

/** Seven players actually sent onto the 2D pitch, drawn from the starting XI. */
export function matchLineup(s: GameState): PlayerCard[] {
  const xi = lineupPlayers(s);
  const gk = xi.find((p) => p.position === "GK") ?? xi[0];
  const rest = xi.filter((p) => p !== gk);
  const rank = (p: PlayerCard) =>
    DEF_POS.indexOf(p.position) >= 0 ? 0 : MID_POS.indexOf(p.position) >= 0 ? 1 : 2;
  const outfield = [...rest]
    .sort((a, b) => effectiveOverall(b) - effectiveOverall(a))
    .slice(0, 6)
    .sort((a, b) => rank(a) - rank(b));
  return gk ? [gk, ...outfield] : outfield;
}

export function upgradeCost(p: PlayerCard): number {
  return 200 + p.level * 250;
}

export function xpForLevel(level: number): number {
  return 200 + level * 120;
}

export const TOURNAMENT_ROUNDS = CUP_ROUNDS;

/* ---------- helpers ---------- */

function bumpMetric(list: Challenge[], metric: Challenge["metric"], amount: number): Challenge[] {
  if (amount <= 0) return list;
  return list.map((c) =>
    c.metric === metric ? { ...c, progress: Math.min(c.target, c.progress + amount) } : c,
  );
}

function notify(s: GameState, text: string): string[] {
  return [text, ...s.notifications].slice(0, 12);
}

function addManagerXp(s: GameState, xp: number): Pick<GameState, "managerLevel" | "managerXp"> {
  let level = s.managerLevel;
  let total = s.managerXp + xp;
  while (total >= xpForLevel(level)) {
    total -= xpForLevel(level);
    level += 1;
  }
  return { managerLevel: level, managerXp: total };
}

/* ---------- actions ---------- */

export const actions = {
  setFormation(formation: GameState["formation"]) {
    setState((s) => ({ ...s, formation }));
  },
  setTactics(patch: Partial<GameState["tactics"]>) {
    setState((s) => ({ ...s, tactics: { ...s.tactics, ...patch } }));
  },
  toggleInstruction(id: string) {
    setState((s) => {
      const on = s.tactics.instructions.includes(id);
      return {
        ...s,
        tactics: {
          ...s.tactics,
          instructions: on
            ? s.tactics.instructions.filter((x) => x !== id)
            : [...s.tactics.instructions, id],
        },
      };
    });
  },
  setManagerName(name: string) {
    setState((s) => ({ ...s, managerName: name.slice(0, 24) || "New Manager" }));
  },
  setClubName(name: string) {
    setState((s) => {
      const club = name.slice(0, 24) || s.club;
      return {
        ...s,
        club,
        table: s.table.map((r) => (r.club === s.club ? { ...r, club } : r)),
      };
    });
  },
  clearNotifications() {
    setState((s) => ({ ...s, notifications: [] }));
  },

  /** Swap a starting player with a bench player (or move a slot to another player). */
  substitute(outId: string, inId: string) {
    setState((s) => {
      const lineup = lineupPlayers(s).map((p) => p.id);
      const idx = lineup.indexOf(outId);
      if (idx < 0 || lineup.includes(inId)) return s;
      if (!s.squad.some((p) => p.id === inId)) return s;
      const next = [...lineup];
      next[idx] = inId;
      return { ...s, lineup: next };
    });
  },
  /** Swap two slots in the starting XI (used by drag and drop). */
  swapLineupSlots(aIndex: number, bIndex: number) {
    setState((s) => {
      const lineup = lineupPlayers(s).map((p) => p.id);
      if (aIndex < 0 || bIndex < 0 || aIndex >= lineup.length || bIndex >= lineup.length) return s;
      const next = [...lineup];
      const a = next[aIndex] as string;
      next[aIndex] = next[bIndex] as string;
      next[bIndex] = a;
      return { ...s, lineup: next };
    });
  },
  setCaptain(id: string) {
    setState((s) => (s.squad.some((p) => p.id === id) ? { ...s, captainId: id } : s));
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
  /** Training drill: costs coins + energy, improves one attribute group. */
  trainSquad(drill: "FITNESS" | "SHOOTING" | "PASSING" | "DEFENDING" | "SPEED") {
    setState((s) => {
      const cost = 250;
      if (s.coins < cost || s.energy < 1) return s;
      const bump = (v: number) => Math.min(99, v + 1);
      const squad = s.squad.map((p) => {
        if (drill === "FITNESS") return { ...p, fitness: Math.min(100, p.fitness + 15) };
        if (drill === "SHOOTING") return { ...p, shooting: bump(p.shooting) };
        if (drill === "PASSING") return { ...p, passing: bump(p.passing) };
        if (drill === "DEFENDING") return { ...p, defense: bump(p.defense) };
        return { ...p, speed: bump(p.speed) };
      });
      return {
        ...s,
        coins: s.coins - cost,
        energy: s.energy - 1,
        squad,
        notifications: notify(s, `Training complete: ${drill.toLowerCase()} session finished.`),
      };
    });
  },

  buyPlayer(id: string) {
    setState((s) => {
      const player = s.market.find((p) => p.id === id);
      if (!player || s.coins < player.price) return s;
      const taken = new Set(s.squad.map((p) => p.number));
      let number = player.number;
      while (taken.has(number)) number = number >= 45 ? 2 : number + 1;
      return {
        ...s,
        coins: s.coins - player.price,
        squad: [...s.squad, { ...player, number }],
        market: s.market.filter((p) => p.id !== id),
        transferHistory: [
          {
            id: player.id,
            name: player.name,
            position: player.position,
            type: "IN" as const,
            fee: player.price,
            season: s.season,
          },
          ...s.transferHistory,
        ].slice(0, 40),
        notifications: notify(s, `${player.name} signed for ${player.price.toLocaleString()} coins.`),
      };
    });
  },
  sellPlayer(id: string) {
    setState((s) => {
      const player = s.squad.find((p) => p.id === id);
      if (!player || s.squad.length <= XI_SIZE + 1) return s;
      const fee = Math.round(player.price * 0.6);
      return {
        ...s,
        coins: s.coins + fee,
        squad: s.squad.filter((p) => p.id !== id),
        lineup: s.lineup.filter((x) => x !== id),
        captainId: s.captainId === id ? null : s.captainId,
        transferHistory: [
          {
            id: player.id,
            name: player.name,
            position: player.position,
            type: "OUT" as const,
            fee,
            season: s.season,
          },
          ...s.transferHistory,
        ].slice(0, 40),
        notifications: notify(s, `${player.name} sold for ${fee.toLocaleString()} coins.`),
      };
    });
  },

  refreshMarket() {
    setState((s) => ({ ...s, market: makeMarket(12, 64 + s.leagueTier * 4 + s.staff.scout * 2) }));
  },
  upgradeStadium() {
    setState((s) => {
      const cost = s.stadiumLevel * 1500;
      if (s.coins < cost) return s;
      return {
        ...s,
        coins: s.coins - cost,
        stadiumLevel: s.stadiumLevel + 1,
        reputation: s.reputation + 5,
        notifications: notify(s, `Stadium upgraded to level ${s.stadiumLevel + 1}.`),
      };
    });
  },
  upgradeYouth() {
    setState((s) => {
      const cost = s.youthLevel * 1200;
      if (s.coins < cost) return s;
      return {
        ...s,
        coins: s.coins - cost,
        youthLevel: s.youthLevel + 1,
        reputation: s.reputation + 3,
        notifications: notify(s, `Youth academy upgraded to level ${s.youthLevel + 1}.`),
      };
    });
  },
  promoteYouthPlayer() {
    setState((s) => {
      const cost = 400;
      if (s.coins < cost) return s;
      const base = 58 + s.youthLevel * 3;
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)] as Position;
      const taken = new Set(s.squad.map((p) => p.number));
      let number = 2;
      while (taken.has(number)) number += 1;
      const kid = makePlayer(pos, base, undefined, number);
      kid.age = 17 + (s.youthLevel % 3);
      return {
        ...s,
        coins: s.coins - cost,
        squad: [...s.squad, kid],
        notifications: notify(s, `Academy graduate ${kid.name} (${kid.position}) joins the first team.`),
      };
    });
  },
  upgradeStaff(role: "coach" | "scout" | "physio") {
    setState((s) => {
      const level = s.staff[role];
      const cost = level * 900;
      if (s.coins < cost) return s;
      return {
        ...s,
        coins: s.coins - cost,
        staff: { ...s.staff, [role]: level + 1 },
        notifications: notify(s, `${role} upgraded to level ${level + 1}.`),
      };
    });
  },

  buyStoreItem(itemId: string) {
    setState((s) => {
      const item = STORE_ITEMS.find((i) => i.id === itemId);
      if (!item) return s;
      if (!item.repeatable && s.ownedItems.includes(item.id)) return s;
      if (s.coins < item.costCoins || s.gems < item.costGems) return s;

      let next: GameState = {
        ...s,
        coins: s.coins - item.costCoins,
        gems: s.gems - item.costGems,
        ownedItems: item.repeatable ? s.ownedItems : [...s.ownedItems, item.id],
      };

      const addPlayer = (base: number) => {
        const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)] as Position;
        const taken = new Set(next.squad.map((p) => p.number));
        let number = 2;
        while (taken.has(number)) number += 1;
        const p = makePlayer(pos, base, undefined, number);
        next = {
          ...next,
          squad: [...next.squad, p],
          notifications: notify(next, `${p.name} (${p.position} · ${overall(p)}) joined from a pack.`),
        };
      };

      if (item.id === "pack-bronze") addPlayer(66 + next.leagueTier * 2);
      if (item.id === "pack-gold") addPlayer(76 + next.leagueTier * 2);
      if (item.id === "pack-scout") next = { ...next, market: makeMarket(12, 66 + next.leagueTier * 4) };
      if (item.id === "train-recovery")
        next = { ...next, squad: next.squad.map((p) => ({ ...p, fitness: 100 })) };
      if (item.id === "train-morale")
        next = {
          ...next,
          squad: next.squad.map((p) => ({ ...p, morale: Math.min(100, p.morale + 20) })),
        };
      if (item.id === "train-energy") next = { ...next, energy: next.maxEnergy };
      if (item.id === "club-floodlights" || item.id === "club-pitch")
        next = { ...next, reputation: next.reputation + 5 };

      return next;
    });
  },

  claimChallenge(id: string) {
    setState((s) => {
      const c = s.challenges.find((x) => x.id === id);
      if (!c || c.claimed || c.progress < c.target) return s;
      return {
        ...s,
        coins: s.coins + c.rewardCoins,
        gems: s.gems + c.rewardGems,
        challenges: s.challenges.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
        notifications: notify(s, `Challenge complete: ${c.label}.`),
      };
    });
  },
  resetChallenges() {
    setState((s) => ({ ...s, challenges: makeChallenges() }));
  },
  claimEvent(id: string) {
    setState((s) => {
      const e = s.events.find((x) => x.id === id);
      if (!e || e.claimed || e.progress < e.target) return s;
      return {
        ...s,
        coins: s.coins + e.rewardCoins,
        gems: s.gems + e.rewardGems,
        events: s.events.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
        notifications: notify(s, `Event reward claimed: ${e.name}.`),
      };
    });
  },

  setNextMatchMode(mode: GameState["nextMatchMode"]) {
    setState((s) => ({ ...s, nextMatchMode: mode }));
  },
  enterTournament() {
    setState((s) => {
      if (s.tournament.active) return s;
      const cost = 500;
      if (s.coins < cost) return s;
      const fresh = makeTournament(s.club);
      return {
        ...s,
        coins: s.coins - cost,
        tournament: { ...fresh, active: true, titles: s.tournament.titles },
        nextMatchMode: "TOURNAMENT",
        notifications: notify(s, "Entered the Dynasty Cup — quarter-final up next."),
      };
    });
  },
  restoreEnergy(amount = 1) {
    setState((s) => ({ ...s, energy: Math.min(s.maxEnergy, s.energy + amount) }));
  },
  updateSettings(patch: Partial<GameState["settings"]>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  resetSave() {
    setState(() => createInitialState());
  },

  recordMatch(result: MatchResult) {
    setState((s) => {
      const isCup = result.mode === "TOURNAMENT" && s.tournament.active;
      const table = isCup ? s.table : simulateRound(s.table, s.club, result);
      const xi = new Set(lineupPlayers(s).map((p) => p.id));
      const moraleShift = result.outcome === "WIN" ? 8 : result.outcome === "DRAW" ? 1 : -7;
      const recovery = 10 + s.staff.physio * 2;

      const squad = s.squad.map((p) => {
        const clampF = (v: number) => Math.max(35, Math.min(100, Math.round(v)));
        const morale = Math.max(10, Math.min(100, p.morale + moraleShift));
        if (!xi.has(p.id)) return { ...p, morale, fitness: clampF(p.fitness + recovery) };
        const drop = 16 - (p.stamina - 60) * 0.12;
        const fitness = clampF(p.fitness - Math.max(6, drop));
        const xp = p.xp + result.xp + s.staff.coach * 2;
        const levels = Math.floor(xp / 100);
        if (levels <= 0) return { ...p, xp, fitness, morale };
        return {
          ...p,
          xp: xp % 100,
          fitness,
          morale,
          level: p.level + levels,
          shooting: Math.min(99, p.shooting + levels),
          passing: Math.min(99, p.passing + levels),
          defense: Math.min(99, p.defense + levels),
        };
      });

      // tournament progression
      let tournament = s.tournament;
      let cupWin = 0;
      let titles = s.tournament.titles;
      let trophies = s.trophies;
      if (isCup) {
        const ties = tournament.ties.map((t) =>
          t.round === tournament.round ? { ...t, scored: result.scored, conceded: result.conceded } : t,
        );
        if (result.outcome === "WIN") {
          cupWin = 1;
          const nextRound = tournament.round + 1;
          const finished = nextRound >= ties.length;
          if (finished) {
            titles += 1;
            trophies += 1;
          }
          tournament = {
            ...tournament,
            ties,
            round: finished ? tournament.round : nextRound,
            won: tournament.won + 1,
            active: !finished,
            titles,
          };
        } else {
          tournament = { ...tournament, ties, active: false };
        }
      }

      const cleanSheet = result.conceded === 0 ? 1 : 0;
      let challenges = bumpMetric(s.challenges, "MATCHES", 1);
      challenges = bumpMetric(challenges, "GOALS", result.scored);
      challenges = bumpMetric(challenges, "WINS", result.outcome === "WIN" ? 1 : 0);
      challenges = bumpMetric(challenges, "CLEAN_SHEETS", cleanSheet);
      challenges = bumpMetric(challenges, "TOURNAMENT_WINS", cupWin);

      const events = s.events.map((e) => {
        const add =
          e.metric === "GOALS"
            ? result.scored
            : e.metric === "MATCHES"
              ? 1
              : e.metric === "WINS"
                ? result.outcome === "WIN"
                  ? 1
                  : 0
                : e.metric === "CLEAN_SHEETS"
                  ? cleanSheet
                  : cupWin;
        return add ? { ...e, progress: Math.min(e.target, e.progress + add) } : e;
      });

      return {
        ...s,
        coins: s.coins + result.coins,
        energy: Math.max(0, s.energy - 1),
        ...addManagerXp(s, result.xp + result.scored * 5),
        squad,
        table,
        tournament,
        trophies,
        reputation: s.reputation + (result.outcome === "WIN" ? 2 : result.outcome === "DRAW" ? 1 : 0),
        challenges,
        events,
        stats: {
          matches: s.stats.matches + 1,
          wins: s.stats.wins + (result.outcome === "WIN" ? 1 : 0),
          draws: s.stats.draws + (result.outcome === "DRAW" ? 1 : 0),
          losses: s.stats.losses + (result.outcome === "LOSS" ? 1 : 0),
          goalsFor: s.stats.goalsFor + result.scored,
          goalsAgainst: s.stats.goalsAgainst + result.conceded,
          cleanSheets: s.stats.cleanSheets + cleanSheet,
          tournamentWins: s.stats.tournamentWins + cupWin,
        },
        nextMatchMode: isCup && tournament.active ? "TOURNAMENT" : "LEAGUE",
        lastResult: result,
        notifications: notify(
          s,
          `${result.outcome} ${result.scored}–${result.conceded} vs ${result.opponent}.`,
        ),
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
        gems: s.gems + (champion ? 10 : 3),
        energy: s.maxEnergy,
        reputation: s.reputation + (champion ? 15 : 5),
        table: makeTable(s.club),
        market: makeMarket(12, 66 + tier * 4),
        challenges: makeChallenges(),
        squad: s.squad.map((p) => ({ ...p, fitness: 100, morale: 80, age: p.age + 1 })),
        notifications: notify(
          s,
          champion
            ? `Champions! ${promoted ? "Promoted to " + LEAGUES[tier] : "Title retained"}.`
            : `Season ${s.season} complete — finishing the campaign in ${LEAGUES[tier]}.`,
        ),
      };
    });
  },
};

function simulateRound(table: TableRow[], club: string, result: MatchResult): TableRow[] {
  const rows = table.map((r) => ({ ...r, form: [...r.form] }));
  const pushForm = (r: TableRow, f: "W" | "D" | "L") => {
    r.form = [f, ...r.form].slice(0, 5);
  };
  const mine = rows.find((r) => r.club === club);
  const foe = rows.find((r) => r.club === result.opponent) ?? rows.find((r) => r.club !== club);
  if (mine) {
    mine.played += 1;
    mine.gf += result.scored;
    mine.ga += result.conceded;
    if (result.outcome === "WIN") {
      mine.wins += 1;
      pushForm(mine, "W");
    } else if (result.outcome === "DRAW") {
      mine.draws += 1;
      pushForm(mine, "D");
    } else {
      mine.losses += 1;
      pushForm(mine, "L");
    }
  }
  if (foe) {
    foe.played += 1;
    foe.gf += result.conceded;
    foe.ga += result.scored;
    if (result.outcome === "WIN") {
      foe.losses += 1;
      pushForm(foe, "L");
    } else if (result.outcome === "DRAW") {
      foe.draws += 1;
      pushForm(foe, "D");
    } else {
      foe.wins += 1;
      pushForm(foe, "W");
    }
  }
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
      pushForm(a, "W");
      pushForm(b, "L");
    } else if (ga < gb) {
      b.wins += 1;
      a.losses += 1;
      pushForm(b, "W");
      pushForm(a, "L");
    } else {
      a.draws += 1;
      b.draws += 1;
      pushForm(a, "D");
      pushForm(b, "D");
    }
  }
  return rows;
}

export function nextOpponent(s: GameState): string {
  if (s.nextMatchMode === "TOURNAMENT" && s.tournament.active) {
    return s.tournament.ties[s.tournament.round]?.opponent ?? CLUBS[1] ?? "Royal United";
  }
  const pool = CLUBS.filter((c) => c !== s.club);
  const idx = s.table.find((r) => r.club === s.club)?.played ?? 0;
  return pool[idx % pool.length] as string;
}

/** Remaining league fixtures for the club, in order. */
export function fixtureList(s: GameState, count = 5): string[] {
  const pool = CLUBS.filter((c) => c !== s.club);
  const played = s.table.find((r) => r.club === s.club)?.played ?? 0;
  return Array.from({ length: count }, (_, i) => pool[(played + i) % pool.length] as string);
}

export function sortTablePosition(s: GameState): number {
  return sortTable(s.table).findIndex((r) => r.club === s.club) + 1;
}
