import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Play,
  Crown,
  Users,
  ShoppingCart,
  ListOrdered,
  Settings as SettingsIcon,
} from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { teamRating, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Football Dynasty — 2D Arcade Football Manager Game" },
      {
        name: "description",
        content:
          "Play Football Dynasty: a fast 2D arcade football game. Win matches, earn coins, sign players and build your club into a dynasty.",
      },
      { property: "og:title", content: "Football Dynasty — 2D Arcade Football Game" },
      {
        property: "og:description",
        content: "Play matches, upgrade your squad, climb the league and build a football dynasty.",
      },
    ],
  }),
  component: MainMenu,
});

type MenuLink = "/match" | "/dynasty" | "/squad" | "/transfers" | "/league" | "/settings";
const ITEMS: Array<{ to: MenuLink; label: string; icon: typeof Play; hint: string; big?: boolean }> = [
  { to: "/match", label: "Play Match", icon: Play, hint: "Kick off against a rival club", big: true },
  { to: "/dynasty", label: "Dynasty Mode", icon: Crown, hint: "Club hub, stadium & season" },
  { to: "/squad", label: "My Squad", icon: Users, hint: "Lineup, formation & upgrades" },
  { to: "/transfers", label: "Transfer Market", icon: ShoppingCart, hint: "Sign new talent" },
  { to: "/league", label: "League Table", icon: ListOrdered, hint: "Standings & form" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, hint: "Difficulty & controls" },
];

function MainMenu() {
  const game = useGame();

  return (
    <GameShell back={false} title="Football Dynasty">
      <section className="mb-8 overflow-hidden rounded-3xl bg-card p-6 ring-1 ring-border sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">Season {game.season}</p>
        <h2 className="mt-2 text-4xl font-black leading-none tracking-tight text-foreground sm:text-6xl">
          FOOTBALL
          <span className="block text-primary">DYNASTY</span>
        </h2>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground">
          Take {game.club} from the {game.league} to the top of the pyramid. Play the matches
          yourself, bank the coins, and build a squad nobody can touch.
        </p>
        <dl className="mt-6 flex flex-wrap gap-6">
          {[
            ["Coins", game.coins.toLocaleString()],
            ["Team rating", teamRating(game)],
            ["League", game.league],
            ["Trophies", game.trophies],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <dt className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
              <dd className="text-xl font-extrabold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ to, label, icon: Icon, hint, big }) => (
          <Link
            key={to}
            to={to}
            className={`group flex items-center gap-4 rounded-2xl p-5 ring-1 transition-all hover:-translate-y-0.5 ${
              big
                ? "bg-primary text-primary-foreground ring-primary sm:col-span-2 lg:col-span-3"
                : "bg-card text-foreground ring-border hover:ring-primary/60"
            }`}
          >
            <Icon className="size-7 shrink-0" />
            <span className="flex-1">
              <span className="block text-base font-extrabold uppercase tracking-wide">{label}</span>
              <span
                className={`block text-xs ${big ? "opacity-80" : "text-muted-foreground"}`}
              >
                {hint}
              </span>
            </span>
          </Link>
        ))}
      </nav>
    </GameShell>
  );
}
