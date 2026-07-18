const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function run() {
    const html = await fetchUrl('https://www.yckceo.com/yuedu/shuyuan/content/id/7497.html');
    
    // Find all links
    const matches = html.match(/href="([^"]+)"/g) || [];
    console.log('--- ALL HREF LINKS ---');
    matches.forEach(m => console.log(m));

    // Look for button elements or export JSON keywords
    const layuiBtns = html.match(/<a[^>]*class="[^"]*layui-btn[^"]*"[^>]*>([\s\S]*?)<\/a>/g) || [];
    console.log('\n--- LAYUI BUTTONS ---');
    layuiBtns.forEach(b => console.log(b.trim()));
}

run().catch(console.error);
