// api/create-web-call.js  (Vercel serverless function, Node runtime)
//
// Env vars (Vercel -> Project -> Settings -> Environment Variables):
//   RETELL_API_KEY      your Retell secret API key
//   RETELL_AGENT_ID     the agent that answers "Talk to my AI"
//   ALLOWED_ORIGINS     optional, comma-separated, e.g. https://theabdullaht.vercel.app
//
// The browser calls POST /api/create-web-call and gets back only what it needs
// to join the call. The API key never leaves the server.

const ALLOWED = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Light guard: only your own site's pages may request a call.
  const origin = req.headers.origin || "";
  if (ALLOWED.length && !ALLOWED.includes(origin)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  if (!apiKey || !agentId) {
    // The page shows its "demo isn't switched on yet" message for any non-OK reply.
    return res.status(503).json({ error: "not_configured" });
  }

  try {
    const r = await fetch("https://api.retellai.com/v3/create-web-call", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!r.ok) return res.status(502).json({ error: "upstream_" + r.status });

    const call = await r.json();
    return res.status(200).json({
      call_id: call.call_id,
      access_token: call.access_token,
      transport: call.transport,
      ice_servers: call.ice_servers,
    });
  } catch (e) {
    return res.status(502).json({ error: "upstream_failed" });
  }
};
