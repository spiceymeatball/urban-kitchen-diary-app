export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { token, tenantId } = req.query;
  if (!token || !tenantId) return res.status(400).json({ error: 'Missing token or tenant ID' });

  try {
    const now = new Date();
    const fromDate = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-01";
    const toDate = now.toISOString().split('T')[0];

    // Get invoices for revenue
    const invRes = await fetch(
      "https://api.xero.com/api.xro/2.0/Invoices?where=Date>=DateTime(" + now.getFullYear() + "," + (now.getMonth()+1) + ",1)&Status=AUTHORISED&Type=ACCREC",
      {
        headers: {
          'Authorization': "Bearer " + token,
          'Xero-tenant-id': tenantId,
          'Accept': 'application/json'
        }
      }
    );
    const invData = await invRes.json();
    const invoices = invData.Invoices || [];
    const revenue = invoices.reduce((s, inv) => s + (inv.SubTotal || 0), 0);

    // Get bills for expenses
    const billRes = await fetch(
      "https://api.xero.com/api.xro/2.0/Invoices?where=Date>=DateTime(" + now.getFullYear() + "," + (now.getMonth()+1) + ",1)&Status=AUTHORISED&Type=ACCPAY",
      {
        headers: {
          'Authorization': "Bearer " + token,
          'Xero-tenant-id': tenantId,
          'Accept': 'application/json'
        }
      }
    );
    const billData = await billRes.json();
    const bills = billData.Invoices || [];
    const expenses = bills.reduce((s, b) => s + (b.SubTotal || 0), 0);
    const cogs = expenses * 0.6;
    const grossProfit = revenue - cogs;
    const netProfit = revenue - expenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue * 100).toFixed(1) : 0;

    res.status(200).json({ revenue, cogs, expenses, grossProfit, netProfit, grossMargin, fromDate, toDate });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
