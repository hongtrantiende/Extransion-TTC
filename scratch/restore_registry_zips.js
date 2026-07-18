const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');

// 1. Restore wikicv.net from registry temp zip
const tempWikicv = path.join(repoDir, 'scratch/temp_new_wikicv.zip');
const targetWikicv = path.join(repoDir, 'zips/wikicv.net.zip');
if (fs.existsSync(tempWikicv)) {
    fs.copyFileSync(tempWikicv, targetWikicv);
    console.log('✅ Restored wikicv.net.zip from registry temp zip');
}

// 2. Restore hentaivietsub-com from registry temp zip
const tempHentai = path.join(repoDir, 'scratch/temp_hentaivietsub.zip');
const targetHentai = path.join(repoDir, 'zips/hentaivietsub-com.zip');
if (fs.existsSync(tempHentai)) {
    fs.copyFileSync(tempHentai, targetHentai);
    console.log('✅ Restored hentaivietsub-com.zip from registry temp zip');
}

// 3. Update root plugin.json catalog entries for both
const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

const wikicvEntry = plugin.data.find(e => e.path.endsWith('wikicv.net.zip'));
if (wikicvEntry) {
    wikicvEntry.name = 'Wiki Dịch';
    wikicvEntry.author = 'vBook';
    wikicvEntry.version = 27; // Original registry version inside temp zip
    wikicvEntry.source = 'https://wikicv.org';
}

const hentaiEntry = plugin.data.find(e => e.path.endsWith('hentaivietsub-com.zip'));
if (hentaiEntry) {
    hentaiEntry.name = 'HentaiVietsub.com';
    hentaiEntry.author = 'Will Sun';
    hentaiEntry.version = 2; // Original registry version inside temp zip
    hentaiEntry.source = 'https://hentaivietsub.com';
}

fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
console.log('✅ Successfully updated root plugin.json for wikicv and hentaivietsub!');
