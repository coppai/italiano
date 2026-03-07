/**
 * to run this server, use the command:
 *    node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css'
};

const server = http.createServer((req, res) => {
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
    let filePath = req.url === '/' ? './index.html' : `.${req.url}`;
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

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop.`);
});