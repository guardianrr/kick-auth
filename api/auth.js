export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { code, code_verifier } = req.body;

  try {
    const response = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        code_verifier
      })
    });

    const data = await response.json();

    console.log("KICK RESPONSE:", data);

    // 🔥 MOSTRA O ERRO REAL
    if (!response.ok) {
      return res.status(400).json(data);
    }

    res.status(200).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crash", details: err.message });
  }
}
