exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const code = body.code;
    const redirect_uri = body.redirect_uri;

    if (!code || !redirect_uri) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Missing code or redirect_uri" }) };
    }

    const params = new URLSearchParams();
    params.append("client_id", "1553738843214053426");
    params.append("client_secret", "OBfXwIZCeGDuoH9DMi3mtSlmTpolezW2");
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Token exchange failed", details: tokens }) };
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { "Authorization": "Bearer " + tokens.access_token }
    });

    const user = await userRes.json();

    if (!userRes.ok) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Failed to fetch user" }) };
    }

    return { statusCode: 200, headers: headers, body: JSON.stringify({ user: user }) };

  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: err.message }) };
  }
};
