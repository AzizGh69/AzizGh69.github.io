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
- `GEMINI_MODEL` / `GROQ_MODEL` (optional): force a model. By default NOX uses
  `gemini-flash-latest`, and for Groq asks which chat models the key can use
  and takes the best (Groq retires models often).

Groq's free tier allows about 8,000 tokens per minute per model, and each NOX
request uses 5–7k, so roughly one question per minute; past that, visitors get
a polite "busy, try again in a minute".

- Binding `AI` (Settings → Bindings → Workers AI): the last reserve, used when
  Gemini and Groq are both busy. Models: `@cf/google/gemma-4-26b-a4b-it`, then
  `@cf/zai-org/glm-4.7-flash` (`CF_AI_MODEL` forces one). About 190–230
  questions a day fit in the free 10,000 neurons.

NOX tries Gemini, then Groq, then Workers AI, rotating models and resting the
busy ones. The logs show `answered by <provider> <model>` for each reply.

**$0 cost policy.** Every provider stays on its free tier, and none can bill:
- Cloudflare account on the **Workers Free** plan: Workers AI stops at the
  daily free allowance instead of charging. Never upgrade to Workers Paid
  (usage past the allowance would then be billed) without revisiting this.
- Gemini: AI Studio key with **no billing account** linked to its project.
- Groq: free plan, no card on file.
When a free limit is reached, visitors see "busy, try again" — never a bill.

Then redeploy. Without a key NOX still opens and tells visitors to email Aziz.

### Deploying

The Cloudflare GitHub app lost access to this repo (11/2026), so pushes no
longer deploy on their own. Deploy from this folder with Wrangler instead,
uploading only the public files (never `.dev.vars`, `scripts/` or `cv/source/`):

```
mkdir ../site-out
cp -r index.html .nojekyll nox img cv audio ../site-out/ && rm -rf ../site-out/cv/source
npx wrangler pages deploy ../site-out --project-name aziz-ghazouani --branch main
```

`functions/` is picked up from this folder automatically.

### Local run and tests

Put the same keys in `.dev.vars` (git-ignored), then:

```
npx wrangler pages dev . --port 8788
node scripts/redteam.mjs http://localhost:8788
```

The red-team script sends jailbreaks, fabrication bait, off-topic and French
attacks, and a job description with hidden instructions, and checks that NOX
refuses, invents nothing and keeps the same score.
