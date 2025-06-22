const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './interactive_knowledge_graph.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 Not Found</title></head>
                        <body>
                            <h1>404 - File Not Found</h1>
                            <p>The requested file <code>${req.url}</code> was not found.</p>
                            <p><a href="/">Go to Knowledge Graph</a></p>
                        </body>
                    </html>
                `, 'utf-8');
            } else {
                console.error(`Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8080;
const HOST = 'localhost';

server.listen(PORT, HOST, () => {
    console.log('\n🚀 Unified Knowledge Graph Server Started!');
    console.log('=========================================');
    console.log(`📍 Server running at: http://${HOST}:${PORT}`);
    console.log(`📊 Knowledge Graph: http://${HOST}:${PORT}/interactive_knowledge_graph.html`);
    console.log(`📁 Files available:`);
    console.log(`   • Interactive Graph: /interactive_knowledge_graph.html`);
    console.log(`   • Demo Results: /unified_knowledge_graph_output/`);
    console.log(`   • Filing Guide: /comprehensive_filing_guide.md`);
    console.log('\n💡 Usage:');
    console.log('   1. Open the URL in your browser');
    console.log('   2. Explore the interactive knowledge graph');
    console.log('   3. Try the sample queries or enter your own');
    console.log('   4. Click on nodes to see details');
    console.log('\n⚡ Features:');
    console.log('   • Interactive graph visualization');
    console.log('   • Query-based rule highlighting');
    console.log('   • Cross-system rule connections');
    console.log('   • Real-time filing requirement answers');
    console.log('\n🛑 Press Ctrl+C to stop the server\n');
    
    // Try to open the browser automatically (works on most systems)
    const url = `http://${HOST}:${PORT}`;
    console.log(`🌐 Attempting to open browser at ${url}...`);
    
    const start = (process.platform === 'darwin' ? 'open' :
                   process.platform === 'win32' ? 'start' : 'xdg-open');
    
    exec(`${start} ${url}`, (error) => {
        if (error) {
            console.log('   ℹ️  Please manually open the URL in your browser');
        } else {
            console.log('   ✅ Browser opened successfully!');
        }
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        console.log('Please try:');
        console.log(`   • Kill the process using port ${PORT}`);
        console.log(`   • Or change the PORT variable in this script`);
    } else {
        console.error(`❌ Server error: ${err}`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed. Goodbye!');
        process.exit(0);
    });
}); 