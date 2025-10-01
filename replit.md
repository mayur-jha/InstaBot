# Instagram DM AutoResponder - Chrome Extension

## Project Overview
This is a **Chrome browser extension** that automates Instagram DM responses using ChatGPT AI. It runs entirely client-side in the user's browser and does not require any server, workflow, or deployment.

## Architecture
- **Type**: Chrome Extension (Manifest V3)
- **Runtime**: Browser-only (no server needed)
- **Installation**: Manual load via chrome://extensions/
- **API**: OpenAI ChatGPT (user provides their own API key)

## Project Structure
```
.
├── manifest.json          # Chrome extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Modern, animated styling
├── popup.js              # Popup logic and controls
├── content.js            # Instagram DOM manipulation
├── background.js         # Service worker for API calls
├── icon16.png           # Extension icons
├── icon48.png
├── icon128.png
└── SETUP_INSTRUCTIONS.txt # User installation guide
```

## How It Works
1. User loads extension into Chrome manually
2. User provides OpenAI API key (stored locally)
3. Extension injects content script into Instagram pages
4. When activated, it:
   - Iterates through all DM conversations
   - Checks if last message is from the other user
   - Extracts last 20 messages for context
   - Sends to ChatGPT via background worker
   - Posts AI-generated response back to Instagram
   - Moves to next conversation

## Recent Changes
- October 1, 2025: Initial project creation
- Created all extension files with Manifest V3
- Implemented beautiful gradient UI with animations
- Added Instagram DOM manipulation logic
- Integrated OpenAI ChatGPT API
- Created icon files using Python Pillow

## User Preferences
- Modern, intriguing UI with smooth animations
- No database or authentication required
- ChatGPT integration only (no other integrations)

## Important Notes
**This is NOT a web application** - it's a browser extension that:
- Does NOT run on a server
- Does NOT need a workflow configured
- Does NOT need deployment
- Runs entirely in the user's Chrome browser
- Is installed manually via chrome://extensions/

The user downloads these files and loads them into Chrome as an unpacked extension.
