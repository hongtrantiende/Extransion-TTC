const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';

async function extractZip(zipPath, targetDir) {
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    const data = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(data);

    for (const filename of Object.keys(zip.files)) {
        const fileObj = zip.files[filename];
        const destPath = path.join(targetDir, filename);

        if (fileObj.dir) {
            fs.mkdirSync(destPath, { recursive: true });
        } else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.writeFileSync(destPath, await fileObj.async('nodebuffer'));
        }
    }
    console.log(`✅ Extracted to: ${targetDir}`);
}

async function run() {
    await extractZip(path.join(repoDir, 'scratch/temp_hentaivietsub.zip'), path.join(repoDir, 'extensions/hentaivietsub-com'));
    await extractZip(path.join(repoDir, 'scratch/temp_hentaizbot.zip'), path.join(repoDir, 'extensions/hentaizbot'));
}

run().catch(console.error);
