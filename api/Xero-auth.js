export default function handler(req, res) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  
  const scope = 'openid profile email accounting.reports.read accounting.transactions.read offline_access';
  
  const authUrl = "https://login.xero.com/identity/connect/authorize?response_type=code&client_id=" + clientId + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&scope=" + encodeURIComponent(scope) + "&state=urban-kitchen";
  
  res.redirect(authUrl);
}
