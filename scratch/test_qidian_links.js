const fs = require('fs');

async function test() {
    let response = await fetch('https://m.qidian.com/rank');
    let text = await response.text();
    
    let regex = /href="([^"]*?)"/g;
    let match;
    let links = [];
    while ((match = regex.exec(text)) !== null) {
        let link = match[1];
        if (link.includes('/rank/')) {
            links.push(link);
        }
    }
    
    console.log("Found rank links:", [...new Set(links)]);
}

test().catch(console.error);
