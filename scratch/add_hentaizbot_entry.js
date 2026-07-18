const fs = require('fs');
const path = require('path');

const repoDir = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
const pluginJsonPath = path.join(repoDir, 'plugin.json');

function run() {
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

    // Check if hentaizbot already exists
    const exists = plugin.data.find(e => e.name === 'HentaiZBot');
    if (exists) {
        console.log('✅ HentaiZBot entry already exists in plugin.json');
        return;
    }

    const idx = plugin.data.findIndex(e => e.name === 'hentaivietsub.com');
    if (idx === -1) {
        console.error('❌ Could not find hentaivietsub.com in plugin.json');
        return;
    }

    const newEntry = {
        name: 'HentaiZBot',
        author: 'Novela',
        path: 'https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/zips/hentaizbot.zip',
        version: 1,
        source: 'https://hentaiz.bot',
        icon: '',
        description: 'Xem Hentai Vietsub tại HentaiZ.bot',
        type: 'video',
        locale: 'vi_VN'
    };

    // Insert newEntry after hentaivietsub.com
    plugin.data.splice(idx + 1, 0, newEntry);

    // Also update hentaivietsub.com display name to "HentaiVietsub.com" (capitalized H and V)
    plugin.data[idx].name = 'HentaiVietsub.com';

    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log('✅ Successfully added HentaiZBot and updated HentaiVietsub.com name in root plugin.json!');
}

run();
