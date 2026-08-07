import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game/GameShell";
import { actions, useGame } from "@/lib/game/store";
import type { Difficulty } from "@/lib/game/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Football Dynasty" },
      {
        name: "description",
        content:
          "Tune Football Dynasty: default difficulty, match length, sound and control layout, or reset your saved career.",
      },
      { property: "og:title", content: "Settings — Football Dynasty" },
      { property: "og:description", content: "Difficulty, match length, sound and save controls." },
    ],
  }),
  component: SettingsPage,
});

const DIFFS: Difficulty[] = ["EASY", "NORMAL", "HARD"];
const LENGTHS = [2, 3, 5];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide ring-1 transition-colors ${
        active
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-secondary text-secondary-foreground ring-border hover:ring-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function SettingsPage() {
  const game = useGame();
  const s = game.settings;

  return (
    <GameShell title="Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <Row title="Default difficulty">
          {DIFFS.map((d) => (
            <Pill key={d} active={s.difficulty === d} onClick={() => actions.updateSettings({ difficulty: d })}>
              {d}
            </Pill>
          ))}
        </Row>
        <Row title="Match length">
          {LENGTHS.map((m) => (
            <Pill
              key={m}
              active={s.matchMinutes === m}
              onClick={() => actions.updateSettings({ matchMinutes: m })}
            >
              {m} min
            </Pill>
          ))}
        </Row>
        <Row title="Sound">
          <Pill active={s.sound} onClick={() => actions.updateSettings({ sound: true })}>
            On
          </Pill>
          <Pill active={!s.sound} onClick={() => actions.updateSettings({ sound: false })}>
            Off
          </Pill>
        </Row>
        <Row title="Controls">
          <Pill
            active={!s.forceTouchControls}
            onClick={() => actions.updateSettings({ forceTouchControls: false })}
          >
            Auto
          </Pill>
          <Pill
            active={s.forceTouchControls}
            onClick={() => actions.updateSettings({ forceTouchControls: true })}
          >
            Always touch
          </Pill>
        </Row>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-destructive">Danger zone</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reset your save to start a brand new dynasty with 1,000 coins and a fresh squad.
          </p>
          <button
            onClick={() => {
              if (confirm("Reset your dynasty? This cannot be undone.")) actions.resetSave();
            }}
            className="mt-4 rounded-xl bg-destructive px-5 py-3 text-sm font-black uppercase tracking-wide text-destructive-foreground"
          >
            Reset save
          </button>
        </div>
      </div>
    </GameShell>
  );
}
