# Portfolio

Portfolio of Mohamed Aziz Ghazouani: https://aziz-ghazouani.pages.dev

One static page, `index.html`, in English and French. There is no build step.
Cloudflare Pages (project `aziz-ghazouani`) serves this folder as it is and
redeploys on every push to `main`. GitHub still publishes the repository at
azizgh69.github.io (it won't switch that off for a `<user>.github.io` repo),
and a script at the top of `index.html` forwards visitors from there to
pages.dev.

- `img/`: the hero photo
- `cv/`: the two CVs linked from the System screen
- `audio/`: the background track, `bgm.mp3`. How to add, change or remove it
  is in [`audio/README.md`](audio/README.md). The speaker button only appears
  once the file is there.
