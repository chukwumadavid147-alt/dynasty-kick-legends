import { createFileRoute } from "@tanstack/react-router";
import { FORMATION_NAMES } from "@/lib/game/data";
import { PLAYER_INSTRUCTIONS } from "@/lib/game/content";
import { GameShell } from "@/components/game/GameShell";
import { actions, attackRating, defenceRating, midfieldRating, useGame } from "@/lib/game/store";
import type { Tactics } from "@/lib/game/types";

export const Route = createFileRoute("/tactics")({
  head: () => ({
    meta: [
      { title: "Tactics — Football Dynasty X" },
      {
        name: "description",
        content:
          "Set your Football Dynasty X game plan: formation, mentality, passing style, pressing intensity, defensive line and player instructions.",
      },
      { property: "og:title", content: "Tactics — Football Dynasty X" },
      {
        property: "og:description",
        content: "Formation, mentality, pressing, defensive line and player instructions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TacticsPage,
});

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`press rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide ring-1 transition-colors ${
            value === o
              ? "bg-gold text-gold-foreground ring-gold"
              : "bg-secondary text-secondary-foreground ring-border hover:ring-gold/60"
          }`}
        >
          {o.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-premium rounded-2xl p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">{title}</h3>
      {children}
    </section>
  );
}

const MENTALITY: Tactics["mentality"][] = ["DEFENSIVE", "BALANCED", "ATTACKING"];
const PASSING: Tactics["passing"][] = ["SHORT", "MIXED", "DIRECT"];
const PRESSING: Tactics["pressing"][] = ["LOW", "MEDIUM", "HIGH"];
const LINE: Tactics["defensiveLine"][] = ["DEEP", "NORMAL", "HIGH"];

function TacticsPage() {
  const game = useGame();
  const t = game.tactics;

  return (
    <GameShell title="Tactics" subtitle="Your game plan carries into every match you play">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Formation">
          <div className="mt-3 flex flex-wrap gap-2">
            {FORMATION_NAMES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => actions.setFormation(f)}
                className={`press rounded-xl px-4 py-2 text-sm font-black ring-1 transition-colors ${
                  game.formation === f
                    ? "bg-gold text-gold-foreground ring-gold"
                    : "bg-secondary text-secondary-foreground ring-border hover:ring-gold/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["ATT", attackRating(game)],
              ["MID", midfieldRating(game)],
              ["DEF", defenceRating(game)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-secondary px-3 py-2 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">{k}</p>
                <p className="text-lg font-black tabular-nums text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Mentality">
          <Choice options={MENTALITY} value={t.mentality} onChange={(v) => actions.setTactics({ mentality: v })} />
          <p className="mt-3 text-xs text-muted-foreground">
            Attacking commits more bodies forward; defensive keeps a compact shape.
          </p>
        </Card>

        <Card title="Passing style">
          <Choice options={PASSING} value={t.passing} onChange={(v) => actions.setTactics({ passing: v })} />
        </Card>

        <Card title="Pressing">
          <Choice options={PRESSING} value={t.pressing} onChange={(v) => actions.setTactics({ pressing: v })} />
        </Card>

        <Card title="Defensive line">
          <Choice options={LINE} value={t.defensiveLine} onChange={(v) => actions.setTactics({ defensiveLine: v })} />
        </Card>

        <section className="card-premium rounded-2xl p-5 md:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">Player instructions</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PLAYER_INSTRUCTIONS.map((i) => {
              const on = t.instructions.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => actions.toggleInstruction(i.id)}
                  aria-pressed={on}
                  className={`press rounded-xl p-3 text-left ring-1 transition-colors ${
                    on ? "bg-gold/15 ring-gold" : "bg-secondary ring-border hover:ring-gold/50"
                  }`}
                >
                  <p className={`text-sm font-black ${on ? "text-gold" : "text-foreground"}`}>{i.label}</p>
                  <p className="text-xs text-muted-foreground">{i.hint}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </GameShell>
  );
}
