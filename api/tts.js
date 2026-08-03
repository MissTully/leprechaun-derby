// One-way announcer voice: turn a line of text into speech with ElevenLabs
// Text-to-Speech. No microphone, no conversation — the announcer only speaks.
//
// The ElevenLabs API key stays server-side (same pattern as get-signed-url.js).
// The voice is resolved once and cached: an explicit ELEVENLABS_VOICE_ID wins,
// otherwise it's read from the Conversational agent's config so the announcer
// keeps the exact voice the agent was set up with.

let cachedVoiceId = null;

// Recursively find the first non-empty `voice_id` anywhere in the agent config,
// so we don't depend on ElevenLabs keeping it at a fixed path.
function findVoiceId(node) {
  if (!node || typeof node !== 'object') return null;
  if (typeof node.voice_id === 'string' && node.voice_id) return node.voice_id;
  for (const key of Object.keys(node)) {
    const found = findVoiceId(node[key]);
    if (found) return found;
  }
  return null;
}

async function resolveVoiceId(apiKey, agentId) {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  if (cachedVoiceId) return cachedVoiceId;
  if (!agentId) return null;
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`,
    { headers: { 'xi-api-key': apiKey } }
  );
  if (!resp.ok) return null;
  const agent = await resp.json();
  cachedVoiceId = findVoiceId(agent);
  return cachedVoiceId;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST.' }); return; }

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS;
  if (!apiKey) {
    res.status(500).json({
      error: 'Server is missing ELEVENLABS_API_KEY.',
      hint: 'Set it under this Vercel project\'s Settings -> Environment Variables, then redeploy.'
    });
    return;
  }

  // Body may arrive parsed (Vercel) or as a raw string; handle both.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const text = body && typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) { res.status(400).json({ error: 'Provide a non-empty "text" field.' }); return; }

  const agentId = (req.query && req.query.agent_id) || process.env.ELEVENLABS_AGENT_ID;

  try {
    const voiceId = await resolveVoiceId(apiKey, agentId);
    if (!voiceId) {
      res.status(500).json({
        error: 'Could not resolve a voice for the announcer.',
        hint: 'Set ELEVENLABS_VOICE_ID on the server, or pass a valid agent_id whose config includes a voice.'
      });
      return;
    }

    const model = process.env.ELEVENLABS_TTS_MODEL || 'eleven_turbo_v2_5';
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true }
        })
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: 'ElevenLabs rejected the TTS request.', detail });
      return;
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(audio);
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error while contacting ElevenLabs.', detail: String(e) });
  }
}
