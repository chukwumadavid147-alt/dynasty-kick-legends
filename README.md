# Dynasty Kickers

FOOTBALL DYNASTY — 2D WEB FOOTBALL GAME

Build a complete playable 2D web football game called Football Dynasty.

1. GAME CONCEPT

Football Dynasty is a browser-based 2D football game where the player controls a football team, plays matches, earns coins, improves players, signs new players, and builds a football dynasty.

The game should feel like a polished arcade football game, but remain lightweight and easy to play on both desktop and mobile.

Do NOT use real football club names, logos, player names, or copyrighted assets. Create fictional teams, players, logos, and graphics.

2. MAIN MENU

Create a professional football-themed main menu with:

- Football Dynasty logo/title

- PLAY MATCH button

- DYNASTY MODE button

- MY SQUAD button

- TRANSFER MARKET button

- LEAGUE TABLE button

- SETTINGS button

Display:

- Coins

- Current league

- Team rating

- Current season

Use a modern sports-game interface.

3. PLAY MATCH

Create a playable 2D football match.

The pitch should have:

- Green football field

- White boundary lines

- Center circle

- Two goals

- Goalkeeper areas

- Scoreboard

- Match timer

The player's team should have 5–7 controllable players on the field.

The opponent should have computer-controlled players.

Controls

Desktop:

- WASD or arrow keys = move

- Space = pass

- J = shoot

- K = tackle

- Shift = sprint

Mobile:

Create an on-screen virtual joystick.

Add buttons for:

- PASS

- SHOOT

- TACKLE

- SPRINT

Make the controls responsive and easy to use.

4. FOOTBALL GAMEPLAY

Implement basic football physics:

- Players can move around the pitch.

- The ball moves when kicked.

- Players can pass.

- Players can shoot.

- Players can tackle.

- Goals are detected automatically.

- The goalkeeper can attempt saves.

- The ball stays inside the pitch unless it goes out.

- The match ends when the timer reaches zero.

Make gameplay fun and responsive rather than trying to simulate realistic professional football physics.

5. COMPUTER AI

Create basic opponent AI.

AI players should:

- Follow the ball

- Defend their goal

- Chase the player with the ball

- Pass occasionally

- Attempt shots

- Move toward useful positions

- Goalkeeper protects the goal

Create 3 difficulty levels:

EASY

NORMAL

HARD

The difficulty should affect AI speed, positioning and decision-making.

6. MATCH RESULT

When the match ends, display a results screen.

Show:

FINAL SCORE

WIN / DRAW / LOSS

Goals scored

Goals conceded

Coins earned

Player experience earned

Give the player more coins for winning.

Buttons:

- PLAY AGAIN

- RETURN TO DYNASTY

- VIEW SQUAD

7. DYNASTY MODE

Create a team-management system.

The player's fictional club starts as a small club.

Example:

Club: Dynasty FC

Starting:

- 1,000 coins

- Team rating: 65

- Beginner League

The player can improve the club by:

- Winning matches

- Earning coins

- Upgrading players

- Signing new players

- Improving the stadium

- Winning trophies

8. MY SQUAD

Create a squad management screen.

Show player cards containing:

- Fictional player name

- Position

- Overall rating

- Speed

- Shooting

- Passing

- Defense

- Stamina

- Level

Example fictional players:

Marcus Vale — ST — 72

Jayden Cole — RW — 68

Leo Grant — CM — 70

Daniel King — CB — 67

Ethan Brooks — GK — 71

Allow the player to:

- Select starting players

- Change formation

- Upgrade players

- View player statistics

9. FORMATIONS

Allow the player to choose formations such as:

4-3-3

4-4-2

3-5-2

4-2-3-1

Display the formation visually on the pitch.

10. TRANSFER MARKET

Create a fictional transfer market.

Players should have:

- Name

- Position

- Rating

- Price

- Statistics

Example:

Alex Storm

ST

Rating: 78

Price: 2,500 coins

When the player buys someone, subtract the appropriate number of coins.

Prevent the player from buying a player if they do not have enough coins.

11. LEAGUE TABLE

Create a fictional league with 10 teams.

Example teams:

Dynasty FC

Royal United

Metro City

Thunder FC

Golden Eagles

Red Warriors

Capital Stars

Ocean FC

Victory Athletic

Lion Hearts

Track:

Played

Wins

Draws

Losses

G

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dynasty-kick-legends.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b65e0bdb-3dd1-4bc7-b9d5-2b52835c3e63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
