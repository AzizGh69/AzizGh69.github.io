# Background music

The site plays `audio/bgm.mp3` on a loop, quietly, once a visitor clicks the
speaker button beside EN / FR / CV. Clicking again crosses the speaker out and
fades the music away.

**The button only appears when this file exists.** No file means no button,
so nothing on the live site looks broken while the track isn't ready.

## Add the track (or change it later)

1. **Export it as MP3.** In FL Studio: File → Export → MP3 file. 128 to
   192 kbps is plenty. Keep it under 5 MB so the page stays quick; Cloudflare
   refuses any single file over 25 MB. It loops, so a track whose end flows
   back into its start sounds best.

2. **Name it `bgm.mp3` and put it in this folder:**
   `D:\Portfolio-V2\audio\bgm.mp3`.
   To change the track later, replace the file and keep the name.

3. **Try it on your machine.** Double-click `D:\Portfolio-V2\index.html`.
   The speaker appears top right. Click it: the music fades in. Click again:
   the line crosses the speaker and the music fades out.

4. **Publish it.** In PowerShell:

   ```powershell
   cd D:\Portfolio-V2
   git add audio/bgm.mp3
   git commit -m "Add the background track"
   git push
   ```

   Cloudflare puts it live on https://aziz-ghazouani.pages.dev in about a
   minute, and the button appears there by itself. Visitors who come back get
   the new track too; nothing needs clearing.

## Settings

In `index.html`, search for `---------- music`. Just below are:

| Setting | Now | What it does |
|---|---|---|
| `VOLUME` | `0.1` | Loudness, from 0 to 1. `0.2` is twice as loud. |
| `START_ON` | `false` | `true` shows the speaker as on, and the music starts at the visitor's first click anywhere on the page. Browsers never allow sound before a click. |
| `FADE_MS` | `1200` | How long the fade in and out takes, in milliseconds. |
| `MUSIC_FILE` | `"audio/bgm.mp3"` | Which file plays. `null` switches the music off entirely. |

After changing one, publish the same way, with `git add index.html` in step 4.

## Remove the music

```powershell
cd D:\Portfolio-V2
git rm audio/bgm.mp3
git commit -m "Remove the background track"
git push
```

The button disappears with the file.
