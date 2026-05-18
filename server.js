/**
 * to run this server, use the command:
 *    node server.js
 *
 * In development the server hosts files out of ./public so legacy pages and
 * JSON data stay in sync with the Vite dev server (which serves the React app
 * on :5173 and proxies /api/* here). In production it serves the Vite build
 * output from ./dist with an SPA fallback for client-side routes.
 *
 * Admin write endpoints are gated by HTTP Basic Auth AND only accept requests
 * when NODE_ENV !== 'production' so the deployed Render instance can never
 * accept writes even if someone discovers the routes.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ROOT_DIR = path.join(__dirname, IS_PROD ? 'dist' : 'public');
const DATA_DIR = ROOT_DIR;
const FLASHCARDS_FILE = path.join(DATA_DIR, 'flashcards.json');
const SPA_INDEX = path.join(ROOT_DIR, 'index.html');

const MIME_TYPES = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json',
    '.txt': 'text/plain',
};

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || bcrypt.hashSync('password123', 10);

function requireAdminAuth(req, res) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
        res.end('Authentication required');
        return false;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    if (username !== ADMIN_USER || !bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
        res.end('Access denied');
        return false;
    }

    return true;
}

function refuseInProd(req, res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function sendJson(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

// Stats writes now live in localStorage on the client; only admin CRUD remains.
const ADMIN_WRITE_ROUTES = new Set([
    'POST /api/add-flashcard',
    'POST /api/flashcards',
    'PUT /api/edit-flashcard',
    'DELETE /api/delete-flashcard',
]);

const server = http.createServer(async (req, res) => {
    const urlWithoutQuery = req.url.split('?')[0];
    const routeKey = `${req.method} ${urlWithoutQuery}`;

    const isAdminPage = urlWithoutQuery === '/admin' || urlWithoutQuery === '/admin.html';
    const isAdminApi = ADMIN_WRITE_ROUTES.has(routeKey);

    if (isAdminApi && IS_PROD) {
        return refuseInProd(req, res);
    }

    if ((isAdminPage || isAdminApi) && !requireAdminAuth(req, res)) {
        return;
    }

    if (routeKey === 'POST /api/add-flashcard') {
        try {
            const newFlashcard = JSON.parse(await readBody(req));
            const flashcards = JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf8'));
            flashcards.push(newFlashcard);
            fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(flashcards, null, 2), 'utf8');
            return sendJson(res, 200, { success: true, message: 'Flashcard added successfully' });
        } catch (err) {
            return sendJson(res, 400, { error: 'Invalid JSON data' });
        }
    }

    if (routeKey === 'PUT /api/edit-flashcard') {
        try {
            const { id, flashcard } = JSON.parse(await readBody(req));
            const flashcards = JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf8'));
            const cardIndex = flashcards.findIndex(card => card.id === id);
            if (cardIndex === -1) return sendJson(res, 400, { error: 'Card not found' });
            flashcards[cardIndex] = flashcard;
            fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(flashcards, null, 2), 'utf8');
            return sendJson(res, 200, { success: true, message: 'Flashcard updated successfully' });
        } catch (err) {
            return sendJson(res, 400, { error: 'Invalid JSON data' });
        }
    }

    if (routeKey === 'DELETE /api/delete-flashcard') {
        try {
            const { id } = JSON.parse(await readBody(req));
            const flashcards = JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf8'));
            const cardIndex = flashcards.findIndex(card => card.id === id);
            if (cardIndex === -1) return sendJson(res, 400, { error: 'Card not found' });
            flashcards.splice(cardIndex, 1);
            fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(flashcards, null, 2), 'utf8');
            return sendJson(res, 200, { success: true, message: 'Flashcard deleted successfully' });
        } catch (err) {
            return sendJson(res, 400, { error: 'Invalid JSON data' });
        }
    }

    if (routeKey === 'POST /api/flashcards') {
        try {
            const flashcards = JSON.parse(await readBody(req));
            if (!Array.isArray(flashcards)) return sendJson(res, 400, { error: 'Data must be an array of flashcards' });
            fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(flashcards, null, 2), 'utf8');
            return sendJson(res, 200, { success: true, message: 'All flashcards updated successfully' });
        } catch (err) {
            return sendJson(res, 400, { error: 'Invalid JSON data' });
        }
    }

    // Static file serving with SPA fallback
    const requestedPath = urlWithoutQuery === '/' ? '/index.html' : urlWithoutQuery;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT_DIR, safePath);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(filePath, (error, content) => {
        if (!error) {
            const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            return res.end(content);
        }

        // SPA fallback: extensionless paths that accept HTML get index.html
        const hasExtension = path.extname(safePath) !== '';
        const acceptsHtml = (req.headers.accept || '').includes('text/html');
        if (!hasExtension && acceptsHtml) {
            fs.readFile(SPA_INDEX, (fallbackErr, fallbackContent) => {
                if (fallbackErr) {
                    res.writeHead(404);
                    return res.end('File not found');
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(fallbackContent);
            });
            return;
        }

        res.writeHead(404);
        res.end('File not found');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/ (${IS_PROD ? 'production' : 'development'})`);
    console.log(`Serving from ${ROOT_DIR}`);
    console.log('Press Ctrl+C to stop.');
});
