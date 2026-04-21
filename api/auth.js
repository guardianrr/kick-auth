export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, code_verifier } = req.body || {};

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "Missing code or verifier" });
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("redirect_uri", process.env.REDIRECT_URI);
    params.append("code_verifier", code_verifier);

    const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const tokenText = await tokenResponse.text();
    console.log("RAW TOKEN RESPONSE:", tokenText);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = { raw: tokenText };
    }

    if (!tokenResponse.ok) {
      return res.status(400).json(tokenData);
    }

    const accessToken = tokenData.access_token;

    // Buscar utilizador autenticado
    const userResponse = await fetch("https://api.kick.com/public/v1/users", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    const userText = await userResponse.text();
    console.log("RAW USER RESPONSE:", userText);

    let userData;
    try {
      userData = JSON.parse(userText);
    } catch {
      userData = { raw: userText };
    }

    // estrutura esperada: { data: [ { name, profile_picture, user_id, email } ], message: "..." }
    const user = Array.isArray(userData?.data) ? userData.data[0] : null;

    return res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_in: tokenData.expires_in || null,
      user: user
        ? {
            id: user.user_id || null,
            username: user.name || "Kick User",
            avatar: user.profile_picture || "https://kick.com/img/default-profile-pictures/default-avatar-2.webp",
            email: user.email || null
          }
        : null
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      error: "Server crash",
      details: err.message
    });
  }
}
