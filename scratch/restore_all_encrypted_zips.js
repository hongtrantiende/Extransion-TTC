const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { execSync } = require('child_process');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const zipsDir = path.join(repoDir, 'zips');
const pluginJsonPath = path.join(repoDir, 'plugin.json');

async function run() {
    console.log('📖 Đang quét các tệp zip để tìm extension mã hóa...');
    const zipFiles = fs.readdirSync(zipsDir).filter(f => f.endsWith('.zip'));
    const rootPlugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

    let restoredCount = 0;

    for (const zipName of zipFiles) {
        const zipPath = path.join(zipsDir, zipName);
        try {
            const data = fs.readFileSync(zipPath);
            const zip = await JSZip.loadAsync(data);
            const pluginFile = zip.file('plugin.json');
            if (!pluginFile) continue;

            const pluginText = await pluginFile.async('text');
            const extPlugin = JSON.parse(pluginText.replace(/\u001a/g, ' '));

            if (extPlugin.metadata && extPlugin.metadata.encrypt === true) {
                console.log(`🔒 Phát hiện extension mã hóa: ${zipName}`);

                // Khôi phục tệp zip về trạng thái ban đầu của git (trước khi chạy script đổi author)
                try {
                    execSync(`git checkout da01d9d -- "${zipPath}"`, { cwd: repoDir, stdio: 'pipe' });
                    console.log(`   ➡️ Đã khôi phục zip bằng Git checkout: ${zipName}`);

                    // Đọc lại tệp zip đã khôi phục để lấy metadata gốc (author, version)
                    const restoredData = fs.readFileSync(zipPath);
                    const restoredZip = await JSZip.loadAsync(restoredData);
                    const restoredPluginText = await restoredZip.file('plugin.json').async('text');
                    const restoredExt = JSON.parse(restoredPluginText.replace(/\u001a/g, ' '));

                    const origAuthor = restoredExt.metadata.author || 'vBook';
                    const origVersion = restoredExt.metadata.version || 1;

                    // Đồng bộ lại vào root plugin.json catalog
                    const catalogEntry = rootPlugin.data.find(e => {
                        const pathZip = e.path.substring(e.path.lastIndexOf('/') + 1);
                        return pathZip === zipName;
                    });

                    if (catalogEntry) {
                        catalogEntry.author = origAuthor;
                        catalogEntry.version = origVersion;
                        console.log(`   ➡️ Đồng bộ catalog: author="${origAuthor}", version=${origVersion}`);
                    }
                    restoredCount++;
                } catch (gitErr) {
                    console.error(`   ❌ Lỗi khi chạy git checkout cho ${zipName}:`, gitErr.message);
                }
            }
        } catch (err) {
            console.error(`❌ Lỗi khi xử lý ${zipName}:`, err.message);
        }
    }

    // Ghi đè root plugin.json
    fs.writeFileSync(pluginJsonPath, JSON.stringify(rootPlugin, null, 2), 'utf8');
    console.log(`\n✅ Hoàn thành! Đã khôi phục và đồng bộ ${restoredCount} extensions mã hóa về trạng thái nguyên bản!`);
}

run().catch(console.error);
