#!/usr/bin/env python3
"""
HTTP Server for StudyBuddy-OS – Port 7000
Creator: JOHN BLAK
GitHub: https://github.com/JOHNBLAK

Starts a basic HTTP server for StudyBuddy on localhost:7000 and opens your browser automatically.
Works on desktop (Windows, Linux, macOS) and Termux (browser opening is skipped on mobile).
"""

import os
import sys
import webbrowser
import http.server
import socketserver
import threading
import time
from pathlib import Path

# Configuration
PORT = 7000
HOST = "localhost"
DIRECTORY = os.getcwd()  # serve current working directory

# Creator info
CREATOR = "JOHN BLAK"
GITHUB = "https://github.com/JOHNBLAK"

def open_browser():
    """Open the browser to http://localhost:7000 after a short delay."""
    time.sleep(1.5)  # give the server a moment to start
    url = f"http://{HOST}:{PORT}"
    print(f"\n🌐 Opening {url} in your default browser...")
    webbrowser.open(url)

def run_server():
    """Start the HTTP server on the specified port."""
    # Change to the specified directory (current directory)
    os.chdir(DIRECTORY)

    handler = http.server.SimpleHTTPRequestHandler

    # Check if the port is already in use
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"✅ Server started successfully!")
        print(f"📁 Serving directory: {DIRECTORY}")
        print(f"🔗 Server URL: http://{HOST}:{PORT}")
        print(f"\n👤 Creator: {CREATOR}")
        print(f"🐙 GitHub: {GITHUB}")
        print("\nPress Ctrl+C to stop the server.\n")

        # Open browser in a separate thread (doesn't work on all platforms, but we try)
        if sys.platform.startswith('linux') or sys.platform == 'darwin' or sys.platform == 'win32':
            threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user.")
            sys.exit(0)

if __name__ == "__main__":
    # Check if port 7000 is available
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', PORT))
    sock.close()
    if result == 0:
        print(f"❌ Port {PORT} is already in use. Please free the port and try again.")
        sys.exit(1)

    run_server()
    
"""
  Credits - JOHN BLAK
"""