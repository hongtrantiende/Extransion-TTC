const fs = require('fs');
const path = require('path');
const urlParser = require('url');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');
const yckceoJsonPath = path.join(repoDir, 'yckceo_sources.json');

function cleanDomain(urlStr) {
    if (!urlStr) return '';
    try {
        const parsed = urlParser.parse(urlStr);
        let host = parsed.hostname || '';
        host = host.replace(/^www\./i, '');
        return host.toLowerCase();
    } catch (e) {
        return '';
    }
}

function run() {
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const yckceo = JSON.parse(fs.readFileSync(yckceoJsonPath, 'utf8'));

    // Extract all domains already in our catalog
    const existingDomains = new Set();
    plugin.data.forEach(e => {
        const domain = cleanDomain(e.source);
        if (domain) existingDomains.add(domain);
    });

    // Filter yckceo sources for clean websites (non-NSFW)
    const candidates = [];
    yckceo.forEach(src => {
        if (!src.url) return;
        const name = src.name || '';
        const tags = src.tags || '';
        const hasSearch = tags.includes('搜');
        const hasExplore = tags.includes('发');
        const isComic = tags.includes('图');
        const isAudio = tags.includes('声');

        // Phải có search & explore, ko có comic/audio
        if (hasSearch && hasExplore && !isComic && !isAudio) {
            // Loại bỏ các từ khóa người lớn/nhạy cảm
            const lowerName = name.toLowerCase();
            const lowerUrl = src.url.toLowerCase();
            const isAdult = lowerName.includes('🔞') || 
                            lowerName.includes('18') || 
                            lowerName.includes('黄') || 
                            lowerName.includes('涩') || 
                            lowerName.includes('uaa') || 
                            lowerName.includes('po18') ||
                            lowerName.includes('banzhu') ||
                            lowerName.includes('绅士') ||
                            lowerName.includes('肉') ||
                            lowerName.includes('sex') ||
                            lowerName.includes('h小说') ||
                            lowerUrl.includes('uaa') ||
                            lowerUrl.includes('po18') ||
                            lowerUrl.includes('banzhu');

            if (!isAdult) {
                const domain = cleanDomain(src.url);
                if (domain && !existingDomains.has(domain)) {
                    candidates.push({
                        id: src.id,
                        name: src.name,
                        url: src.url,
                        domain,
                        tags: src.tags,
                        author: src.author,
                        downloads: src.downloads || 0,
                        time: src.time
                    });
                }
            }
        }
    });

    candidates.sort((a, b) => b.downloads - a.downloads);

    console.log(`\nTop 15 nguồn chữ Trung Quốc SẠCH (không chứa nsfw) chưa có trong repo:`);
    candidates.slice(0, 15).forEach((c, idx) => {
        console.log(`${idx + 1}. [ID: ${c.id}] Name: ${c.name} | Domain: ${c.domain} | URL: ${c.url} | Downloads: ${c.downloads} | Author: ${c.author}`);
    });
}

run();
