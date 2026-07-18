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

    console.log(`📊 Hiện tại có ${existingDomains.size} tên miền duy nhất trong plugin.json của repo.`);

    // Filter yckceo sources
    const candidates = [];
    yckceo.forEach(src => {
        if (!src.url) return;
        const tags = src.tags || '';
        // 1. Phải có tìm kiếm ("搜") và khám phá/phân loại ("发")
        const hasSearch = tags.includes('搜');
        const hasExplore = tags.includes('发');
        // 2. Không chứa comic/hình ảnh ("图") hoặc audio ("声")
        const isComic = tags.includes('图');
        const isAudio = tags.includes('声');

        if (hasSearch && hasExplore && !isComic && !isAudio) {
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
    });

    // Sắp xếp theo số lượng tải về giảm dần (độ phổ biến)
    candidates.sort((a, b) => b.downloads - a.downloads);

    console.log(`🔍 Tìm thấy ${candidates.length} nguồn ứng cử viên mới có đủ Tìm kiếm & Khám phá.`);
    console.log('\nTop 20 nguồn chữ Trung Quốc phổ biến nhất chưa có trong repo:');
    candidates.slice(0, 20).forEach((c, idx) => {
        console.log(`${idx + 1}. [ID: ${c.id}] Name: ${c.name} | Domain: ${c.domain} | URL: ${c.url} | Downloads: ${c.downloads} | Tags: ${c.tags} | Author: ${c.author}`);
    });
}

run();
