import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Coins,
  Gem,
  Home,
  ListOrdered,
  Repeat,
  Settings as SettingsIcon,
  ShieldHalf,
  ShoppingBag,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/fdx-logo.png";
import { actions, hydrate, useGame, xpForLevel } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function ClubCrest({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Football Dynasty X club crest"
      width={44}
      height={44}
      className={cn("size-11 shrink-0 object-contain drop-shadow-[0_0_12px_oklch(0.83_0.16_88/0.45)]", className)}
    />
  );
}

function Pill({
  icon,
  value,
  label,
  tone = "gold",
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone?: "gold" | "gem" | "energy";
}) {
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums",
        tone === "gold" && "border-gold/40 bg-gold/10 text-gold",
        tone === "gem" && "border-chart-3/40 bg-chart-3/10 text-chart-3",
        tone === "energy" && "border-accent/40 bg-accent/10 text-accent",
      )}
    >
      {icon}
      <span className="sr-only">{label}: </span>
      {value}
    </span>
  );
}

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/squad", label: "Squad", icon: Users },
  { to: "/transfers", label: "Transfers", icon: Repeat },
  { to: "/tactics", label: "Tactics", icon: ShieldHalf },
  { to: "/league", label: "Tables", icon: ListOrdered },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/store", label: "Store", icon: ShoppingBag },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-lg"
    >
      <ul className="mx-auto grid w-full max-w-4xl grid-cols-7">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "press flex flex-col items-center gap-1 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 text-[0.6rem] font-bold uppercase tracking-wide transition-colors",
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-xl transition-all",
                    active ? "bg-gold/15 ring-1 ring-gold/50 shadow-[0_0_18px_-6px_var(--gold)]" : "",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopBar() {
  const game = useGame();
  const [openBell, setOpenBell] = useState(false);
  const xpNeeded = xpForLevel(game.managerLevel);

  return (
    <header className="mb-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ClubCrest />
          <div className="min-w-0">
            <p className="truncate text-[0.6rem] font-black uppercase tracking-[0.3em] text-gold">
              Football Dynasty X
            </p>
            <h1 className="truncate text-base font-black leading-tight text-foreground sm:text-lg">
              {game.club}
            </h1>
            <p className="truncate text-[0.65rem] text-muted-foreground">
              Lv {game.managerLevel} · {game.managerXp}/{xpNeeded} XP
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpenBell((v) => !v)}
            aria-label="Notifications"
            aria-expanded={openBell}
            className="press relative grid size-9 place-items-center rounded-xl bg-card ring-1 ring-border hover:ring-gold/60"
          >
            <Bell className="size-4 text-foreground" />
            {game.notifications.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-gold text-[0.55rem] font-black text-gold-foreground">
                {Math.min(9, game.notifications.length)}
              </span>
            )}
          </button>
          <Link
            to="/profile"
            aria-label="Manager profile and friends"
            className="press grid size-9 place-items-center rounded-xl bg-card ring-1 ring-border hover:ring-gold/60"
          >
            <User className="size-4 text-foreground" />
          </Link>
          <Link
            to="/settings"
            aria-label="Settings"
            className="press grid size-9 place-items-center rounded-xl bg-card ring-1 ring-border hover:ring-gold/60"
          >
            <SettingsIcon className="size-4 text-foreground" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill icon={<Coins className="size-3.5" />} value={game.coins.toLocaleString()} label="Coins" />
        <Pill icon={<Gem className="size-3.5" />} value={game.gems} label="Gems" tone="gem" />
        <Pill
          icon={<Zap className="size-3.5" />}
          value={`${game.energy}/${game.maxEnergy}`}
          label="Energy"
          tone="energy"
        />
        <Link
          to="/events"
          className="press inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-extrabold text-accent"
        >
          <Sparkles className="size-3.5" /> Live
        </Link>
      </div>

      {openBell && (
        <div className="mt-3 animate-fade-in rounded-2xl bg-card p-4 ring-1 ring-gold/30">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-gold">Notifications</h2>
            <button
              onClick={() => actions.clearNotifications()}
              className="text-[0.65rem] font-bold uppercase text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {game.notifications.map((n, i) => (
              <li key={`${n}-${i}`} className="text-xs text-muted-foreground">
                • {n}
              </li>
            ))}
            {!game.notifications.length && (
              <li className="text-xs text-muted-foreground">No news right now. Go play a match.</li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export function GameShell({
  children,
  title,
  subtitle,
  back = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
}) {
  const game = useGame();
  useEffect(() => hydrate(), []);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(60rem 34rem at 50% -12%, color-mix(in oklab, var(--gold) 14%, transparent), transparent 65%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-4">
        <TopBar />
        {(title || back) && (
          <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-2xl font-black uppercase tracking-tight text-foreground">
                  {title}
                </h2>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {subtitle ?? `${game.league} · Season ${game.season}`}
              </p>
            </div>
            {back && (
              <Link
                to="/"
                className="press inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground ring-1 ring-border hover:text-gold"
              >
                <ArrowLeft className="size-4" /> Home
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
