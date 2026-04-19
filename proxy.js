const http = require('http');
const https = require('https');

const PORT = 3000;
const TARGET_API = 'http://localhost:20128';

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Proxy request
    const options = {
        hostname: 'localhost',
        port: 20128,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500);
        res.end('Proxy error');
    });

    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`CORS Proxy running on http://localhost:${PORT}`);
    console.log(`Proxying to ${TARGET_API}`);
});
