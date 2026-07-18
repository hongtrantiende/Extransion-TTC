const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const scratchDir = path.join(repoDir, 'scratch');

async function downloadRule(id, filename) {
    const url = `https://www.yckceo.com/yuedu/shuyuan/json/id/${id}.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        fs.writeFileSync(path.join(scratchDir, filename), JSON.stringify(data[0], null, 2), 'utf8');
        console.log(`✅ Saved ${filename}`);
    } catch (e) {
        console.error(`❌ Failed to download ${id}: ${e.message}`);
    }
}

async function run() {
    await downloadRule('5614', 'legado_qiyuedu8.json');
    await downloadRule('5638', 'legado_qidian.json');
    await downloadRule('5629', 'legado_ahdzxtd.json');
    await downloadRule('5627', 'legado_xshbook.json');
    await downloadRule('5644', 'legado_douyinxs.json');
}

run();
