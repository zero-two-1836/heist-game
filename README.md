[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

[![rank](https://make.fun/badge/best-heist-game-20261122-0559/zero-two-1836/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

[![reward](https://make.fun/badge/best-heist-game-20261122-0559/zero-two-1836/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)


# Velvet Fox — The Midnight Gallery Heist




A top-down stealth heist game for the make.fun best-heist-game bounty. You are
the Velvet Fox, a thief working three escalating jobs: a midnight gallery, a
private bank vault, and the crown-jewel exhibit. Each job is a full loop —
**plan, sneak, grab, escape**.




## How it plays




- **Plan** — every job opens on a briefing screen with the patrol routes drawn
  on the room. Study the cones before you move.
- **Sneak** — move with WASD or the arrow keys. Hold **Shift** to sneak: slower,
  but guards spot you later and the alarm fills half as fast. Crates and walls
  block vision; vision cones are drawn on the floor so you can read them.
- **Grab** — press **E** next to loot. Some pieces are required to open the
  getaway; the rest are bonus score.
- **Escape** — once the key pieces are bagged, the service door turns green.
  Reach it to finish the job with a time bonus — and a $500 ghost bonus if the
  alarm never rose above 35%.




## Pressure




- **Guards** patrol waypoints, pause to scan, investigate tossed coins, and
  chase the last place they saw you. **Cameras** sweep their arcs and never
  blink. Being watched fills the **alarm meter**; hiding drains it. At 100%
  the job is blown and you are caught — fairly: you get a "SPOTTED!" warning
  and time to break line of sight first.
- **Tools** — coins (click anywhere in the room to toss one) pull a nearby
  guard off to investigate. Each job gives you only a few.
- **Escalation** — job 2 adds a guard, a camera and a second required piece;
  job 3 adds a fourth guard, a third camera, and a laser grid over the plinth
  that spikes the alarm when crossed.




## Tech




- Pure static files under `game/` — no build step, no network, no libraries.
  Open `game/index.html` in desktop Chrome and play.
- All art is drawn on canvas and all sound is synthesised with WebAudio, so
  the game ships no media files at all.
- Source is split into single-job modules under `game/src/`: `levels.js`
  (the three jobs), `guards.js` (patrol AI), `cameras.js` (sweeping cameras),
  `alarm.js` (the alarm meter), `vision.js` (cones and line of sight),
  `player.js` (movement, loot, coin toss), `render.js` (all drawing),
  `audio.js` (synth sound effects), `input.js` (keyboard and mouse), and
  `main.js` (state machine and game loop).




## Run it




```sh
node serve.ts        # serves game/ at http://localhost:8080 (dev helper)
```




Or serve `game/` with any static server and open `index.html`.




## License




MIT — see `LICENSE`.



