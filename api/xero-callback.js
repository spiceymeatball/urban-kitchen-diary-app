export default async function handler(req, res) {
  const { code } = req.query;
  
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  try {
    const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + credentials
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    const tenantsRes = await fetch("https://api.xero.com/connections", {
      headers: { 
        "Authorization": "Bearer " + tokens.access_token,
        "Content-Type": "application/json"
      }
    });
    
    const tenants = await tenantsRes.json();
    const tenantId = tenants[0] && tenants[0].tenantId ? tenants[0].tenantId : "";

    if (!tenantId) throw new Error("No Xero organisation found");

    const redirectUrl = "https://urban-kitchen-diary-app.vercel.app/?xero_token=" + 
      encodeURIComponent(tokens.access_token) + 
      "&xero_tenant=" + encodeURIComponent(tenantId);

    res.setHeader("Location", redirectUrl);
    res.status(302).end();

  } catch (err) {
    const errorUrl = "https://urban-kitchen-diary-app.vercel.app/?xero_error=" + encodeURIComponent(err.message);
    res.setHeader("Location", errorUrl);
    res.status(302).end();
  }
}
