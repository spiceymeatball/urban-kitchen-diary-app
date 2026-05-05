export default function handler(req, res) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access accounting.transactions accounting.contacts accounting.settings",
    state: "urban-kitchen"
  });

  const authUrl = "https://login.xero.com/identity/connect/authorize?" + params.toString();
  
  res.setHeader("Location", authUrl);
  res.status(302).end();
}
