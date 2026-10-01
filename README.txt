================================================================================
                        RU AI Studio - Quick Start
================================================================================

WHAT IS THIS?
-------------
Local AI assistant with full computer access. Works offline, no VPN needed.

REQUIREMENTS
------------
1. Node.js (https://nodejs.org/)
2. Ollama (https://ollama.com/download)
3. Model: qwen2.5:7b (install via: ollama pull qwen2.5:7b)

HOW TO USE
----------
1. Double-click: start.bat
   - This will start everything and open browser

2. Or manually:
   - Terminal 1: ollama serve
   - Terminal 2: node server.js
   - Open: http://localhost:3001

FEATURES
--------
- Chat with AI (no censorship)
- Voice input (Chrome/Edge)
- Screenshots (AI sees your screen)
- File management (read/write files)
- Execute commands
- Control PC (shutdown/restart)
- Browser automation (with puppeteer)

TROUBLESHOOTING
---------------
Q: "Node.js not found"
A: Install Node.js from https://nodejs.org/

Q: "Ollama not responding"
A: Run: ollama serve

Q: "Model not found"
A: Run: ollama pull qwen2.5:7b

Q: "Server failed to start"
A: Run: node server.js

Q: Voice input not working
A: Use Chrome or Edge browser

Q: Screenshots not working
A: Allow screen capture in browser

FILES
-----
start.bat              - Launch program (double-click this)
build_installer.bat    - Create Windows installer (.exe)
installer.js           - Setup wizard
server.js              - Local server for system commands
dist/                  - Built web interface
INSTALL.md             - Full installation guide
USAGE.md               - Usage guide

PRIVACY
-------
- All data stored locally
- Ollama works offline
- No external APIs
- No telemetry

VERSION
-------
1.0.0

================================================================================
