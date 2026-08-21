# Online Multiplayer for Football Dynasty X

Let two managers face off live with their own squads: quick room-code matches for friends, plus a cloud lobby with accounts, friends and public matchmaking. The host device runs the match simulation and streams it to the opponent so both screens always show exactly the same game.

## What gets built

### 1. Cloud backend (new)
Enable Lovable Cloud to power accounts and the lobby:
- Email sign-in plus Google, with a public `/auth` screen.
- Manager profiles: display name, club name, team rating, level, wins/draws/losses, online status.
- Friends: send/accept/decline requests, friend list with online status and "Invite to match".
- Lobby: open match rooms (host, club, rating, public/private, status) that others can join; public list auto-refreshes live.
- Online results table so wins/losses from online matches persist to the profile.
All tables get row-level security so a manager can only edit their own rows.

### 2. Room codes (existing, upgraded)
The current peer-to-peer room-code flow stays and gets: clearer connect/ waiting/ error states, opponent club + rating shown once connected, ready-up before kickoff, and reconnect handling.

### 3. Online hub screen
New "Online" area reachable from Home and the bottom nav:
- Quick Play (auto-match with an open public room, or open one and wait)
- Create private room (code to share)
- Join by code
- Friends list with invites
- Recent online results and an online record card

### 4. Same match, both screens (host-authoritative)
Today only inputs are shared, so the two devices can drift apart. Instead:
- The host runs the one true simulation (ball, all players, score, clock).
- The guest sends only its controller input.
- The host broadcasts a compact snapshot of the whole pitch about 20 times a second; the guest renders it with smoothing so movement stays fluid.
- Guest sees their own team attacking the same way it does in single player (view flipped).
- If the connection drops, both sides see a clear message; the match ends and no coins are lost unfairly.

### 5. Real squads on both sides
Each player's chosen formation, starting XI, ratings, fitness and captain are sent at match start, so you play against the opponent's actual team — names, numbers, ratings included. Both team sheets show on the pre-match screen as they do now.

### 6. Rewards
Online wins pay coins and manager XP (higher than offline), update the profile record and appear in online match history. Offline dynasty/league progress is untouched.

## Technical notes
- Gameplay transport stays PeerJS (WebRTC) for low latency; Cloud is used for auth, profiles, friends, lobby rows and result persistence — not for per-frame data.
- New `src/lib/game/netcode.ts`: snapshot encode/decode, sequence numbers, interpolation buffer, input throttling. `multiplayer.ts` gains typed handshake (`hello` with squad payload), `snapshot`, `input`, `end`.
- `MatchEngine` gains a `remote` render mode: when driven by snapshots it skips its own physics/AI and draws the received state.
- New routes: `/auth`, `/online` (hub), `/online/room/$code`; `_authenticated` layout for friend/lobby screens; public routes stay public.
- Migrations create `profiles`, `friendships`, `match_rooms`, `online_matches` with grants + RLS; realtime subscriptions drive lobby/friend presence.
- Existing Squad, Transfers, Tactics, Tables, Profile, Store, Dynasty and offline Match all keep working unchanged.
