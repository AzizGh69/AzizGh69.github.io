# Portfolio

Portfolio of Mohamed Aziz Ghazouani: https://aziz-ghazouani.pages.dev

One static page, `index.html`, in English and French. There is no build step.
Cloudflare Pages (project `aziz-ghazouani`) serves this folder as it is and
redeploys on every push to `main`. GitHub still publishes the repository at
azizgh69.github.io (it won't switch that off for a `<user>.github.io` repo),
and a script at the top of `index.html` forwards visitors from there to
pages.dev.

- `img/`: the hero photo
- `cv/`: the CV linked from the System screen
- `audio/`: the background track, `bgm.mp3`. How to add, change or remove it
  is in [`audio/README.md`](audio/README.md). The speaker button only appears
  once the file is there.
- `nox/`, `functions/`, `scripts/`: NOX, the recruiter assistant (below)

## NOX, the recruiter assistant

A moon bubble on every screen (and the `NOX` chip in the top bar) opens NOX,
an AI agent that pitches Aziz to recruiters. It answers questions and scores a
pasted job description, citing portfolio items as clickable chips. `#recruiter`
shows the same agent full screen. English and French, with optional voice
(the browser's own speech synthesis and recognition, no extra service).

- `nox/nox.js`, `nox/nox.css`: the character (inline SVG), bubble, panel, voice.
- `functions/api/chat.js`: the Cloudflare Pages Function behind `/api/chat`.
- `functions/_lib/prompt.js`: NOX's rules. `functions/_lib/guard.js`: input
  cleaning, injection flags, output filtering and the match score, which is
  computed in code from evidence ids that must exist in the portfolio.
- `functions/_lib/knowledge.js`: **generated** grounding text. After changing
  content in `index.html` or the CV text, run:

  ```
  node scripts/build-knowledge.mjs
  ```

### Keys

NOX runs on free tiers. In Cloudflare: Workers & Pages → `aziz-ghazouani` →
Settings → Variables and Secrets, add (as secrets, for Production and Preview):

- `GEMINI_API_KEY`: from Google AI Studio (free tier). Note: on the free tier
  Google may use prompts to improve its products; NOX only sends public
  portfolio content plus what visitors type.
- `GROQ_API_KEY` (optional): fallback when Gemini is rate limited.
- `GEMINI_MODEL` / `GROQ_MODEL` (optional): override the defaults
  `gemini-flash-latest` / `llama-3.3-70b-versatile`.

Then redeploy. Without a key NOX still opens and tells visitors to email Aziz.

### Local run and tests

Put the same keys in `.dev.vars` (git-ignored), then:

```
npx wrangler pages dev . --port 8788
node scripts/redteam.mjs http://localhost:8788
```

The red-team script sends jailbreaks, fabrication bait, off-topic and French
attacks, and a job description with hidden instructions, and checks that NOX
refuses, invents nothing and keeps the same score.
