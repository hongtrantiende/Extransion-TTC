const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.yckceo.com/yuedu/shuyuan/index.html';
const OUTPUT_FILE = path.join(__dirname, 'yckceo_sources.json');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.yckceo.com/'
            }
        };
        https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Handle redirect
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch page: HTTP Status ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function parsePage(html) {
    const sources = [];
    // Extract each <div class="ylist"> block
    const blockRegex = /<div class="ylist">([\s\S]*?)<\/div>\s*<\/div>/g;
    let match;
    
    while ((match = blockRegex.exec(html)) !== null) {
        const block = match[1];
        
        // 1. Extract ID
        const idMatch = block.match(/value="(\d+)"/);
        if (!idMatch) continue;
        const id = idMatch[1];
        
        // 2. Extract Title text and target URL
        const titleMatch = block.match(/<h2>\s*<a[^>]*?\/content\/id\/\d+\.html[^>]*?>([\s\S]*?)<\/a>/);
        if (!titleMatch) continue;
        
        const rawTitle = titleMatch[1].trim();
        let name = rawTitle;
        let targetUrl = '';
        
        // Clean HTML entities like &amp; &quot;
        name = name.replace(/&amp;/g, '&')
                   .replace(/&quot;/g, '"')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&#39;/g, "'")
                   .replace(/&nbsp;/g, ' ');
                   
        const urlMatch = name.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            targetUrl = urlMatch[1];
            name = name.replace(targetUrl, '').trim();
        }
        
        // 3. Extract Spans (Version, Tags, Author, Downloads)
        const spanRegex = /<span class="layui-badge-rim[^>]*?">([\s\S]*?)<\/span>/g;
        let spanMatch;
        let version = '';
        let tags = '';
        let author = '';
        let downloads = 0;
        
        while ((spanMatch = spanRegex.exec(block)) !== null) {
            const text = spanMatch[1].replace(/<[^>]+>/g, '').trim();
            if (text.startsWith('用户:')) {
                author = text.replace('用户:', '').trim();
            } else if (text.startsWith('下载:')) {
                downloads = parseInt(text.replace('下载:', '').trim()) || 0;
            } else if (text === '3.X' || text === '2.X') {
                version = text;
            } else if (text.length > 0) {
                tags = text; // e.g. "搜" or "发 搜 图"
            }
        }
        
        // 4. Extract Update Time
        const timeMatch = block.match(/class="m-right"[^>]*?>([\s\S]*?)<\/p>/);
        const updateTime = timeMatch ? timeMatch[1].trim() : '';
        
        sources.push({
            id,
            name,
            url: targetUrl,
            version,
            tags,
            author,
            downloads,
            time: updateTime
        });
    }
    return sources;
}

function getMaxPage(html) {
    const pageMatches = html.match(/page=(\d+)/g) || [];
    let maxPage = 1;
    pageMatches.forEach(m => {
        const p = parseInt(m.match(/\d+/)[0]);
        if (p > maxPage) maxPage = p;
    });
    return maxPage;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('Starting scrape of yckceo book sources...');
    try {
        const firstPageHtml = await fetchUrl(`${BASE_URL}?page=1`);
        const maxPage = getMaxPage(firstPageHtml);
        console.log(`Detected total pages to crawl: ${maxPage}`);
        
        let allSources = [];
        
        for (let page = 1; page <= maxPage; page++) {
            console.log(`Crawling page ${page}/${maxPage}...`);
            try {
                const html = page === 1 ? firstPageHtml : await fetchUrl(`${BASE_URL}?page=${page}`);
                const pageSources = parsePage(html);
                allSources.push(...pageSources);
                console.log(`  Found ${pageSources.length} sources on page ${page}. Total collected: ${allSources.length}`);
            } catch (e) {
                console.error(`  Error crawling page ${page}: ${e.message}`);
            }
            // Sleep 150ms between requests to avoid rate limits
            await sleep(150);
        }
        
        // Deduplicate and save
        const uniqueSources = [];
        const seenIds = new Set();
        for (const src of allSources) {
            if (!seenIds.has(src.id)) {
                seenIds.add(src.id);
                uniqueSources.push(src);
            }
        }
        
        console.log(`Completed crawl! Scraped ${allSources.length} items. Unique items: ${uniqueSources.length}`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueSources, null, 2), 'utf8');
        console.log(`Successfully saved dynamic catalog to ${OUTPUT_FILE}`);
    } catch (e) {
        console.error(`Fatal error in crawler: ${e.stack}`);
        process.exit(1);
    }
}

main();
