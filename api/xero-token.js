let storedToken = null;
let storedTenant = null;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'POST') {
    const { token, tenant } = req.body || {};
    if (token && tenant) {
      storedToken = token;
      storedTenant = tenant;
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'Missing token or tenant' });
  }
  
  if (storedToken && storedTenant) {
    const t = storedToken;
    const tn = storedTenant;
    storedToken = null;
    storedTenant = null;
    return res.status(200).json({ token: t, tenant: tn });
  }
  
  return res.status(404).json({ error: 'No token available' });
}
