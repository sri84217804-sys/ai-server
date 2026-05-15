const http = require('http');
const https = require('https');
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { message } = JSON.parse(body);
                const payload = JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: message }] });
                const options = { hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST', headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
                const groqReq = https.request(options, (groqRes) => {
                    let data = '';
                    groqRes.on('data', chunk => data += chunk);
                    groqRes.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            const text = json.choices[0].message.content;
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ response: text }));
                        } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
                    });
                });
                groqReq.on('error', (e) => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
                groqReq.write(payload);
                groqReq.end();
            } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Bad request' })); }
        });
    } else { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('AI Server Running!'); }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
