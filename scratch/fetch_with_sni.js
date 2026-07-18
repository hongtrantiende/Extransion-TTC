const https = require('https');

const options = {
    hostname: '162.252.198.130',
    port: 443,
    path: '/',
    method: 'GET',
    servername: 'sextop1.gd', // Thiết lập SNI
    headers: {
        'Host': 'sextop1.gd',
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
