export default async function handler(req, res) {
  const { code, error } = req.query;

  // If Xero returned an error
  if (error) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/#xero_error=" + encodeURIComponent(error));
    res.status(302).end();
    return;
  }

  // If no code returned
  if (!code) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/#xero_error=no_code_returned");
    res.status(302).end();
    return;
  }

  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/#xero_error=missing_credentials");
    res.status(302).end();
    return;
  }

  try {
    const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + credentials
      },
      body: "grant_type=authorization_code&code=" + encodeURIComponent(code) + "&redirect_uri=" + encodeURIComponent(redirectUri)
    });

    const tokens = await tokenRes.json();
    
    if (tokens.error) {
      res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/#xero_error=" + encodeURIComponent(tokens.error + ": " + (tokens.error_description || "")));
      res.status(302).end();
      return;
    }

    const tenantsRes = await fetch("https://api.xero.com/connections", {
      headers: { 
        "Authorization": "Bearer " + tokens.access_token,
        "Content-Type": "application/json"
      }
    });
    
    const tenants = await tenantsRes.json();
    const tenantId = tenants[0] && tenants[0].tenantId ? tenants[0].tenantId : "";
    
    if (!tenantId) {
      res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/?xero_error=no_tenant_found");
      res.status(302).end();
      return;
    }

    const redirectUrl = "https://urban-kitchen-diary-app.vercel.app/#xero_token=" + 
      encodeURIComponent(tokens.access_token) + 
      "&xero_tenant=" + encodeURIComponent(tenantId);

    res.setHeader("Location", redirectUrl);
    res.status(302).end();

  } catch (err) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app/#xero_error=" + encodeURIComponent(err.message));
    res.status(302).end();
  }
}
