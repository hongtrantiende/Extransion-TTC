const fs = require('fs');
const path = require('path');

const zipUrl = 'https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/master/wikidich/plugin.zip';
const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const tempZipPath = path.join(repoDir, 'scratch/temp_new_wikicv.zip');

async function download() {
    console.log(`📥 Đang tải zip từ: ${zipUrl}...`);
    const res = await fetch(zipUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(tempZipPath, buffer);
    console.log(`✅ Đã tải và lưu vào: ${tempZipPath}`);
}

download().catch(console.error);
