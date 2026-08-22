import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { makeRoomCode } from "@/lib/game/multiplayer";
import { hydrate, teamRating, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/online")({
  head: () => ({
    meta: [
      { title: "Online Matches — Football Dynasty X" },
      {
        name: "description",
        content:
          "Play live 2D football against other managers: quick play from the public lobby, private room codes and your own squad on the pitch.",
      },
      { property: "og:title", content: "Online Matches — Football Dynasty X" },
      {
        property: "og:description",
        content: "Face other managers live with your own squad, formation and tactics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnlinePage,
});

type Room = {
  id: string;
  code: string;
  host_id: string;
  host_club: string;
  host_rating: number;
  status: string;
};

function OnlinePage() {
  const game = useGame();
  useEffect(() => hydrate(), []);
  const { user, loading, signedIn } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rating = teamRating(game);

  const loadRooms = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("match_rooms")
      .select("id, code, host_id, host_club, host_rating, status")
      .eq("status", "open")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (err) setError(err.message);
    else setRooms((data ?? []) as Room[]);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    void loadRooms();
    const channel = supabase
      .channel("lobby-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_rooms" }, () => {
        void loadRooms();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [signedIn, loadRooms]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .update({ club: game.club, team_rating: rating, display_name: game.managerName, last_seen: new Date().toISOString() })
      .eq("id", user.id);
  }, [user, game.club, game.managerName, rating]);

  const host = async (isPublic: boolean) => {
    if (!user) return;
    setBusy(true);
    setError("");
    const code = makeRoomCode();
    const { error: err } = await supabase.from("match_rooms").insert({
      code,
      host_id: user.id,
      host_club: game.club,
      host_rating: rating,
      is_public: isPublic,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/match", search: { code, role: "host" } });
  };

  const join = async (room: Room) => {
    if (!user) return;
    setBusy(true);
    const { error: err } = await supabase
      .from("match_rooms")
      .update({ guest_id: user.id, status: "full", updated_at: new Date().toISOString() })
      .eq("id", room.id)
      .eq("status", "open");
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/match", search: { code: room.code, role: "guest" } });
  };

  const quickPlay = async () => {
    const open = rooms.find((r) => r.host_id !== user?.id);
    if (open) await join(open);
    else await host(true);
  };

  if (loading) {
    return (
      <GameShell title="Online" subtitle="Loading…">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border text-sm text-muted-foreground">
          Checking your manager account…
        </div>
      </GameShell>
    );
  }

  if (!signedIn) {
    return (
      <GameShell title="Online" subtitle="Play live against other managers">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h3 className="text-lg font-black uppercase text-foreground">Sign in to go online</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A manager account unlocks the public lobby, private rooms and your online record.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-block rounded-2xl bg-gold px-6 py-3 text-sm font-black uppercase tracking-widest text-gold-foreground"
          >
            Sign in / Create account
          </Link>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Online" subtitle={`${game.club} · Rating ${rating}`}>
      {error && (
        <p className="mb-4 rounded-xl bg-destructive/15 px-4 py-2 text-xs font-semibold text-destructive">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h3 className="text-sm font-black uppercase tracking-widest text-gold">Quick play</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Join the first open lobby, or open one and wait for a rival.
          </p>
          <button
            onClick={quickPlay}
            disabled={busy}
            className="mt-4 w-full rounded-2xl bg-gold px-6 py-3 text-sm font-black uppercase tracking-widest text-gold-foreground disabled:opacity-50"
          >
            Find a match
          </button>
          <button
            onClick={() => host(false)}
            disabled={busy}
            className="mt-2 w-full rounded-2xl bg-secondary px-6 py-3 text-sm font-black uppercase tracking-widest text-secondary-foreground ring-1 ring-border disabled:opacity-50"
          >
            Create private room
          </button>
        </div>

        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h3 className="text-sm font-black uppercase tracking-widest text-gold">Join by code</h3>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="ROOM CODE"
              className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2 text-sm font-black tracking-[0.25em] text-foreground outline-none ring-1 ring-border focus:ring-gold"
            />
            <button
              disabled={joinCode.length !== 6}
              onClick={() => navigate({ to: "/match", search: { code: joinCode, role: "guest" } })}
              className="rounded-xl bg-secondary px-4 py-2 text-xs font-black uppercase ring-1 ring-border disabled:opacity-40"
            >
              Connect
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Share your room code with a friend and you both drop into the same match.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-gold">Open lobbies</h3>
          <button onClick={() => void loadRooms()} className="text-[0.65rem] font-bold uppercase text-muted-foreground hover:text-gold">
            Refresh
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {rooms.map((room) => (
            <li key={room.id} className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-foreground">{room.host_club}</p>
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  Rating {room.host_rating} · Code {room.code}
                </p>
              </div>
              {room.host_id === user?.id ? (
                <Link
                  to="/match"
                  search={{ code: room.code, role: "host" }}
                  className="rounded-xl bg-gold/20 px-4 py-2 text-xs font-black uppercase text-gold"
                >
                  Your room
                </Link>
              ) : (
                <button
                  onClick={() => join(room)}
                  disabled={busy}
                  className="rounded-xl bg-gold px-4 py-2 text-xs font-black uppercase text-gold-foreground disabled:opacity-50"
                >
                  Join
                </button>
              )}
            </li>
          ))}
          {!rooms.length && <li className="text-xs text-muted-foreground">No open rooms — create one above.</li>}
        </ul>
      </div>
    </GameShell>
  );
}
