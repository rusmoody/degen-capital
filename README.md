# Five More Minutes

> *An ADHD horror game where the monster is you.*

**Working title — swap it freely.** Other candidates: *MVP or Die*, *Night Shift*, *Just One More Task*.

**▶ Play in your browser — just open `index.html`.** No install, no build, no dependencies.
English by default, with an in-game **`L`** toggle for other languages.

<!-- ![screenshot](docs/screenshot.gif) -->

## The pitch

You're a remote worker with ADHD. It's night. There's a to-do list and a deadline at dawn.
There is no monster — the monster is your own scattered brain: things you moved and forgot,
clutter that fills your hands, a phone that swallows twenty minutes, and a fifth of your own
memory that is simply **wrong**.

It's a horror game about executive dysfunction. It's funny until it isn't.

## How it works

Walk the cottage room to room and finish the night's tasks before dawn.

- Every task needs an **item delivered to a station**: report → laptop, charger → outlet, mug → sink, keys → door, pills → bathroom.
- **You can only hold 3 things.** Constant back-and-forth.
- **Your memory lies.** The list says where an item "should be" — but ~40% of the time you moved it and forgot. You reach the spot, it's empty, and the list corrects itself.
- **Clutter blocks you.** Junk (socks, remotes, cables) fills your hands, and you *can't finish a task with junk in your hands* — haul it to the trash first.
- **Focus drains all night.** Distraction hotspots — the TV, the fridge, the window — trap you: you freeze, lose time, drop an item. Low focus shrinks your flashlight and the dark closes in.

### The phone — your worst enemy

- **Pick up the phone (`F`)** → a full-screen **reels feed** you scroll. Time runs **3× faster** while you're in it. It buzzes in your pocket and begs you to look. The whole horror is that you *choose* to open it.
  - Live: on a real deploy the feed pulls fresh posts from Reddit. Offline / CORS-blocked → it falls back to a built-in deck of original memes, so it never breaks.
- **Phone + headphones (`H`)** → a **music player** with 4 procedural tracks. Music ducks the horror ambience — you hear your playlist instead of the house. Trade-off: you also stop hearing the scares coming.
- **Jump-scares** → entering a room can trigger *"…is someone hiding there?"* with a choice (**look / don't look**). Usually it's the blanket that looked like a demon. Rarely, it isn't.

### Atmosphere

Procedural horror audio — a minor drone, wind, and a heartbeat that speeds up toward dawn —
plus a flashlight that tightens as your focus fades. All synthesized in the browser, no audio files.

Beat the clock with every task done, or lose the night.

### Controls

`WASD / arrows` move · `E` pick up / deliver / dump junk · `Q` drop · `F` phone (reels) · `H` music (needs phone + headphones) · `M` sound on/off · `L` language · `R` restart

*(Audio needs one key press or click to start — browser autoplay policy.)*

## Localization

The game ships with English and Russian, toggled in-game with `L`. All player-facing text lives
in a single `STR` dictionary keyed by language, and internal game logic uses stable English IDs —
so **adding a new language is just adding one entry to `STR`.** PRs with new locales are welcome.

## Play / deploy

It's a **single `index.html`, zero dependencies** (vanilla JS `<canvas>` + Web Audio).

- **Locally:** open `index.html` in any browser.
- **Deploy:** drag the folder onto [Netlify Drop](https://app.netlify.com/drop), or any static host.

## Tech

No engine, no build step, no npm. One HTML file, `<canvas>`, and the Web Audio API.
That's deliberate: the barrier to contributing is "open the file and hit save."

## Roadmap

Phase 0 (core loop) and Phase 1 (phone, music, jump-scares) are done. Next up: **the long night** —
20–30-minute nights with survival needs (meds, water, food, the courier, sleep) that fight your work,
then a **5-to-30 night campaign** where you try to ship an MVP / become CEO without letting your body
and mind collapse. Full breakdown in [ROADMAP.md](ROADMAP.md).

## Contributing

Open source **specifically so you can build the version you see in your head** — new tasks, rooms,
items, scares, music, meme sources, and languages all welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — do whatever, just keep the notice.

---

Built in the open with a lot of AI pair-programming. Made by people who know that "just five more minutes" is never five minutes.
