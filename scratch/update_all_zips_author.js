const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');
const zipsDir = path.join(repoDir, 'zips');

async function run() {
    console.log('📖 Đang đọc root plugin.json...');
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

    // Map để tra cứu nhanh thông tin từ catalog theo tên file zip
    const catalogMap = {};
    plugin.data.forEach(ext => {
        const zipName = ext.path.substring(ext.path.lastIndexOf('/') + 1);
        catalogMap[zipName] = ext;
    });

    const zipFiles = fs.readdirSync(zipsDir).filter(f => f.endsWith('.zip'));
    console.log(`📦 Tìm thấy ${zipFiles.length} tệp zip trong thư mục zips/`);

    let updatedCount = 0;

    for (let i = 0; i < zipFiles.length; i++) {
        const zipName = zipFiles[i];
        const zipPath = path.join(zipsDir, zipName);
        const catalogEntry = catalogMap[zipName];

        if (!catalogEntry) {
            console.log(`⚠ Bỏ qua ${zipName} (không nằm trong plugin.json)`);
            continue;
        }

        try {
            const data = fs.readFileSync(zipPath);
            const zip = await JSZip.loadAsync(data);
            const pluginFile = zip.file('plugin.json');

            if (!pluginFile) {
                console.log(`❌ Lỗi: Không tìm thấy plugin.json trong ${zipName}`);
                continue;
            }

            const pluginContent = await pluginFile.async('text');
            const extPlugin = JSON.parse(pluginContent);

            if (!extPlugin.metadata) {
                extPlugin.metadata = {};
            }

            // Chỉ cập nhật nếu tác giả chưa phải là "Novela" hoặc cần đồng bộ version
            const oldAuthor = extPlugin.metadata.author;
            const oldVersion = extPlugin.metadata.version || 1;
            const newVersion = oldVersion + 1; // Tăng version để app nhận diện cập nhật

            extPlugin.metadata.author = 'Novela';
            extPlugin.metadata.version = newVersion;

            // Ghi đè plugin.json vào zip
            zip.file('plugin.json', JSON.stringify(extPlugin, null, 2));

            // Lưu zip file
            const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
            fs.writeFileSync(zipPath, newZipData);

            // Cập nhật lại trong root plugin.json catalog
            catalogEntry.author = 'Novela';
            catalogEntry.version = newVersion;

            updatedCount++;
            if (updatedCount % 20 === 0 || i === zipFiles.length - 1) {
                console.log(`🔹 Đang tiến hành... Đã xử lý xong ${updatedCount}/${zipFiles.length} zips.`);
            }
        } catch (err) {
            console.error(`❌ Lỗi khi xử lý ${zipName}:`, err.message);
        }
    }

    // Ghi đè root plugin.json
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log(`\n✅ Hoàn thành! Đã cập nhật tác giả thành "Novela" và tăng version cho ${updatedCount} extensions!`);
}

run().catch(console.error);
