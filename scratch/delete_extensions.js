const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');

const namesToDelete = [
    'wevino.store',
    'iq.com',
    'youku.tv',
    'motchillzc.cc',
    'envasion.net'
];

const zipsToDelete = [
    'motchill.zip',
    'anime-hay.zip',
    'motchill-1.zip',
    'youku.zip',
    'iqiyi.zip'
];

const iconsToDelete = [
    'motchill.png',
    'anime-hay.png',
    'motchill-1.png',
    'youku.png',
    'iqiyi.png'
];

const foldersToDelete = [
    'extensions/anime-hay'
];

function run() {
    console.log('📖 Đang đọc root plugin.json...');
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

    const originalLength = plugin.data.length;
    // Lọc bỏ các entries cần xóa
    plugin.data = plugin.data.filter(ext => !namesToDelete.includes(ext.name));
    const newLength = plugin.data.length;

    console.log(`❌ Đã xóa ${originalLength - newLength} entries khỏi plugin.json`);

    // Ghi đè root plugin.json
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log('✔ Đã cập nhật root plugin.json');

    // Xóa các tệp zip
    zipsToDelete.forEach(z => {
        const fp = path.join(repoDir, 'zips', z);
        if (fs.existsSync(fp)) {
            fs.unlinkSync(fp);
            console.log(`🗑️ Đã xóa tệp zip: zips/${z}`);
        }
    });

    // Xóa các tệp icon
    iconsToDelete.forEach(ic => {
        const fp = path.join(repoDir, 'icons', ic);
        if (fs.existsSync(fp)) {
            fs.unlinkSync(fp);
            console.log(`🗑️ Đã xóa tệp icon: icons/${ic}`);
        }
    });

    // Xóa các thư mục nguồn giải nén
    foldersToDelete.forEach(folder => {
        const fp = path.join(repoDir, folder);
        if (fs.existsSync(fp)) {
            fs.rmSync(fp, { recursive: true, force: true });
            console.log(`🗑️ Đã xóa thư mục nguồn: ${folder}`);
        }
    });

    console.log('\n✅ Hoàn thành xóa các extension theo yêu cầu!');
}

run();
