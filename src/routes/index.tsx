import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Play, Shield, Star, Trophy } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import hero from "@/assets/fdx-hero.jpg";
import logo from "@/assets/fdx-logo.png";
import cardPlay from "@/assets/card-play.jpg";
import cardCareer from "@/assets/card-career.jpg";
import cardTournament from "@/assets/card-tournament.jpg";
import cardTraining from "@/assets/card-training.jpg";
import cardClub from "@/assets/card-club.jpg";
import cardCareerSide from "@/assets/card-careerside.jpg";
import cardEvents from "@/assets/card-events.jpg";
import cardDaily from "@/assets/card-daily.jpg";
import { teamRating, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Football Dynasty X — Build Your Club, Rule The Pitch" },
      {
        name: "description",
        content:
          "Football Dynasty X is a premium 2D football manager game: play matches, run career mode, enter tournaments, train your squad and build a dynasty.",
      },
      { property: "og:title", content: "Football Dynasty X — Build Your Club, Rule The Pitch" },
      {
        property: "og:description",
        content: "Play matches, sign and sell players, climb the league and create a football dynasty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MainMenu,
});

const FEATURES = [
  {
    to: "/match",
    img: cardPlay,
    label: "Play Match",
    hint: "Jump into the action.",
    sub: "Quick Match · Offline",
    primary: true,
  },
  { to: "/dynasty", img: cardCareer, label: "Career Mode", hint: "Build your club. Make history.", sub: "", primary: false },
  { to: "/events", img: cardTournament, label: "Tournament", hint: "Compete in exciting tournaments.", sub: "", primary: false },
  { to: "/tactics", img: cardTraining, label: "Training", hint: "Improve your skills and tactics.", sub: "", primary: false },
  { to: "/squad", img: cardClub, label: "My Club", hint: "Manage your team, stadium and staff.", sub: "", primary: false },
] as const;

const SIDE = [
  {
    to: "/dynasty",
    img: cardCareerSide,
    label: "Career Mode",
    hint: "Take your club from grassroots to glory.",
    tone: "text-gold",
  },
  {
    to: "/events",
    img: cardEvents,
    label: "Live Events",
    hint: "Compete in live events and earn big rewards.",
    tone: "text-accent",
  },
  {
    to: "/events",
    img: cardDaily,
    label: "Daily Challenges",
    hint: "Complete challenges to earn amazing rewards.",
    tone: "text-chart-3",
  },
] as const;

function MainMenu() {
  const game = useGame();

  return (
    <GameShell back={false}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-3xl ring-1 ring-gold/30">
            <img
              src={hero}
              alt="Footballer striking a ball under golden stadium floodlights"
              width={1536}
              height={1024}
              className="absolute inset-0 size-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
            <div className="relative p-6 sm:p-10">
              <img
                src={logo}
                alt="Football Dynasty X crest"
                width={96}
                height={96}
                className="size-16 object-contain drop-shadow-[0_0_20px_oklch(0.83_0.16_88/0.5)] sm:size-24"
              />
              <h1 className="mt-3 text-4xl font-black italic leading-[0.9] tracking-tight text-foreground sm:text-6xl">
                FOOTBALL
                <span className="block text-gold-gradient">DYNASTY X</span>
              </h1>
              <div className="mt-3 flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-3 max-w-md text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Build your club. Rule the pitch. Create a dynasty.
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  ["Club", game.club],
                  ["League", game.league],
                  ["Rating", teamRating(game)],
                  ["Season", game.season],
                  ["Trophies", game.trophies],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className="text-lg font-extrabold text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link
                to="/match"
                className="press mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-black uppercase tracking-widest text-gold-foreground shadow-[0_10px_35px_-12px_var(--gold)]"
              >
                Let's play <ChevronRight className="size-4" />
              </Link>
            </div>
          </section>

          <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {FEATURES.map(({ to, img, label, hint, sub, primary }) => (
              <Link
                key={label}
                to={to}
                className={`press group relative overflow-hidden rounded-2xl ring-1 transition-all hover:-translate-y-0.5 ${
                  primary ? "ring-gold shadow-[0_0_30px_-14px_var(--gold)]" : "ring-border hover:ring-gold/60"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  width={640}
                  height={512}
                  className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                <div className="relative flex h-44 flex-col justify-end p-3 text-center">
                  <span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-background/70 ring-1 ring-gold/40">
                    {primary ? (
                      <Play className="size-4 text-gold" />
                    ) : label === "My Club" ? (
                      <Shield className="size-4 text-gold" />
                    ) : (
                      <Trophy className="size-4 text-gold" />
                    )}
                  </span>
                  <span className="text-sm font-black uppercase tracking-wide text-foreground">{label}</span>
                  <span className="mt-0.5 text-[0.65rem] leading-tight text-muted-foreground">{hint}</span>
                  {sub && (
                    <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-wide text-gold">{sub}</span>
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {SIDE.map(({ to, img, label, hint, tone }) => (
            <Link
              key={label}
              to={to}
              className="press group relative h-40 overflow-hidden rounded-2xl ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-gold/60"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                width={768}
                height={512}
                className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
              <div className="relative p-4">
                <p className={`text-sm font-black uppercase tracking-wide ${tone}`}>{label}</p>
                <p className="mt-1 max-w-[10rem] text-[0.7rem] leading-tight text-muted-foreground">{hint}</p>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </GameShell>
  );
}
