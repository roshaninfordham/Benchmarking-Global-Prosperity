# Demo video

`bgp-demo.mp4` is a 1 minute 55 second walkthrough of the live platform (1080p, narrated, captions burned in). `bgp-demo.srt` has the same captions as a subtitle file, and `narration.md` has the script with times for slide notes.

The video is a real recording of https://benchmarking-global-prosperity.vercel.app driven by a script, so it can be redone whenever the platform changes. The voice is Kokoro-82M (Apache 2.0), synthesised locally.

## How it is made

1. `tts.py` speaks each line in `script.json` and measures its length.
2. `record.mjs` drives Chrome through the platform. Each scene's actions run inside the length of its narration line, with a visible cursor, captions from `captions.json`, and the title and end cards. It writes the start time of every line to `marks.json`.
3. `assemble.py` places each voice line at its start time, normalises loudness to about -16 LUFS and encodes the MP4.

## Redo it

Needs Python 3.12 with `kokoro soundfile numpy`, `brew install espeak-ng`, Node 24 with `npm i playwright-core`, and Google Chrome.

```bash
export PHONEMIZER_ESPEAK_LIBRARY=/opt/homebrew/lib/libespeak-ng.dylib
mkdir audio && python tts.py
node record.mjs        # BASE=http://localhost:3000 to record a local build
python assemble.py     # writes bgp-demo.mp4
```

The MP4 itself is not committed (about 18 MB). Remove `demo/*.mp4` from `.gitignore` to add it.
