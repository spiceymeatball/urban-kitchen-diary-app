import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app?xero_error=" + encodeURIComponent(error));
    res.status(302).end();
    return;
  }

  if (!code) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app?xero_error=no_code");
    res.status(302).end();
    return;
  }

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
      body: "grant_type=authorization_code&code=" + encodeURIComponent(code) + "&redirect_uri=" + encodeURIComponent(redirectUri)
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error + ": " + (tokens.error_description || ""));

    const tenantsRes = await fetch("https://api.xero.com/connections", {
      headers: { 
        "Authorization": "Bearer " + tokens.access_token,
        "Content-Type": "application/json"
      }
    });
    
    const tenants = await tenantsRes.json();
    const tenantId = tenants[0] && tenants[0].tenantId ? tenants[0].tenantId : "";
    if (!tenantId) throw new Error("No Xero organisation found");

    // Store token in environment-style response
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app?xt=" + 
      encodeURIComponent(tokens.access_token) + "&xi=" + encodeURIComponent(tenantId));
    res.status(302).end();

  } catch (err) {
    res.setHeader("Location", "https://urban-kitchen-diary-app.vercel.app?xero_error=" + encodeURIComponent(err.message));
    res.status(302).end();
  }
}
