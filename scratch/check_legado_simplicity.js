const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const yckceoJsonPath = path.join(repoDir, 'yckceo_sources.json');

async function fetchJson(id) {
    const url = `https://www.yckceo.com/yuedu/shuyuan/json/id/${id}.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

async function run() {
    const yckceo = JSON.parse(fs.readFileSync(yckceoJsonPath, 'utf8'));

    // Top clean candidates from previous run
    const targets = [
        { id: '3253', name: '哔哩轻小说' },
        { id: '5614', name: '奇·阅读' },
        { id: '5638', name: '起点男频' },
        { id: '5664', name: '69书吧' },
        { id: '5635', name: '精选小说书' },
        { id: '5629', name: '华东看书' },
        { id: '5665', name: '台湾小说' },
        { id: '5627', name: '小说虎' },
        { id: '5644', name: '抖音小说' },
        { id: '5640', name: '无忧书城' }
    ];

    console.log('🔍 Đang tải và phân tích tính đơn giản của các nguồn Legado...');

    for (const t of targets) {
        const rulesArray = await fetchJson(t.id);
        if (!rulesArray || rulesArray.length === 0) {
            console.log(`❌ ID: ${t.id} (${t.name}) - Không tải được JSON.`);
            continue;
        }

        const rule = rulesArray[0];
        const searchUrl = rule.searchUrl || '';
        const hasJsInSearchUrl = searchUrl.includes('js:') || searchUrl.includes('<js>');

        const ruleSearch = JSON.stringify(rule.ruleSearch || {});
        const hasJsInSearch = ruleSearch.includes('@js') || ruleSearch.includes('<js>');

        const ruleBookInfo = JSON.stringify(rule.ruleBookInfo || {});
        const hasJsInBookInfo = ruleBookInfo.includes('@js') || ruleBookInfo.includes('<js>');

        const ruleToc = JSON.stringify(rule.ruleToc || {});
        const hasJsInToc = ruleToc.includes('@js') || ruleToc.includes('<js>');

        const ruleContent = JSON.stringify(rule.ruleContent || {});
        const hasJsInContent = ruleContent.includes('@js') || ruleContent.includes('<js>');

        const totalJs = hasJsInSearchUrl || hasJsInSearch || hasJsInBookInfo || hasJsInToc || hasJsInContent;

        console.log(`\n----------------------------------------`);
        console.log(`📌 Nguồn: ${t.name} (ID: ${t.id}) | URL: ${rule.bookSourceUrl}`);
        console.log(`   - Search URL: ${searchUrl.substring(0, 80)}...`);
        console.log(`   - Chứa JS trong Search URL? ${hasJsInSearchUrl ? 'ĐỎ 🔴' : 'XANH 🟢'}`);
        console.log(`   - Chứa JS trong Search? ${hasJsInSearch ? 'ĐỎ 🔴' : 'XANH 🟢'}`);
        console.log(`   - Chứa JS trong Book Info? ${hasJsInBookInfo ? 'ĐỎ 🔴' : 'XANH 🟢'}`);
        console.log(`   - Chứa JS trong TOC? ${hasJsInToc ? 'ĐỎ 🔴' : 'XANH 🟢'}`);
        console.log(`   - Chứa JS trong Content? ${hasJsInContent ? 'ĐỎ 🔴' : 'XANH 🟢'}`);
        console.log(`   👉 Đánh giá: ${totalJs ? 'PHỨC TẠP (Có JS)' : 'ĐƠN GIẢN (Chỉ CSS/XPath) ⭐'}`);

        if (!totalJs) {
            console.log(`   📥 Chi tiết Selectors:`);
            console.log(`      * Search bookList: ${rule.ruleSearch?.bookList}`);
            console.log(`      * Search name: ${rule.ruleSearch?.name}`);
            console.log(`      * Search bookUrl: ${rule.ruleSearch?.bookUrl}`);
            console.log(`      * TOC chapterList: ${rule.ruleToc?.chapterList}`);
            console.log(`      * TOC chapterName: ${rule.ruleToc?.chapterName}`);
            console.log(`      * TOC chapterUrl: ${rule.ruleToc?.chapterUrl}`);
            console.log(`      * Content: ${rule.ruleContent?.content}`);
        }
    }
}

run().catch(console.error);
