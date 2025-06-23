const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Route handling
    let filePath;
    
    if (pathname === '/' || pathname === '/califiling') {
        filePath = path.join(__dirname, 'premium_legal_practice_guide.html');
    } else if (pathname === '/enhanced') {
        filePath = path.join(__dirname, 'california_filing_requirements_enhanced.html');
    } else if (pathname === '/complete') {
        filePath = path.join(__dirname, 'complete_knowledge_graph.html');
    } else if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'CaliFiling Pro Server'
        }));
        return;
    } else {
        // Try to serve the file directly
        filePath = path.join(__dirname, pathname);
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CaliFiling Pro - Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        h1 { color: #1e40af; }
                        .link { display: block; margin: 10px 0; color: #3b82f6; text-decoration: none; }
                        .link:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>🚀 CaliFiling Pro Server</h1>
                    <p>The requested page was not found.</p>
                    <h3>Available Links:</h3>
                    <a href="/" class="link">📊 CaliFiling Pro (Premium Tool)</a>
                    <a href="/enhanced" class="link">📋 Enhanced Filing Requirements</a>
                    <a href="/complete" class="link">🔗 Complete Knowledge Graph</a>
                    <a href="/health" class="link">💚 Server Health Check</a>
                </body>
                </html>
            `);
            return;
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Read and serve file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log('🚀 CaliFiling Pro Server Started!');
    console.log('=========================================');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`🔗 CaliFiling Pro: http://localhost:${PORT}/`);
    console.log(`📋 Enhanced Guide: http://localhost:${PORT}/enhanced`);
    console.log(`🌐 Knowledge Graph: http://localhost:${PORT}/complete`);
    console.log('💡 Features:');
    console.log('   • Premium legal practice tool');
    console.log('   • Interactive deadline calculator');
    console.log('   • Risk assessment tools');
    console.log('   • Mobile-optimized interface');
    console.log('🛑 Press Ctrl+C to stop the server');
    
    // Try to open browser automatically (macOS/Linux)
    if (process.platform === 'darwin') {
        require('child_process').exec(`open http://localhost:${PORT}`);
    } else if (process.platform === 'linux') {
        require('child_process').exec(`xdg-open http://localhost:${PORT}`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CaliFiling Pro Server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 