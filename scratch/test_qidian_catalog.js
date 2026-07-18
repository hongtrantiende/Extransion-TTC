const fs = require('fs');

async function test() {
    let response = await fetch('https://m.qidian.com/book/3169795/catalog');
    let text = await response.text();
    
    let count = (text.match(/class="[^"]*?_chapterItem[^"]*?"/g) || []).length;
    console.log("Total chapters in html:", count);
    
    // Check if there is pagination link
    let hasPagination = text.includes('下一页') || text.includes('page=') || text.includes('pageNum=');
    console.log("Has pagination text/links:", hasPagination);
}

test().catch(console.error);
