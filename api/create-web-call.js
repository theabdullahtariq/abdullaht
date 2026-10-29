// Vercel serverless function: creates a short-lived Retell web-call token.
// Your API key never reaches the browser. Set these in Vercel -> Settings -> Environment Variables:
//   RETELL_API_KEY   your Retell API key
//   RETELL_AGENT_ID  the agent the website demo should talk to
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Only accept calls started from your own site
  const origin = req.headers.origin;
  if (origin && req.headers.host && new URL(origin).host !== req.headers.host) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const key = process.env.RETELL_API_KEY;
  const agent = process.env.RETELL_AGENT_ID;
  if (!key || !agent) return res.status(503).json({ error: 'Voice demo not configured' });
  try {
    const r = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent })
    });
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' });
    const d = await r.json();
    return res.status(200).json({ access_token: d.access_token });
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error' });
  }
};
