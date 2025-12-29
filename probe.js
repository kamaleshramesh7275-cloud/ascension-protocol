import https from 'https';

const urls = [
    'https://ascension-protocol-1g46.vercel.app/api/ping-direct',
    'https://ascension-protocol-1g46.vercel.app/api/auth/login-local'
];

async function fetchAll() {
    for (const url of urls) {
        await new Promise((resolve) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`\n========== ${url} ==========`);
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Content-Type: ${res.headers['content-type']}`);
                    console.log(`Body:\n${data.substring(0, 500)}`);
                    resolve();
                });
            }).on('error', err => {
                console.error(`Error: ${err.message}`);
                resolve();
            });
        });
    }
}

fetchAll();
