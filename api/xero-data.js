export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { token, tenantId } = req.query;
  if (!token || !tenantId) return res.status(400).json({ error: 'Missing token or tenant ID' });

  try {
    // Get current month P&L report
    const now = new Date();
    const fromDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const toDate = now.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Xero-tenant-id': tenantId,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    if (data.Type === 'ERROR') throw new Error(data.Message);

    // Parse P&L rows
    const report = data.Reports?.[0];
    const rows = report?.Rows || [];
    
    let revenue = 0, expenses = 0, cogs = 0;

    rows.forEach(section => {
      const title = section.Title?.toLowerCase() || '';
      const sectionTotal = parseFloat(section.Rows?.find(r => r.RowType === 'SummaryRow')?.Cells?.[1]?.Value || 0);
      
      if (title.includes('income') || title.includes('revenue') || title.includes('trading income')) {
        revenue = Math.abs(sectionTotal);
      }
      if (title.includes('cost of sales') || title.includes('cost of goods') || title.includes('cogs')) {
        cogs = Math.abs(sectionTotal);
      }
      if (title.includes('expense')) {
        expenses = Math.abs(sectionTotal);
      }
    });

    const grossProfit = revenue - cogs;
    const netProfit = revenue - cogs - expenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue * 100).toFixed(1) : 0;

    res.status(200).json({ revenue, cogs, expenses, grossProfit, netProfit, grossMargin, fromDate, toDate });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
