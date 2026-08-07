import { Link } from "@tanstack/react-router";
import { Coins, Trophy, Shield, CalendarDays, ArrowLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { hydrate, teamRating, useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function ClubCrest({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40",
        className,
      )}
      aria-hidden="true"
    >
      <Shield className="size-6 text-primary" />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-card/70 px-3 py-2 ring-1 ring-border">
      <span className="text-accent">{icon}</span>
      <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function GameShell({
  children,
  title,
  back = true,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
}) {
  const game = useGame();
  useEffect(() => hydrate(), []);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70rem 40rem at 50% -10%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-5">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <ClubCrest />
          <div className="mr-auto">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-primary">
              Football Dynasty
            </p>
            <h1 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">
              {title ?? game.club}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Stat icon={<Coins className="size-4" />} label="Coins" value={game.coins.toLocaleString()} />
            <Stat icon={<Trophy className="size-4" />} label="Rating" value={teamRating(game)} />
            <Stat icon={<CalendarDays className="size-4" />} label="Season" value={game.season} />
          </div>
        </header>
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {game.league}
        </p>
        {back && (
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Main menu
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
