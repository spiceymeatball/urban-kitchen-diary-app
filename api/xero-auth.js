export default function handler(req, res) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  
  if (!clientId) {
    return res.status(500).json({ error: "Missing XERO_CLIENT_ID" });
  }
  if (!redirectUri) {
    return res.status(500).json({ error: "Missing XERO_REDIRECT_URI" });
  }
  
  const scope = "openid profile email accounting.reports.read accounting.transactions.read offline_access";
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: "urban-kitchen"
  });

  const authUrl = "https://login.xero.com/identity/connect/authorize?" + params.toString();
  
  res.setHeader("Location", authUrl);
  res.status(302).end();
}
