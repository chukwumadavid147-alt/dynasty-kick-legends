import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { ActionButton, Joystick } from "@/components/game/TouchControls";
import { opponentXI, overall } from "@/lib/game/data";
import { MatchEngine, type Input } from "@/lib/game/engine";
import { actions, hydrate, lineupPlayers, matchLineup, nextOpponent, useGame } from "@/lib/game/store";
import type { Difficulty, MatchResult, PlayerCard } from "@/lib/game/types";


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
  component: MatchPage,
});

const DIFFS: Difficulty[] = ["EASY", "NORMAL", "HARD"];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MatchPage() {
  const game = useGame();
  useEffect(() => hydrate(), []);

  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>(game.settings.difficulty);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [clock, setClock] = useState(game.settings.matchMinutes * 60);
  const [result, setResult] = useState<MatchResult | null>(null);
  const opponent = nextOpponent(game);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MatchEngine | null>(null);
  const keys = useRef<Record<string, boolean>>({});

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
    },
    [difficulty, opponent],
  );

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
        onScore: (h, a) => setScore({ home: h, away: a }),
        onClock: (s) => setClock(s),
        onEnd: (h, a) => finish(h, a),
      },
    );
    engineRef.current = engine;
    engine.start();

    const applyKeys = () => {
      const k = keys.current;
      const input: Input = engine.input;
      input.dx = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
      input.dy = (k["s"] || k["arrowdown"] ? 1 : 0) - (k["w"] || k["arrowup"] ? 1 : 0);
      input.sprint = Boolean(k["shift"]);
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
  }, [phase, difficulty]);

  const joystick = useCallback((dx: number, dy: number) => {
    const e = engineRef.current;
    if (e) {
      e.input.dx = dx;
      e.input.dy = dy;
    }
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
          <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>Desktop: WASD / arrows move · Space pass · J shoot · K tackle · Shift sprint</p>
            <p>Mobile: joystick to move, buttons for pass, shoot, tackle and sprint</p>
          </div>
          <button
            onClick={startMatch}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-base font-black uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start match
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
              onDown={() => engineRef.current && (engineRef.current.input.pass = true)}
            />
            <ActionButton
              label="Shoot"
              tone="gold"
              onDown={() => engineRef.current && (engineRef.current.input.shoot = true)}
            />
            <ActionButton
              label="Tackle"
              tone="muted"
              onDown={() => engineRef.current && (engineRef.current.input.tackle = true)}
            />
            <ActionButton
              label="Sprint"
              tone="primary"
              onDown={() => engineRef.current && (engineRef.current.input.sprint = true)}
              onUp={() => engineRef.current && (engineRef.current.input.sprint = false)}
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
