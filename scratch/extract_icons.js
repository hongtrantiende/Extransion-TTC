const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');
const zipsDir = path.join(repoDir, 'zips');
const iconsDir = path.join(repoDir, 'icons');

async function run() {
    console.log('📖 Đang đọc root plugin.json...');
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const zipFiles = fs.readdirSync(zipsDir).filter(f => f.endsWith('.zip'));
    console.log(`📦 Tìm thấy ${zipFiles.length} tệp zip trong thư mục zips/`);

    let extractedCount = 0;

    for (let i = 0; i < zipFiles.length; i++) {
        const zipName = zipFiles[i];
        const zipPath = path.join(zipsDir, zipName);
        const extId = path.basename(zipName, '.zip');

        // Tìm entry tương ứng trong catalog
        const catalogEntry = plugin.data.find(e => {
            const pathZip = e.path.substring(e.path.lastIndexOf('/') + 1);
            return pathZip === zipName;
        });

        if (!catalogEntry) {
            continue;
        }

        try {
            const data = fs.readFileSync(zipPath);
            const zip = await JSZip.loadAsync(data);
            const iconFile = zip.file('icon.png');

            if (iconFile) {
                const iconBuffer = await iconFile.async('nodebuffer');
                const outputIconPath = path.join(iconsDir, `${extId}.png`);
                fs.writeFileSync(outputIconPath, iconBuffer);

                // Cập nhật đường dẫn icon trong catalog
                catalogEntry.icon = `https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/icons/${extId}.png`;
                extractedCount++;
            } else {
                // Nếu không có icon.png trong zip, reset về rỗng
                if (!catalogEntry.icon) {
                    catalogEntry.icon = '';
                }
            }
        } catch (err) {
            console.error(`❌ Lỗi khi xử lý icon cho ${zipName}:`, err.message);
        }
    }

    // Ghi đè root plugin.json
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log(`\n✅ Hoàn thành! Đã trích xuất và cập nhật link icon cho ${extractedCount} extensions!`);
}

run().catch(console.error);
