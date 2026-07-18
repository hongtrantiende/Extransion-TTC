const fs = require('fs');

async function test() {
    let response = await fetch('https://m.qidian.com/so/%E7%B3%BB%E7%BB%9F.html');
    let text = await response.text();
    
    // Check if there are .y-list__item elements
    let count = (text.match(/class="[^"]*?y-list__item[^"]*?"/g) || []).length;
    console.log("Search y-list__item elements count:", count);
    
    // Print a sample of the list item
    let idx = text.indexOf('y-list__item');
    if (idx !== -1) {
        console.log("Sample Search HTML:", text.substring(idx - 50, idx + 1000));
    } else {
        console.log("y-list__item class not found! Searching for search result list classes...");
        let classes = text.match(/class="([^"]*?list[^"]*?)"/g) || [];
        console.log("List classes found:", classes.slice(0, 15));
    }
}

test().catch(console.error);
