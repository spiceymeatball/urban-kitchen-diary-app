export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  
  if (!token) return res.status(500).json({ error: 'No Square token found' });

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const response = await fetch(
      `https://connect.squareup.com/v2/payments?location_id=${locationId}&begin_time=${dateStr}T00:00:00.000Z&end_time=${dateStr}T23:59:59.999Z&status=COMPLETED`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Square-Version': '2024-01-18',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    if (data.errors) return res.status(400).json({ error: data.errors[0].detail });

    const payments = data.payments || [];
    const revenue = payments.reduce((s,p) => s + (p.amount_money?.amount || 0), 0) / 100;
    const transactions = payments.length;
    const avgSale = transactions > 0 ? revenue / transactions : 0;

    const paymentTypes = {};
    payments.forEach(p => {
      const type = p.source_type || 'OTHER';
      paymentTypes[type] = (paymentTypes[type] || 0) + (p.amount_money?.amount || 0) / 100;
    });

    res.status(200).json({ revenue, transactions, avgSale, paymentTypes, date: dateStr });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
