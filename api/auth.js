export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "Missing code or verifier" });
  }

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

    res.status(200).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Token exchange failed" });
  }
}
