export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  
  if (!token) return res.status(500).json({ error: 'No Square token found' });

  try {
    // Use provided date or yesterday
    const now = new Date();
    const targetDate = req.query.date || (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();

    let allPayments = [];
    let cursor = null;

    do {
      const url = "https://connect.squareup.com/v2/payments?location_id=" + locationId +
        "&begin_time=" + targetDate + "T00:00:00.000Z" +
        "&end_time=" + targetDate + "T23:59:59.999Z" +
        "&status=COMPLETED&limit=100" +
        (cursor ? "&cursor=" + cursor : "");

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': "Bearer " + token,
          'Square-Version': '2024-01-18',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.errors) return res.status(400).json({ error: data.errors[0].detail });

      allPayments = allPayments.concat(data.payments || []);
      cursor = data.cursor || null;
    } while (cursor);

    const grossSales = allPayments.reduce((s, p) => s + (p.amount_money?.amount || 0), 0) / 100;
    const totalRefunds = allPayments.reduce((s, p) => s + (p.refunded_money?.amount || 0), 0) / 100;
    const netSales = grossSales - totalRefunds;
    const transactions = allPayments.length;
    const avgSale = transactions > 0 ? netSales / transactions : 0;

    const paymentTypes = {};
    allPayments.forEach(p => {
      const type = p.source_type || 'OTHER';
      paymentTypes[type] = (paymentTypes[type] || 0) + (p.amount_money?.amount || 0) / 100;
    });

    // Hourly breakdown with clock times
    const hourly = {};
    allPayments.forEach(p => {
      const date = new Date(p.created_at);
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'pm' : 'am';
      const hour12 = hour % 12 || 12;
      const label = hour12 + ":00" + ampm;
      const sortKey = hour;
      if (!hourly[sortKey]) hourly[sortKey] = { label, revenue: 0, transactions: 0 };
      hourly[sortKey].revenue += (p.amount_money?.amount || 0) / 100;
      hourly[sortKey].transactions += 1;
    });

    res.status(200).json({ 
      grossSales, netSales, totalRefunds, transactions, avgSale,
      paymentTypes, hourly, date: targetDate
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
