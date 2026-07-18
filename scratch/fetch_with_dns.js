const dns = require('dns');
const https = require('https');

// Thiết lập DNS Server của Cloudflare
dns.setServers(['1.1.1.1']);

const customLookup = (hostname, options, callback) => {
    let cb = callback;
    if (typeof options === 'function') {
        cb = options;
    }
    dns.resolve4(hostname, (err, addresses) => {
        if (err) {
            cb(err);
        } else {
            cb(null, addresses[0], 4);
        }
    });
};

const options = {
    hostname: 'sextop1.gd',
    path: '/',
    method: 'GET',
    lookup: customLookup,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('\nBODY SUBSTRING:');
        console.log(body.substring(0, 1000));
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
