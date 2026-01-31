const fs = require('fs');
const axios = require('axios');

async function main() {
  console.log('🧪 Generating clickable HTML briefing...');
  
  const { fetchBriefings } = require('./scripts/fetch-briefings');
  const dataPath = './briefings.json';

  try {
    // Fetch briefings
    const briefingsResult = await fetchBriefings();
    
    // Generate clickable HTML
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    let html = `🤖 <b>AI Leadership Briefing</b> 📅 ${date} ${time}\n\n`;
    const { items: [] } = briefingsResult;
    const limit = parseInt(process.env.LIMIT) || 10;
    const sourceFilter = process.env.SOURCE_FILTER || 'All Sources';

    // Filter by source if specified
    if (sourceFilter && sourceFilter !== 'All Sources') {
      const lowerFilter = sourceFilter.toLowerCase();
      items.items = items.items.filter(item => item.source.toLowerCase().includes(lowerFilter));
    }

    // Sort by March Score (descending - highest first)
    items.items.sort((a, b) => {
      const scoreA = a.marchScore || 50;
      const scoreB = b.marchScore || 50;
      return scoreB - scoreA;
    });

    // Get top N items
    const topItems = items.items.slice(0, Math.min(items.items.length, limit));

    // Categorize items by March Score
    const critical = topItems.filter(item => (item.marchScore || 50) >= 80);
    const high = topItems.filter(item => {
      const score = item.marchScore || 50;
      return score >= 70 && score < 80;
    });
    const medium = topItems.filter(item => {
      const score = item.marchScore || 50;
      return score >= 60 && score < 70;
    });
    const low = topItems.filter(item => {
      const score = item.marchScore || 50;
      return score >= 50 && score < 60;
    });

    // Critical Priority (80-100)
    if (critical.length > 0) {
      html += `🔥 <u>CRITICAL PRIORITY — AI Leadership</u> (${critical.length} items)\n\n`;
      critical.forEach((item, i) => {
        const scoreDisplay = `${item.marchScore || 50}/100`;
        html += `• <a href="${item.link}"><b>${item.title}</b></a> · <i>${item.source}</i> · <b>Score: ${scoreDisplay}</b>\n`;
        if (item.description && item.description.length > 50) {
          html += `  ${item.description.substring(0, 150)}...\n`;
        }
      });
    }

    // High Priority (70-79)
    if (high.length > 0) {
      html += `\n🟠 <u>HIGH PRIORITY — Technology & AI</u> (${high.length} items)\n\n`;
      high.forEach((item, i) => {
        const scoreDisplay = `${item.marchScore || 50}/100`;
        html += `•<a href="${item.link}"><b>${item.title}</b></a> · <i>${item.source}</i> · <b>Score: ${scoreDisplay}</b>\n`;
        if (item.aiLeadership) {
          html += ` 🤖`;
        }
      });
    }

    // Medium Priority (60-69)
    if (medium.length > 0) {
      html += `\n🟡 <u>MEDIUM PRIORITY — General Business</u> (${medium.length} items)\n\n`;
      medium.forEach((item, i) => {
        const scoreDisplay = `${item.marchScore || 50}/100`;
        html += `• <a href="${item.link}"><b>${item.title}</b></a> · <i>${item.source}</i> · <b>Score: ${scoreDisplay}</b>\n`;
      });
    }

    // Low Priority (50-59)
    if (low.length > 0) {
      html += `\n⚪ <u>LOW PRIORITY — General Content</u> (${low.length} items)\n\n`;
      low.forEach((item, i) => {
        const scoreDisplay = `${item.marchScore || 50}/100`;
        html += `• <a href="${item.link}"><b>${item.title}</b></a> · <i>${item.source}</i> · <b>Score: ${scoreDisplay}</b>\n`;
      });
    }

    // Statistics Footer
    const aiLeadership = topItems.filter(item => item.aiLeadership === true).length;
    const avgScore = topItems.reduce((sum, item) => sum + (item.marchScore || 50), 0) / topItems.length;

    html += `\n\n<b>📊 PRIORIZATION STATISTICS</b>\n`;
    html += `<b>Total Items:</b> ${topItems.length}\n`;
    html += `<b>Critical (80-100):</b> ${critical.length} (${Math.round(critical.length / topItems.length * 100)}%)\n`;
    html += `<b>High (70-99):</b> ${high.length} (${Math.round(high.length / topItems.length * 100)}%)\n`;
    html += `<b>Medium (60-69):</b> ${medium.length} (${Math.round(medium.length / topItems.length * 100)}%)\n`;
    html += `<b>Low (50-59):</b> ${low.length} (${Math.round(low.length / topItems.length * 100)}%)\n`;
    html += `<b>AI Leadership:</b> ${aiLeadership} (${Math.round(aiLeadership / topItems.length * 100)}%)\n`;
    html += `<b>Average March Score:</b> ${(avgScore).toFixed(1)}/100\n`;
    html += `<b>Total in Database:</b> ${briefingsResult.totalItems || 0}\n`;
    html += `\n🔗 <a href="http://localhost:3457/api/items">View All Items</a> | <a href="http://localhost:3457/api/stats">View Statistics</a>\n\n`;

    console.log('✅ Clickable HTML briefing generated');
    console.log(`📊 Total items: ${topItems.length}`);
    console.log(`🤖 AI Leadership: ${aiLeadership}`);
    console.log(`📊 Average Score: ${avgScore.toFixed(1)}`);

    // Save to output file
    const outputPath = '/tmp/briefing.html';
    fs.writeFileSync(outputPath, html);
    console.log(`📤 Saved to: ${outputPath}`);

    return {
      success: true,
      totalCollected: briefingsResult.totalCollected,
      aiLeadership: briefingsResult.aiLeadershipCount,
      html,
      outputPath
    };

  } catch (err) {
    console.error('❌ Error:', err.message);
    return {
      success: false,
      error: err.message
    };
  }

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
