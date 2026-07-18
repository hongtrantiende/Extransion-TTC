const fs = require('fs');
const path = require('path');

function registerExtension(extId) {
    const projectRoot = 'c:/Users/bac5a/OneDrive/Máy tính/Nam/Extransion-TTC';
    const extDir = path.join(projectRoot, 'extensions', extId);
    const localPluginPath = path.join(extDir, 'plugin.json');
    const rootPluginPath = path.join(projectRoot, 'plugin.json');
    
    if (!fs.existsSync(localPluginPath)) {
        console.error(`❌ Local plugin.json not found: ${localPluginPath}`);
        return;
    }
    
    // Read local metadata
    const localPlugin = JSON.parse(fs.readFileSync(localPluginPath, 'utf8'));
    const meta = localPlugin.metadata;
    if (!meta) {
        console.error(`❌ Metadata section missing in: ${localPluginPath}`);
        return;
    }
    
    // Read root catalog
    if (!fs.existsSync(rootPluginPath)) {
        console.error(`❌ Root plugin.json not found: ${rootPluginPath}`);
        return;
    }
    const rootPlugin = JSON.parse(fs.readFileSync(rootPluginPath, 'utf8'));
    
    // Handle icon copy
    const iconSrc = path.join(extDir, 'icon.png');
    const iconDest = path.join(projectRoot, 'icons', `${extId}.png`);
    let hasIcon = false;
    if (fs.existsSync(iconSrc)) {
        if (!fs.existsSync(path.dirname(iconDest))) {
            fs.mkdirSync(path.dirname(iconDest), { recursive: true });
        }
        fs.copyFileSync(iconSrc, iconDest);
        console.log(`✔ Icon copied to: icons/${extId}.png`);
        hasIcon = true;
    } else {
        console.log(`⚠ No icon.png found in extensions/${extId}/`);
    }
    
    // Build registry entry
    const entry = {
        name: meta.name,
        author: meta.author || "Novela",
        path: `https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/zips/${extId}.zip`,
        version: meta.version || 1,
        source: meta.source || "",
        icon: hasIcon ? `https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/icons/${extId}.png` : "",
        description: meta.description || "",
        type: meta.type || "novel",
        locale: meta.locale || "zh_CN"
    };
    
    // Check if already registered
    const index = rootPlugin.data.findIndex(item => item.path && item.path.includes(`/${extId}.zip`));
    if (index !== -1) {
        // Update existing entry
        rootPlugin.data[index] = {
            ...rootPlugin.data[index],
            ...entry
        };
        console.log(`✔ Updated existing registry entry for: ${meta.name}`);
    } else {
        // Add new entry
        rootPlugin.data.push(entry);
        console.log(`✔ Added new registry entry for: ${meta.name}`);
    }
    
    // Save updated root plugin.json
    fs.writeFileSync(rootPluginPath, JSON.stringify(rootPlugin, null, 2), 'utf8');
    console.log(`✔ Root plugin.json updated successfully.`);
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: node register_extension.js <extId>");
    process.exit(1);
}

registerExtension(args[0]);
