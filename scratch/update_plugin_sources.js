const fs = require('fs');

const pluginJsonPath = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC/plugin.json';
const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

const updates = {
    'say-hentai.zip': 'https://sayhentai.cx',
    'ac-qq.zip': 'https://ac.qq.com',
    'roads-team.zip': 'https://roadsteami.net',
    'qmbook.zip': 'https://m.bqg107.xyz',
    'nguoi-lao-dong.zip': 'https://tuoitre.vn/tto-nld.htm',
    'cmanga.zip': 'https://cmangax18.com',
    'anime-hay.zip': 'https://motchillix.fm',
    'ptwxz.zip': 'https://www.h0g2e.top/enter/index.html',
    '80qishu.zip': 'https://www.80qishu.cc',
    '07br.zip': 'https://www.bqg691.cc',
    'wikicv.net.zip': 'https://wikicv.org',
    'truyen-full.zip': 'https://truyenfull.live'
};

let count = 0;
plugin.data.forEach(ext => {
    const zipName = ext.path.substring(ext.path.lastIndexOf('/') + 1);
    if (updates[zipName]) {
        console.log(`🔄 Cập nhật source cho ${ext.name}: "${ext.source}" -> "${updates[zipName]}"`);
        ext.source = updates[zipName];
        if (zipName === 'wikicv.net.zip') {
            console.log(`🔄 Cập nhật name cho ${ext.name} -> "Wiki Dịch"`);
            ext.name = 'Wiki Dịch';
        }
        if (zipName === 'truyen-full.zip') {
            console.log(`🔄 Cập nhật name cho ${ext.name} -> "truyenfull.live"`);
            ext.name = 'truyenfull.live';
        }
        count++;
    }
});

if (count > 0) {
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log(`\n✅ Đã cập nhật xong ${count} nguồn trong plugin.json!`);
} else {
    console.log('⚠ Không tìm thấy nguồn nào cần cập nhật.');
}
