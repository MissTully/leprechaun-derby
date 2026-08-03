export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Use GET.' }); return; }

  // Prefer the canonical name; fall back to ELEVENLABS for the var as originally created.
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS;
  const agentId = (req.query && req.query.agent_id) || process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    res.status(500).json({
      error: 'Server is missing ELEVENLABS_API_KEY.',
      hint: 'Set it under this Vercel project\'s Settings -> Environment Variables, then redeploy.'
    });
    return;
  }
  if (!agentId) {
    res.status(400).json({ error: 'No agent_id provided in the query string, and no ELEVENLABS_AGENT_ID default is set on the server.' });
    return;
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey } }
    );
    const bodyText = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'ElevenLabs rejected the request.', detail: bodyText });
      return;
    }
    const body = JSON.parse(bodyText);
    res.status(200).json({ signedUrl: body.signed_url });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error while contacting ElevenLabs.', detail: String(e) });
  }
}
