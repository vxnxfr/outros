/**
 * Servidor estático local ultra-leve para o Instituto Meridiano.
 * Execute: node serve.js
 * Acesse: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let port = parseInt(process.env.PORT, 10) || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.srt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  const filePath = path.join(__dirname, cleanUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 // Arquivo não encontrado no Instituto Meridiano');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

function startListening(p) {
  server.listen(p, () => {
    console.log(`\n======================================================`);
    console.log(` INSTITUTO MERIDIANO // SERVIDOR LOCAL ATIVO`);
    console.log(` URL: http://localhost:${p}`);
    console.log(` Pressione Ctrl+C para encerrar.`);
    console.log(`======================================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Aviso: Porta ${port} ocupada. Tentando porta ${port + 1}...`);
    port++;
    startListening(port);
  } else {
    console.error('Erro no servidor:', err);
  }
});

startListening(port);
