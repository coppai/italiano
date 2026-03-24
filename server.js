/**
 * to run this server, use the command:
 *    node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css'
};

// Very basic admin authentication (HTTP Basic Auth)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
// Prefer a hashed password from env; fall back to a hash of the default
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

const server = http.createServer((req, res) => {
    // Protect admin page and admin APIs with basic auth
    const isAdminRoute =
        req.url === '/admin.html' ||
        req.url === '/admin' ||
        (req.method === 'POST' && req.url === '/api/add-flashcard') ||
        (req.method === 'PUT' && req.url === '/api/edit-flashcard') ||
        (req.method === 'DELETE' && req.url === '/api/delete-flashcard');

    if (isAdminRoute && !requireAdminAuth(req, res)) {
        return;
    }

    // Handle POST request for adding flashcards
    if (req.method === 'POST' && req.url === '/api/add-flashcard') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const newFlashcard = JSON.parse(body);
                
                // Read existing flashcards
                fs.readFile('./flashcards.json', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read flashcards file' }));
                        return;
                    }
                    
                    let flashcards = JSON.parse(data);
                    flashcards.push(newFlashcard);
                    
                    // Write updated flashcards back to file
                    fs.writeFile('./flashcards.json', JSON.stringify(flashcards, null, 2), 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save flashcard' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Flashcard added successfully' }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        
        return;
    }

    // Handle PUT request for editing flashcards
    if (req.method === 'PUT' && req.url === '/api/edit-flashcard') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { id, flashcard } = JSON.parse(body);
                
                // Read existing flashcards
                fs.readFile('./flashcards.json', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read flashcards file' }));
                        return;
                    }
                    
                    let flashcards = JSON.parse(data);
                    
                    // Find the card by ID
                    const cardIndex = flashcards.findIndex(card => card.id === id);
                    
                    if (cardIndex === -1) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Card not found' }));
                        return;
                    }
                    
                    flashcards[cardIndex] = flashcard;
                    
                    // Write updated flashcards back to file
                    fs.writeFile('./flashcards.json', JSON.stringify(flashcards, null, 2), 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save flashcard' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Flashcard updated successfully' }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        
        return;
    }

    // Handle PUT request for updating flashcard stats
    if (req.method === 'PUT' && req.url === '/api/update-flashcard-stats') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { id, correct, incorrect } = JSON.parse(body);
                console.log('Updating flashcard stats:', { id, correct, incorrect });
                
                // Read existing flashcards
                fs.readFile('./flashcards.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read flashcards file' }));
                        return;
                    }
                    
                    let flashcards = JSON.parse(data);
                    
                    // Find the card by ID
                    const cardIndex = flashcards.findIndex(card => card.id === id);
                    console.log('Found card at index:', cardIndex);
                    
                    if (cardIndex === -1) {
                        console.error('Card not found with ID:', id);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Card not found' }));
                        return;
                    }
                    
                    // Update only the stats
                    flashcards[cardIndex].correct = correct;
                    flashcards[cardIndex].incorrect = incorrect;
                    console.log('Updated card:', flashcards[cardIndex]);
                    
                    // Write updated flashcards back to file
                    fs.writeFile('./flashcards.json', JSON.stringify(flashcards, null, 2), 'utf8', (err) => {
                        if (err) {
                            console.error('Error writing file:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save flashcard stats' }));
                            return;
                        }
                        
                        console.log('Successfully saved stats to file');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Stats updated successfully' }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        
        return;
    }

    // Handle PUT request for updating verb infinitive stats
    if (req.method === 'PUT' && req.url === '/api/update-verb-infinitive-stats') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { id, correct, incorrect } = JSON.parse(body);
                console.log('Updating verb infinitive stats:', { id, correct, incorrect });
                
                // Read existing verbs
                fs.readFile('./verbs.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read verbs file' }));
                        return;
                    }
                    
                    let verbs = JSON.parse(data);
                    
                    // Find the verb by ID
                    const verbIndex = verbs.findIndex(verb => verb.id === id || verb.infinitive === id);
                    console.log('Found verb at index:', verbIndex);
                    
                    if (verbIndex === -1) {
                        console.error('Verb not found with ID:', id);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Verb not found' }));
                        return;
                    }
                    
                    // Update only the infinitive stats
                    verbs[verbIndex].infinitive_correct = correct;
                    verbs[verbIndex].infinitive_incorrect = incorrect;
                    console.log('Updated verb:', verbs[verbIndex]);
                    
                    // Write updated verbs back to file
                    fs.writeFile('./verbs.json', JSON.stringify(verbs, null, 2), 'utf8', (err) => {
                        if (err) {
                            console.error('Error writing file:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save verb stats' }));
                            return;
                        }
                        
                        console.log('Successfully saved verb stats to file');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Stats updated successfully' }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        
        return;
    }

    // Handle DELETE request for deleting flashcards
    if (req.method === 'DELETE' && req.url === '/api/delete-flashcard') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { id } = JSON.parse(body);
                
                // Read existing flashcards
                fs.readFile('./flashcards.json', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read flashcards file' }));
                        return;
                    }
                    
                    let flashcards = JSON.parse(data);
                    
                    // Find the card by ID
                    const cardIndex = flashcards.findIndex(card => card.id === id);
                    
                    if (cardIndex === -1) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Card not found' }));
                        return;
                    }
                    
                    flashcards.splice(cardIndex, 1);
                    
                    // Write updated flashcards back to file
                    fs.writeFile('./flashcards.json', JSON.stringify(flashcards, null, 2), 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save flashcard' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Flashcard deleted successfully' }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        
        return;
    }
    
    // Handle GET requests for static files
    // Strip query parameters from URL before looking for file
    const urlWithoutQuery = req.url.split('?')[0];
    let filePath = urlWithoutQuery === '/' ? './index.html' : `.${urlWithoutQuery}`;
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'text/plain';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log(`Press Ctrl+C to stop.`);
});