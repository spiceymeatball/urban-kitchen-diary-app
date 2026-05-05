export default function handler(req, res) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  
  res.status(200).json({
    hasClientId: !!clientId,
    clientIdLength: clientId ? clientId.length : 0,
    clientIdStart: clientId ? clientId.substring(0, 4) : "empty",
    hasRedirectUri: !!redirectUri,
    redirectUri: redirectUri
  });
}
