const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const tempHentaiVietsub = path.join(repoDir, 'scratch/temp_hentaivietsub.zip');
const tempHentaiZBot = path.join(repoDir, 'scratch/temp_hentaizbot.zip');

const urls = {
    hentaivietsub: 'https://raw.githubusercontent.com/WillSun28/vbook-extensions/main/zip/hentaivietsub.com.zip',
    hentaizbot: 'https://raw.githubusercontent.com/dat-bi/ext-vbook/main/extensions/hentaizbot/plugin.zip'
};

async function download(url, dest) {
    console.log(`📥 Đang tải: ${url}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    console.log(`✅ Đã lưu vào: ${dest}`);
}

async function run() {
    await download(urls.hentaivietsub, tempHentaiVietsub);
    await download(urls.hentaizbot, tempHentaiZBot);
    console.log('✅ Hoàn thành tải xuống 2 tệp zip!');
}

run().catch(console.error);
