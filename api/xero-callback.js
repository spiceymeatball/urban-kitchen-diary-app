export default async function handler(req, res) {
  const { code } = req.query;
  
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description);

    // Get Xero tenant ID
    const tenantsRes = await fetch('https://api.xero.com/connections', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    const tenants = await tenantsRes.json();
    const tenantId = tenants[0]?.tenantId;

    // Redirect back to app with tokens in URL
    res.redirect(`/?xero_token=${tokens.access_token}&xero_tenant=${tenantId}&xero_refresh=${tokens.refresh_token}`);

  } catch (err) {
    res.redirect(`/?xero_error=${encodeURIComponent(err.message)}`);
  }
}
