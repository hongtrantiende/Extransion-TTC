const fs = require('fs');

async function test() {
    let response = await fetch('https://m.qidian.com/chapter/1044988453/843773302/');
    let text = await response.text();
    
    // Check if there is #chapterContent or similar
    let idx = text.indexOf('chapterContent');
    if (idx !== -1) {
        console.log("Found chapterContent! Snippet:", text.substring(idx - 50, idx + 500));
    } else {
        console.log("chapterContent not found. Searching for read-section or content classes...");
        let match = text.match(/class="([^"]*?read[^"]*?)"/g) || [];
        console.log("Read classes found:", match.slice(0, 15));
        
        // Log around where some Chinese text is
        let chIdx = text.indexOf('赵昊');
        if (chIdx !== -1) {
            console.log("Snippet around text:", text.substring(chIdx - 200, chIdx + 800));
        }
    }
}

test().catch(console.error);
