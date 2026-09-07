# Complete Team-vs-Team Online Matches

## Goal

Finish the existing online mode so two signed-in managers can create or join a room, exchange their real squads, play the same live match, and receive a reliable result without changing offline dynasty progress.

## What will be built

1. **Room connection flow**
   - Keep the existing public lobby, private six-character room codes, account requirement, and PeerJS transport.
   - Make joining by code claim the matching lobby room before entering the match, so the host can see the guest connection consistently.
   - Add clear waiting, connected, disconnected, and retry states.
   - Add Online to the shared bottom navigation.

2. **Real squad exchange and pre-match setup**
   - Exchange each manager’s current starting XI, formation, captain, club name, and rating during the handshake.
   - Show both actual team sheets before kickoff instead of placeholder opponent data.
   - Make only the host start the match; the guest sees a waiting state until the host kicks off.
   - Use the correct side for each manager so the guest controls their own team while the host remains authoritative.

3. **Authoritative live match sync**
   - Run physics, AI, goals, clock, and match-end decisions on the host.
   - Send compact pitch snapshots at the existing 20 Hz rate, including player positions, ball position, score, clock, and sequence number.
   - Send guest controller input to the host and render host snapshots smoothly on the guest.
   - Handle stale packets, reconnect/disconnect messaging, and prevent duplicate match loops or duplicate finish events.

4. **Online result handling**
   - Persist one completed online result with both manager IDs, clubs, and final score using the existing online match data model.
   - Update the local manager’s online rewards and record after a completed match.
   - Close or mark the room finished so it does not remain in the open lobby.
   - Keep offline match rewards and dynasty/league progression unchanged.

5. **Validation**
   - Verify the project build/typecheck and current diagnostics.
   - Exercise the lobby and room-code states in the browser.
   - Test host and guest match setup, kickoff, input forwarding, snapshot rendering, scoring, disconnect handling, and result screen at desktop and mobile-sized layouts.

## Technical details

- Reuse `MultiplayerRoom`, `MatchSnapshot`, `MatchEngine`, the existing room tables, and current RLS policies rather than introducing a second multiplayer system.
- Update the match route to create host/guest engines with the correct team ordering and `host`/`guest` network mode, and schedule snapshot transmission only for the host.
- Use the browser client for authenticated room/result operations; no privileged client or new public endpoint is needed.
- Use the existing database tables and migration grants/policies unless validation finds a concrete missing column or permission; any schema change will be applied through the database migration workflow.
