export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'No Square token found' });

  // Get yesterday's date range
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  try {
    const response = await fetch('https://connect.squareup.com/v2/orders/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify({
        query: {
          filter: {
            date_time_filter: {
              created_at: {
                start_at: start.toISOString(),
                end_at: end.toISOString()
              }
            },
            state_filter: { states: ['COMPLETED'] }
          }
        }
      })
    });

    const data = await response.json();
    const orders = data.orders || [];

    // Calculate totals
    const revenue = orders.reduce((s, o) => s + (o.total_money?.amount || 0), 0) / 100;
    const transactions = orders.length;
    const avgSale = transactions > 0 ? revenue / transactions : 0;

    // Payment types
    const paymentTypes = {};
    orders.forEach(o => {
      (o.tenders || []).forEach(t => {
        const type = t.type || 'OTHER';
        paymentTypes[type] = (paymentTypes[type] || 0) + (t.amount_money?.amount || 0) / 100;
      });
    });

    res.status(200).json({ revenue, transactions, avgSale, paymentTypes, date: start.toISOString().split('T')[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
