import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Manager Sign In — Football Dynasty X" },
      {
        name: "description",
        content:
          "Sign in to your Football Dynasty X manager account to play online matches against other managers with your own squad.",
      },
      { property: "og:title", content: "Manager Sign In — Football Dynasty X" },
      {
        property: "og:description",
        content: "Create a manager account and take your club online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const game = useGame();
  const { signedIn, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && signedIn) navigate({ to: "/online", replace: true });
  }, [loading, signedIn, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/online`,
            data: { display_name: game.managerName, club: game.club },
          },
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      navigate({ to: "/online", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GameShell title="Manager account" subtitle="Sign in to play online">
      <form
        onSubmit={submit}
        className="mx-auto max-w-md rounded-3xl bg-card p-6 ring-1 ring-border"
      >
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${
                mode === m ? "bg-gold text-gold-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none ring-1 ring-border focus:ring-gold"
          />
        </label>
        <label className="mt-3 block text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-foreground outline-none ring-1 ring-border focus:ring-gold"
          />
        </label>

        {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-gold px-6 py-3 text-sm font-black uppercase tracking-widest text-gold-foreground disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create manager"}
        </button>
        <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
          Your offline dynasty save stays on this device — the account only powers online play.
        </p>
      </form>
    </GameShell>
  );
}
