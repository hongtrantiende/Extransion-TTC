const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const originalZip = path.join(repoDir, 'scratch/temp_new_wikicv.zip');
const targetZip = path.join(repoDir, 'zips/wikicv.net.zip');
const pluginJsonPath = path.join(repoDir, 'plugin.json');

function run() {
    // 1. Copy the original zip untouched
    fs.copyFileSync(originalZip, targetZip);
    console.log('✅ Copied original temp_new_wikicv.zip directly to zips/wikicv.net.zip (preserving encryption)');

    // 2. Update the root plugin.json catalog entry to match original metadata
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const entry = plugin.data.find(e => e.path.endsWith('wikicv.net.zip'));
    if (entry) {
        entry.name = 'Wiki Dịch';
        entry.author = 'vBook';
        entry.version = 27; // Matches the version inside the original zip
        entry.source = 'https://wikicv.org';
        fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
        console.log('✅ Updated root plugin.json entry for wikicv.net.zip to original metadata (author: vBook, version: 27)');
    } else {
        console.error('❌ Could not find wikicv.net.zip entry in root plugin.json');
    }
}

run();
