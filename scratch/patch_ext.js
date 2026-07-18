const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function extractAndReplace(zipName, folderName, cliOldDomain, newDomain) {
    const projectRoot = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
    const zipPath = path.join(projectRoot, 'zips', zipName);
    const destDir = path.join(projectRoot, 'extensions', folderName);
    
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Zip file not found: ${zipPath}`);
    }
    
    console.log(`📂 Đang đọc zip: ${zipName}...`);
    const zipData = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(zipData);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    console.log(`✏️  Đang giải nén tới: extensions/${folderName}`);
    
    // First pass: extract all files
    for (const [relativePath, file] of Object.entries(zip.files)) {
        if (file.dir) {
            fs.mkdirSync(path.join(destDir, relativePath), { recursive: true });
            continue;
        }
        
        const contentBuffer = await file.async('nodebuffer');
        const destFilePath = path.join(destDir, relativePath);
        const fileDestDir = path.dirname(destFilePath);
        if (!fs.existsSync(fileDestDir)) {
            fs.mkdirSync(fileDestDir, { recursive: true });
        }
        fs.writeFileSync(destFilePath, contentBuffer);
    }
    
    // Read the plugin.json metadata source
    const pluginJsonPath = path.join(destDir, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        throw new Error('plugin.json not found in zip!');
    }
    
    const pluginObj = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const internalDomain = (pluginObj.metadata && pluginObj.metadata.source) || '';
    
    console.log(`🔍 Domain trong plugin.json của zip: "${internalDomain}"`);
    console.log(`🔍 Domain cũ từ CLI: "${cliOldDomain}"`);
    console.log(`👉 Domain mới cần cập nhật: "${newDomain}"`);
    
    const domainsToReplace = new Set();
    if (internalDomain) {
        domainsToReplace.add(internalDomain);
        domainsToReplace.add(internalDomain.replace('https://', 'http://'));
        domainsToReplace.add(internalDomain.replace('http://', 'https://'));
    }
    if (cliOldDomain) {
        domainsToReplace.add(cliOldDomain);
        domainsToReplace.add(cliOldDomain.replace('https://', 'http://'));
        domainsToReplace.add(cliOldDomain.replace('http://', 'https://'));
    }
    
    // Find all files and replace
    const replaceInFile = (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        for (const dom of domainsToReplace) {
            if (content.includes(dom)) {
                console.log(`   ⚡ Thay thế "${dom}" -> "${newDomain}" trong ${path.relative(destDir, filePath)}`);
                content = content.split(dom).join(newDomain);
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    };
    
    const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fp = path.join(dir, file);
            if (fs.statSync(fp).isDirectory()) {
                walkDir(fp);
            } else {
                const ext = path.extname(file).toLowerCase();
                if (ext === '.js' || file === 'plugin.json') {
                    replaceInFile(fp);
                }
            }
        }
    };
    
    walkDir(destDir);
    console.log(`✅ Hoàn thành giải nén & thay đổi domain cho ${folderName}!\n`);
}

const args = process.argv.slice(2);
if (args.length < 4) {
    console.log('Usage: node patch_ext.js <zipName> <folderName> <oldDomain> <newDomain>');
    process.exit(1);
}

extractAndReplace(args[0], args[1], args[2], args[3])
    .catch(err => {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    });
