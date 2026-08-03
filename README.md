# Shamrock Derby — Bayshore Boulevard

A single-file browser game with an optional **live AI announcer** ("Fitzy McRoar")
powered by ElevenLabs **Text-to-Speech**.

The announcer is **one-way** — it only announces, it never listens or converses —
so the game **never requests microphone access**. Each written broadcast line
(race calls and awards) is sent to a small serverless function that synthesizes
it in the announcer's voice and returns the audio.

## Structure

```
index.html             # The entire game (HTML/CSS/JS, single file)
api/tts.js             # Vercel serverless function: turns a line of text into
                       # speech via ElevenLabs TTS, keeping the API key server-side
api/get-signed-url.js  # Legacy: signed-URL minter for the old Conversational AI
                       # agent. No longer used by the game; kept for reference.
```

The game and the API live in **one Vercel project** and are served same-origin.
The front end POSTs to `/api/tts?agent_id=...` (relative path), so no
CORS/cross-project setup is required.

## Deployment (Vercel)

Zero-config: `index.html` is served as a static file and `api/*.js` is deployed
as a serverless function automatically.

- **Project:** `shamrock-derby-game` (Vercel team `encountive`)
- **Live URL:** https://shamrock-derby-game.vercel.app

### Environment variables

| Name                  | Required | Purpose                                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------------------------- |
| `ELEVENLABS_API_KEY`  | Yes      | Server-side ElevenLabs key used to synthesize the announcer's speech.                   |
| `ELEVENLABS_VOICE_ID` | Optional | Voice used for the announcer. If unset, it's read from the agent's config (see below).  |
| `ELEVENLABS_AGENT_ID` | Optional | Fallback agent id if the front end doesn't pass one in the query string.                |
| `ELEVENLABS_TTS_MODEL`| Optional | TTS model id (defaults to `eleven_turbo_v2_5`).                                          |

**Voice resolution:** `/api/tts` uses `ELEVENLABS_VOICE_ID` when set. Otherwise it
looks up the Conversational agent (`agent_5201kz40jbs5epa8jkpcxyh391d2`, passed
from the front end) and reuses **that agent's voice**, so Fitzy sounds the same
as before — no extra configuration needed. Set `ELEVENLABS_VOICE_ID` only to
pin a specific voice.

Environment variables take effect on the **next deployment** — redeploy after
changing them.

### Behavior without the key

If `ELEVENLABS_API_KEY` is unset (or the TTS request fails for any line),
`/api/tts` returns an error and the game **falls back to the browser's built-in
voice** for that line. The game itself remains fully playable.

## Announcer persona

The full "Fitzy McRoar" persona prompt and ElevenLabs voice/agent setup live in
`Shamrock-Derby-AI-Announcer-Setup.docx` (kept outside this repo).
