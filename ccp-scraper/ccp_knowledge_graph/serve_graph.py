#!/usr/bin/env python3
"""
Simple HTTP server for CCP Knowledge Graph visualization
Run this script to serve the knowledge graph locally and avoid CORS issues.
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8000
directory = os.path.dirname(os.path.abspath(__file__))

os.chdir(directory)

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🌐 Serving CCP Knowledge Graph at http://localhost:{PORT}")
    print(f"📁 Directory: {directory}")
    print(f"🔗 Open: http://localhost:{PORT}/ccp_knowledge_graph_server.html")
    print("Press Ctrl+C to stop")
    
    # Automatically open browser
    webbrowser.open(f"http://localhost:{PORT}/ccp_knowledge_graph_server.html")
    
    httpd.serve_forever()
