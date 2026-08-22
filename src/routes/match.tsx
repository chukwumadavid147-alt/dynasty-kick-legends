import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { ActionButton, Joystick } from "@/components/game/TouchControls";
import { opponentXI, overall } from "@/lib/game/data";
import { MatchEngine, type Input } from "@/lib/game/engine";
import { actions, hydrate, lineupPlayers, matchLineup, nextOpponent, useGame } from "@/lib/game/store";
import type { Difficulty, MatchResult, PlayerCard } from "@/lib/game/types";
import { makeRoomCode, MultiplayerRoom } from "@/lib/game/multiplayer";


export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Play a Match — Football Dynasty" },
      {
        name: "description",
        content:
          "Kick off a 2D football match: move, pass, shoot and tackle with keyboard or touch controls across three difficulty levels.",
      },
      { property: "og:title", content: "Play a Match — Football Dynasty" },
      {
        property: "og:description",
        content: "Arcade 2D football match with keyboard and on-screen touch controls.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search['code'] === "string" ? (search['code'] as string).toUpperCase().slice(0, 6) : undefined,
    role: search['role'] === "guest" ? ("guest" as const) : search['role'] === "host" ? ("host" as const) : undefined,
  }),
  component: MatchPage,
});

const DIFFS: Difficulty[] = ["EASY", "NORMAL", "HARD"];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TeamSheet({
  club,
  players,
  accent,
  formation,
  captainId,
  starters,
}: {
  club: string;
  players: PlayerCard[];
  accent: "gold" | "muted";
  formation: string;
  captainId?: string | null;
  starters?: number;
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-2">
        <p
          className={`truncate text-sm font-black uppercase tracking-wide ${
            accent === "gold" ? "text-gold" : "text-foreground"
          }`}
        >
          {club}
        </p>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          {formation}
        </span>
      </div>
      <ul className="mt-3 space-y-1">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
              starters !== undefined && i < starters ? "bg-primary/10" : ""
            }`}
          >
            <span className="w-6 shrink-0 text-right font-black tabular-nums text-muted-foreground">
              {p.number}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
              {p.name}
              {captainId === p.id && (
                <span className="ml-1 rounded bg-gold/20 px-1 text-[0.55rem] font-black text-gold">C</span>
              )}
            </span>
            <span className="w-9 shrink-0 text-[0.6rem] font-bold uppercase text-muted-foreground">
              {p.position}
            </span>
            <span className="w-6 shrink-0 text-right font-black tabular-nums text-gold">
              {overall(p)}
            </span>
          </li>
        ))}
      </ul>
      {starters !== undefined && (
        <p className="mt-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          Highlighted players take the pitch
        </p>
      )}
    </div>
  );
}



function MatchPage() {
  const game = useGame();
  const search = Route.useSearch();
  useEffect(() => hydrate(), []);

  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>(game.settings.difficulty);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [clock, setClock] = useState(game.settings.matchMinutes * 60);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [mode, setMode] = useState<"offline" | "online">(search.code ? "online" : "offline");
  const [role, setRole] = useState<"host" | "guest">(search.role ?? "host");
  const [roomCode, setRoomCode] = useState(search.code ?? "");
  const [roomStatus, setRoomStatus] = useState("");
  const [remoteTeam, setRemoteTeam] = useState<TeamPayload | null>(null);
  const roomRef = useRef<MultiplayerRoom | null>(null);
  const opponent = mode === "online" ? (remoteTeam?.club ?? "Online Rival") : nextOpponent(game);

  const pitchIds = useMemo(() => new Set(matchLineup(game).map((p) => p.id)), [game]);
  const homeSheet = useMemo(() => {
    const xi = lineupPlayers(game);
    return [...xi].sort((a, b) => Number(pitchIds.has(b.id)) - Number(pitchIds.has(a.id)));
  }, [game, pitchIds]);
  const awaySheet = useMemo(
    () =>
      mode === "online"
        ? (remoteTeam?.lineup ?? [])
        : opponentXI(opponent, game.formation, 62 + game.leagueTier * 3),
    [mode, remoteTeam, opponent, game.formation, game.leagueTier],
  );

  // Squad payload we hand to the opponent so they play against our real team.
  const myTeam = useMemo<TeamPayload>(
    () => ({
      name: game.managerName,
      club: game.club,
      rating: teamRating(game),
      lineup: matchLineup(game),
    }),
    [game],
  );
  const myTeamRef = useRef(myTeam);
  useEffect(() => {
    myTeamRef.current = myTeam;
  }, [myTeam]);



  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MatchEngine | null>(null);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (mode !== "online" || roomCode.length !== 6) return;
    const room = new MultiplayerRoom(role, roomCode);
    roomRef.current = room;
    const stopStatus = room.onStatus((status, state) => {
      setRoomStatus(status);
      // Exchange team sheets as soon as the peer link opens.
      if (state === "connected") room.send({ type: "hello", team: myTeamRef.current });
    });
    const stopMessages = room.onMessage((message) => {
      if (message.type === "hello") setRemoteTeam(message.team);
      if (message.type === "input") engineRef.current?.setRemoteInput(message.input);
      if (message.type === "snapshot" && role === "guest") engineRef.current?.applySnapshot(message.snap);
      if (message.type === "start" && role === "guest") {
        setScore({ home: 0, away: 0 });
        setClock(message.seconds);
        setResult(null);
        setPhase("playing");
      }
      if (message.type === "score" && role === "guest") setScore({ home: message.home, away: message.away });
      if (message.type === "clock" && role === "guest") setClock(message.seconds);
      if (message.type === "end" && role === "guest") finishRef.current?.(message.home, message.away);
    });
    room.connect();
    return () => {
      stopStatus();
      stopMessages();
      room.close();
      roomRef.current = null;
    };
  }, [mode, role, roomCode]);

  const finishRef = useRef<(home: number, away: number) => void>(() => undefined);

  const finish = useCallback(
    (home: number, away: number) => {
      const outcome = home > away ? "WIN" : home === away ? "DRAW" : "LOSS";
      const coins =
        (outcome === "WIN" ? 350 : outcome === "DRAW" ? 160 : 70) +
        home * 45 +
        (difficulty === "HARD" ? 200 : difficulty === "NORMAL" ? 90 : 0);
      const xp = outcome === "WIN" ? 45 : outcome === "DRAW" ? 28 : 16;
      const res: MatchResult = {
        scored: home,
        conceded: away,
        outcome,
        coins,
        xp,
        opponent,
        difficulty,
        mode: "LEAGUE",
      };
      setResult(res);
      setPhase("done");
      actions.recordMatch(res);
      if (mode === "online" && role === "host") roomRef.current?.send({ type: "end", home, away });
    },
    [difficulty, mode, opponent, role],
  );

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const engine = new MatchEngine(
      canvas,
      matchLineup(game),
      game.formation,
      difficulty,
      game.settings.matchMinutes * 60,
      {
        onScore: (h, a) => {
          setScore({ home: h, away: a });
          if (mode === "online" && role === "host") roomRef.current?.send({ type: "score", home: h, away: a });
        },
        onClock: (s) => {
          setClock(s);
          if (mode === "online" && role === "host" && Math.floor(s * 10) % 10 === 0) roomRef.current?.send({ type: "clock", seconds: s });
        },
        onEnd: (h, a) => finish(h, a),
      },
      mode === "online" && role === "guest" ? "away" : "home",
    );
    engineRef.current = engine;
    engine.start();

    const applyKeys = () => {
      const k = keys.current;
      const input: Input = engine.input;
      input.dx = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
      input.dy = (k["s"] || k["arrowdown"] ? 1 : 0) - (k["w"] || k["arrowup"] ? 1 : 0);
      input.sprint = Boolean(k["shift"]);
      roomRef.current?.send({ type: "input", input: { ...input } });
    };
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault();
      keys.current[key === " " ? "space" : key] = true;
      if (key === " ") engine.input.pass = true;
      if (key === "j") engine.input.shoot = true;
      if (key === "k") engine.input.tackle = true;
      applyKeys();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase() === " " ? "space" : e.key.toLowerCase()] = false;
      applyKeys();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      engine.stop();
      engineRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, difficulty, mode, role]);

  const joystick = useCallback((dx: number, dy: number) => {
    const e = engineRef.current;
    if (e) {
      e.input.dx = dx;
      e.input.dy = dy;
      roomRef.current?.send({ type: "input", input: { ...e.input } });
    }
  }, []);

  const sendAction = useCallback((key: "pass" | "shoot" | "tackle") => {
    const e = engineRef.current;
    if (!e) return;
    e.input[key] = true;
    roomRef.current?.send({ type: "input", input: { ...e.input } });
  }, []);

  const startMatch = () => {
    setScore({ home: 0, away: 0 });
    setClock(game.settings.matchMinutes * 60);
    setResult(null);
    setPhase("playing");
  };

  if (phase === "setup") {
    return (
      <GameShell title={`${game.club} vs ${opponent}`}>
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Kick off</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {game.formation} · {game.settings.matchMinutes} minute match
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
            <button onClick={() => setMode("offline")} className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${mode === "offline" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>Quick match</button>
            <button onClick={() => setMode("online")} className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${mode === "online" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>Play online</button>
          </div>
          {mode === "online" && (
            <div className="mt-4 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setRole("host"); setRoomCode(makeRoomCode()); }} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide ${role === "host" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>Create room</button>
                <button onClick={() => setRole("guest")} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide ${role === "guest" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>Join room</button>
              </div>
              <div className="mt-3 flex gap-2">
                <input value={roomCode} maxLength={6} onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder={role === "host" ? "ROOM CODE" : "ENTER CODE"} className="min-w-0 flex-1 rounded-xl bg-card px-3 py-2 text-sm font-black tracking-[0.25em] text-foreground outline-none ring-1 ring-border" />
                {role === "guest" && <button onClick={() => setRoomCode(roomCode.trim())} className="rounded-xl bg-card px-4 py-2 text-xs font-black uppercase ring-1 ring-border">Connect</button>}
              </div>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{roomStatus || (role === "host" ? "Create a room and share the code." : "Enter your opponent's room code.")}</p>
            </div>
          )}
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Difficulty
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIFFS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-xl px-5 py-3 text-sm font-extrabold uppercase tracking-wide ring-1 transition-colors ${
                  difficulty === d
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-secondary text-secondary-foreground ring-border hover:ring-primary/50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TeamSheet
              club={game.club}
              players={homeSheet}
              accent="gold"
              formation={game.formation}
              captainId={game.captainId}
              starters={7}
            />
            <TeamSheet
              club={opponent}
              players={awaySheet}
              accent="muted"
              formation={game.formation}
            />
          </div>
          <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>Desktop: WASD / arrows move · Space pass · J shoot · K tackle · Shift sprint</p>
            <p>Mobile: joystick to move, buttons for pass, shoot, tackle and sprint</p>
          </div>

          <button
            onClick={startMatch}
            disabled={mode === "online" && !roomStatus.includes("Connected")}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-base font-black uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === "online" ? "Start online match" : "Start match"}
          </button>
        </div>
      </GameShell>
    );
  }

  if (phase === "done" && result) {
    return (
      <GameShell title="Full time">
        <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Final score</p>
          <p className="mt-3 text-5xl font-black tabular-nums text-foreground sm:text-7xl">
            {result.scored} – {result.conceded}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {game.club} vs {result.opponent} · {result.difficulty}
          </p>
          <p
            className={`mt-5 inline-block rounded-full px-6 py-2 text-lg font-black uppercase tracking-widest ${
              result.outcome === "WIN"
                ? "bg-primary/20 text-primary"
                : result.outcome === "DRAW"
                  ? "bg-gold/20 text-gold"
                  : "bg-destructive/20 text-destructive"
            }`}
          >
            {result.outcome}
          </p>
          <dl className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4 text-left">
            {[
              ["Goals scored", result.scored],
              ["Goals conceded", result.conceded],
              ["Coins earned", `+${result.coins.toLocaleString()}`],
              ["Player XP", `+${result.xp}`],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-secondary px-4 py-3">
                <dt className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="text-lg font-extrabold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setPhase("setup")}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
            >
              Play again
            </button>
            <Link
              to="/dynasty"
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-secondary-foreground ring-1 ring-border"
            >
              Return to dynasty
            </Link>
            <Link
              to="/squad"
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-secondary-foreground ring-1 ring-border"
            >
              View squad
            </Link>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <div className="min-h-screen bg-background px-2 py-3 sm:px-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex items-center justify-between rounded-2xl bg-card px-4 py-2 ring-1 ring-border">
          <span className="truncate text-xs font-bold uppercase tracking-wide text-primary sm:text-sm">
            {game.club}
          </span>
          <span className="text-2xl font-black tabular-nums text-foreground">
            {score.home} : {score.away}
          </span>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground sm:text-sm">
            {opponent}
          </span>
        </div>
        <div className="mb-2 text-center text-sm font-black tabular-nums text-gold">{fmt(clock)}</div>
        <canvas
          ref={canvasRef}
          className="aspect-[1050/680] w-full rounded-2xl ring-1 ring-border"
        />
        <div className="mt-4 flex items-end justify-between gap-3 sm:justify-center sm:gap-16">
          <Joystick onChange={joystick} />
          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              label="Pass"
              tone="muted"
              onDown={() => sendAction("pass")}
            />
            <ActionButton
              label="Shoot"
              tone="gold"
              onDown={() => sendAction("shoot")}
            />
            <ActionButton
              label="Tackle"
              tone="muted"
              onDown={() => sendAction("tackle")}
            />
            <ActionButton
              label="Sprint"
              tone="primary"
              onDown={() => { if (engineRef.current) { engineRef.current.input.sprint = true; roomRef.current?.send({ type: "input", input: { ...engineRef.current.input } }); } }}
              onUp={() => { if (engineRef.current) { engineRef.current.input.sprint = false; roomRef.current?.send({ type: "input", input: { ...engineRef.current.input } }); } }}
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              engineRef.current?.stop();
              finish(score.home, score.away);
            }}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            End match early
          </button>
        </div>
      </div>
    </div>
  );
}
