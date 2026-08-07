# Football Dynasty — 2D Web Football Game

A complete, playable arcade football game with a career/dynasty layer. All teams, players, and crests are fictional and generated in-project.

## Assumptions
- Progress (coins, squad, season, league table) saves locally in the browser — no login. Easy to move to an account-based backend later.
- Single-player only vs computer AI.
- Match engine runs on HTML canvas for smooth 60fps play on desktop and mobile.

## Screens

**Main Menu** — Football Dynasty wordmark and crest, plus PLAY MATCH, DYNASTY MODE, MY SQUAD, TRANSFER MARKET, LEAGUE TABLE, SETTINGS. Header strip shows coins, current league, team rating, season.

**Play Match** — Top-down 2D pitch: green turf, white lines, center circle, penalty/keeper areas, two goals. Scoreboard and countdown timer. 6 outfield/keeper players per side. Difficulty select (Easy / Normal / Hard) before kickoff.

**Match Result** — Final score, WIN/DRAW/LOSS banner, goals scored/conceded, coins earned (more for a win), XP earned. Buttons: Play Again, Return to Dynasty, View Squad.

**Dynasty Mode** — Club hub: Dynasty FC starts with 1,000 coins, rating 65, Beginner League. Shows season progress, next fixture, trophies, stadium level with a coin-cost upgrade path, and league promotion when the season is won.

**My Squad** — Player cards with name, position, overall, speed, shooting, passing, defense, stamina, level. Pick the starting XI-equivalent lineup, swap in subs, upgrade a player's stats with coins, view detail stats.

**Formations** — 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, drawn visually on a mini pitch; the chosen shape drives kickoff positions in the match.

**Transfer Market** — Rotating list of fictional free agents with name, position, rating, price, and stats. Buying deducts coins; purchase is blocked with a clear message when funds are short. Option to sell squad players for coins.

**League Table** — 10 fictional clubs (Dynasty FC, Royal United, Metro City, Thunder FC, Golden Eagles, Red Warriors, Capital Stars, Ocean FC, Victory Athletic, Lion Hearts) tracking played, wins, draws, losses, goals for/against, goal difference, points. Rival fixtures are simulated after each of your matches so the table moves realistically.

**Settings** — Difficulty default, match length, sound on/off, control layout, reset save.

## Gameplay

Controls — Desktop: WASD/arrows move, Space pass, J shoot, K tackle, Shift sprint. Mobile: on-screen thumb joystick plus PASS, SHOOT, TACKLE, SPRINT buttons; layout auto-switches by device and touch support.

Mechanics — you control the teammate nearest the ball, with automatic switching. Arcade physics: momentum-based movement, ball friction, power-scaled kicks, pass targeting to the best-placed teammate, tackle with a short cooldown, goal detection, sideline/goal-line out-of-play with restarts, sprint drains stamina. Match ends at timer zero.

AI — opponents chase the ball, mark the carrier, hold defensive shape, pass and shoot from good positions, and the keeper tracks and dives to save. Easy/Normal/Hard scale AI speed, reaction delay, shot accuracy, and how aggressively they press.

## Visual direction
Modern sports-broadcast look: deep midnight navy UI, electric pitch-green accent, gold for coins and trophies. Bold condensed display type for scores and headings, clean sans for body. Card-based menus with subtle glow and motion on hover/press. Fully responsive, mobile-first.

## Technical notes
- Canvas-based match loop (fixed timestep, requestAnimationFrame) in an isolated engine module; React handles all menus and HUD overlays.
- Separate routes: `/` (menu), `/match`, `/dynasty`, `/squad`, `/transfers`, `/league`, `/settings`, each with its own page metadata.
- Game state (coins, squad, formation, season, table, settings) in a single store persisted to localStorage with a versioned schema.
- Fictional data generators for player names, ratings, prices, and crests; no real-world clubs or players.
- Built in phases: state + data model, then menu shell and management screens, then match engine and AI, then results/progression wiring.
