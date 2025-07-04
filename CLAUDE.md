# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Smart Autofill Assistant) that intelligently fills web forms using AI models. It's a Manifest V3 extension that uses a sidebar interface rather than a popup, with AI-powered form analysis and autofill capabilities.

## Architecture

The extension follows a modular architecture:

- **Background Service Worker** (`src/background/service-worker.js`): Handles AI API calls, data management, and coordinates between content script and sidebar
- **Content Script** (`src/content/content-script.js`): Analyzes webpage forms and performs actual form filling
- **Sidebar Interface** (`src/sidebar/`): User interface for profile management, settings, and status monitoring  
- **Shared Utilities** (`src/shared/`): Common constants and utilities used across components

## Key Technical Details

### AI Integration
- Primary model: Google Gemini Flash-Lite 2.5
- Supports multiple AI providers: Local, Gemini, OpenAI, Claude
- API endpoints and model configurations are defined in `src/shared/constants.js`

### Form Analysis
- Uses semantic field detection based on field names, types, and patterns
- Confidence thresholds determine field matching quality
- Supports common form types: login, registration, contact, checkout, profile

### Data Storage
- Uses Chrome Storage API for local data persistence
- Stores user profiles, settings, and analysis cache
- Privacy-focused: all data remains local, no server uploads

### Message Passing
- Extensive message passing system between background, content, and sidebar
- Message types defined in `MESSAGE_TYPES` constant
- Async message handling with proper error management

## Development Commands

```bash
# Build the extension for distribution
npm run build

# Validate manifest and project structure  
npm run validate

# Development mode (manual reload required)
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Create distribution package
npm run package
```

## Building and Testing

- Use `node build.js` to create distribution build in `dist/` directory
- Load unpacked extension from `dist/` in Chrome developer mode
- Test pages available in `test/` directory
- Extension uses side panel API (requires Chrome 88+)

## File Structure Conventions

- All source files are in `src/` directory
- Icons in `src/assets/icons/` with standard sizes (16, 32, 48, 128)
- Shared utilities in `src/shared/` with clear separation of concerns
- Build excludes `prototype/`, `doc/`, and development files

## Extension Permissions

- `activeTab`: Access to currently active tab
- `storage`: Local data storage
- `sidePanel`: Side panel interface
- `scripting`: Content script injection
- `tabs`: Tab management
- Host permissions for all HTTP/HTTPS sites

## AI Model Configuration

- Local Flash-Lite: No API key required (simulated)
- Google Gemini: Requires API key, uses generativelanguage.googleapis.com
- OpenAI: Requires API key, uses api.openai.com
- Claude: Requires API key, uses api.anthropic.com

## Common Development Patterns

- Use `MESSAGE_TYPES` constants for all inter-component communication
- Follow semantic field labeling system defined in `SEMANTIC_LABELS`
- Implement proper error handling with defined error messages
- Use confidence thresholds for field matching decisions
- Maintain separation between UI logic (sidebar) and business logic (background)