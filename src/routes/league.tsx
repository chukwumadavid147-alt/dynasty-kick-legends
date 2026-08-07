import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game/GameShell";
import { gd, points, sortTable } from "@/lib/game/data";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/league")({
  head: () => ({
    meta: [
      { title: "League Table — Football Dynasty" },
      {
        name: "description",
        content:
          "Follow the 10-team Football Dynasty league table: played, wins, draws, losses, goals for and against, goal difference and points.",
      },
      { property: "og:title", content: "League Table — Football Dynasty" },
      {
        property: "og:description",
        content: "Live standings for your club and its nine rivals.",
      },
    ],
  }),
  component: LeaguePage,
});

function LeaguePage() {
  const game = useGame();
  const rows = sortTable(game.table);

  return (
    <GameShell title="League Table">
      <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-border">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">{game.league} standings</caption>
          <thead>
            <tr className="border-b border-border text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              <th scope="col" className="px-3 py-3 text-left">#</th>
              <th scope="col" className="px-3 py-3 text-left">Club</th>
              <th scope="col" className="px-2 py-3 text-right">P</th>
              <th scope="col" className="px-2 py-3 text-right">W</th>
              <th scope="col" className="px-2 py-3 text-right">D</th>
              <th scope="col" className="px-2 py-3 text-right">L</th>
              <th scope="col" className="px-2 py-3 text-right">GF</th>
              <th scope="col" className="px-2 py-3 text-right">GA</th>
              <th scope="col" className="px-2 py-3 text-right">GD</th>
              <th scope="col" className="px-3 py-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const mine = r.club === game.club;
              return (
                <tr
                  key={r.club}
                  className={`border-b border-border/50 last:border-0 ${mine ? "bg-primary/10" : ""}`}
                >
                  <td className="px-3 py-3 font-bold tabular-nums text-muted-foreground">{i + 1}</td>
                  <td
                    className={`px-3 py-3 font-bold ${mine ? "text-primary" : "text-foreground"}`}
                  >
                    {r.club}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.played}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.wins}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.draws}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.losses}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.gf}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{r.ga}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{gd(r)}</td>
                  <td className="px-3 py-3 text-right font-black tabular-nums text-gold">{points(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GameShell>
  );
}
