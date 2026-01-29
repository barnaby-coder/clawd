const https = require('https');
const config = require('./config');
const { getDigestItems, loadData, saveData } = require('./collector');

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: config.telegram.chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${config.telegram.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendDigest(period = 'morning') {
  const items = getDigestItems(5);

  if (items.length === 0) {
    console.log('No new items for digest');
    return;
  }

  const data = loadData();
  const emoji = period === 'morning' ? '🌅' : '🌆';
  const greeting = period === 'morning' ? 'Morning' : 'Afternoon';

  let message = `${emoji} <b>${greeting} AI Briefing</b>\n\n`;

  items.forEach((item, i) => {
    const tierIcon = item.tier === 1 ? '🔥' : '📌';
    message += `${tierIcon} <b>${item.title}</b>\n`;
    message += `<i>${item.source}</i> · Score: ${item.score}\n`;
    if (item.summary) {
      message += `${item.summary.substring(0, 150)}...\n`;
    }
    message += `🔗 ${item.link}\n\n`;
  });

  message += `📊 Total items tracked: ${data.stats.totalCollected}`;

  try {
    await sendTelegram(message);
    console.log(`✅ ${greeting} digest sent (${items.length} items)`);

    // Mark items as delivered
    items.forEach(item => {
      const dataItem = data.items.find(i => i.id === item.id);
      if (dataItem) dataItem.status = 'delivered';
    });
    data.stats.totalDelivered += items.length;
    saveData(data);
  } catch (err) {
    console.error('Failed to send digest:', err.message);
  }
}

module.exports = { sendTelegram, sendDigest };
