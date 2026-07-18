const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const archiver = require('archiver');
const { sendRequest, resolveVBookEndpoint } = require('../utils');
const { getPluginInfo } = require('../lib/plugin-info');
const { buildRequestHeaders } = require('../lib/server');
const c = require('../lib/colors');

async function createZip(info, zipPath) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    return new Promise((resolve, reject) => {
        output.on('close', () => resolve());
        archive.on('error', reject);
        archive.pipe(output);
        
        const metadata = { ...info.json };
        if (metadata.metadata && metadata.metadata.encrypt) {
            delete metadata.metadata.encrypt;
        }

        const srcDir = path.join(info.root, 'src');
        if (fs.existsSync(srcDir)) {
            archive.directory(srcDir, 'src');
        }
        const iconPath = path.join(info.root, 'icon.png');
        if (fs.existsSync(iconPath)) {
            archive.file(iconPath, { name: 'icon.png' });
        }
        archive.append(JSON.stringify(metadata, null, 2), { name: 'plugin.json' });
        archive.finalize();
    });
}

async function uploadZipToLegado(ip, port, zipPath, verbose = false) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const fileBuffer = fs.readFileSync(zipPath);
        const header = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="plugin.zip"\r\n` +
            `Content-Type: application/zip\r\n\r\n`
        );
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        const body = Buffer.concat([header, fileBuffer, footer]);

        const options = {
            hostname: ip,
            port: port,
            path: '/uploadExtension',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            },
            timeout: 15000
        };

        if (verbose) {
            console.log(`[Legado HTTP POST] http://${ip}:${port}/uploadExtension`);
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                resolve({ raw: responseData, code: res.statusCode });
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error("Connection timeout"));
        });

        req.write(body);
        req.end();
    });
}

function register(program) {
    program.command('install')
        .description('Install the extension on the device')
        .option('-i, --ip <ip>', 'Device IP address')
        .option('-p, --port <port>', 'Device Port', process.env.VBOOK_PORT || '8080')
        .option('-v, --verbose', 'Verbose output')
        .action(async (options) => {
            try {
                const info = getPluginInfo();
                const endpoint = await resolveVBookEndpoint({ ip: options.ip, port: options.port });
                const ip = endpoint.ip;
                const port = endpoint.port;
                const verbose = options.verbose || process.env.VERBOSE === 'true';

                const iconPath = path.join(info.root, 'icon.png');
                if (!fs.existsSync(iconPath)) throw new Error("icon.png not found");

                console.log(c.step('INSTALL', `${c.bold(info.name)} → ${ip}:${port}`));

                if (port === 1122 || endpoint.isLegado) {
                    console.log(c.step('INSTALL', `Target is Legado/Novela APK. Creating zip and uploading...`));
                    const tempZipPath = path.join(os.tmpdir(), `ext_debug_${Date.now()}.zip`);
                    try {
                        await createZip(info, tempZipPath);
                        const result = await uploadZipToLegado(ip, port, tempZipPath, verbose);
                        if (result.code === 200 || result.raw.includes('true') || result.raw.includes('data')) {
                            console.log(c.success('Extension installed/updated successfully on Legado/Novela!'));
                        } else {
                            console.log(c.error(`Installation failed. Server returned code ${result.code}: ${result.raw}`));
                        }
                    } finally {
                        if (fs.existsSync(tempZipPath)) {
                            fs.unlinkSync(tempZipPath);
                        }
                    }
                    return;
                }

                const metadata = { ...info.json.metadata };
                if (metadata.encrypt) delete metadata.encrypt;

                const data = {
                    ...metadata,
                    ...info.json.script,
                    id: "debug-" + metadata.source,
                    icon: `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`,
                    enabled: true,
                    debug: true,
                    data: {}
                };

                const { sendModernRequest } = require('../utils');
                
                const srcDir = path.join(info.root, 'src');
                const readSourceMapSync = (dir, prefix = '') => {
                    const output = {};
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fp = path.join(dir, entry.name);
                        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                        if (entry.isDirectory()) {
                            Object.assign(output, readSourceMapSync(fp, relPath));
                        } else {
                            output[relPath] = fs.readFileSync(fp, 'utf8');
                        }
                    }
                    return output;
                };

                const srcObject = readSourceMapSync(srcDir);
                const payload = {
                    plugin: JSON.stringify(info.json),
                    icon: `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`,
                    src: JSON.stringify(srcObject)
                };

                const result = await sendModernRequest(ip, port, 'extension/install', payload, verbose);
                
                if (result.code === 200 || result.success || result.status === 200) {
                    console.log(c.success('Extension installed successfully!'));
                } else {
                    console.log(c.error(result.message || result.exception || 'Installation failed'));
                }
            } catch (error) {
                console.error(c.error(error.message));
            }
        });
}

module.exports = { register };
