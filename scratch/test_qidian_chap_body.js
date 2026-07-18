const fs = require('fs');

async function test() {
    let response = await fetch('https://m.qidian.com/chapter/1044988453/843773302/');
    let text = await response.text();
    
    // Find content class div and print its innerHTML
    let idx = text.indexOf('class="content ');
    if (idx !== -1) {
        console.log("Found content div! Snippet:", text.substring(idx - 10, idx + 2000));
    } else {
        console.log("content div not found.");
    }
}

test().catch(console.error);
