const domains = [
  'sextop1.com', 'sextop1.me', 'sextop1.top', 'sextop1.run', 'sextop1.vip',
  'sextop1.co', 'sextop1.io', 'sextop1.club', 'sextop1.one', 'sextop1.live',
  'sextop1.asia', 'sextop1.online', 'sextop1.host', 'sextop1.mobi', 'sextop1.to'
];

async function check() {
  for (const d of domains) {
    try {
      const r = await fetch('https://' + d, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const text = await r.text();
      const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No Title';
      console.log(`🌐 ${d} -> Status: ${r.status}, Title: ${title}, HTML: ${text.substring(0, 150).replace(/\r?\n/g, ' ')}`);
    } catch (e) {
      console.log(`❌ ${d} failed: ${e.message}`);
    }
  }
}

check();
