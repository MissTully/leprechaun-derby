# Shamrock Derby — Bayshore Boulevard

A single-file browser game with an optional **live AI announcer** ("Fitzy McRoar")
powered by ElevenLabs Conversational AI.

## Structure

```
index.html            # The entire game (HTML/CSS/JS, ~172 KB, single file)
api/get-signed-url.js  # Vercel serverless function: mints a short-lived
                       # ElevenLabs signed URL so the API key stays server-side
```

The game and the API live in **one Vercel project** and are served same-origin.
The front end calls `/api/get-signed-url?agent_id=...` (relative path), so no
CORS/cross-project setup is required.

## Deployment (Vercel)

Zero-config: `index.html` is served as a static file and `api/*.js` is deployed
as a serverless function automatically.

- **Project:** `shamrock-derby-game` (Vercel team `encountive`)
- **Live URL:** https://shamrock-derby-game.vercel.app

### Required environment variable

| Name                 | Where                                   | Purpose                                              |
| -------------------- | --------------------------------------- | ---------------------------------------------------- |
| `ELEVENLABS_API_KEY` | Vercel → Settings → Environment Vars    | Server-side ElevenLabs key used to mint signed URLs. |

The ElevenLabs **agent id** is passed from the front end in the query string
(`agent_5201kz40jbs5epa8jkpcxyh391d2`), so `ELEVENLABS_AGENT_ID` is optional.
Set it only if you want a server-side default.

Environment variables take effect on the **next deployment** — redeploy after
changing them.

### Behavior without the key

If `ELEVENLABS_API_KEY` is unset, `/api/get-signed-url` returns HTTP 500 with a
descriptive message, and the game **falls back to the browser's built-in voice**
for ceremony narration. The game itself remains fully playable.

## Announcer persona

The full "Fitzy McRoar" persona prompt and ElevenLabs agent setup live in
`Shamrock-Derby-AI-Announcer-Setup.docx` (kept outside this repo).
