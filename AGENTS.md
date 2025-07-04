### Project Overview
This is a Chrome extension called "Smart Autofill Assistant" that uses AI to intelligently identify and fill web forms. It supports multiple AI models and stores user data locally to protect privacy.

### Architecture
The extension follows a standard Manifest V3 architecture:
- **Background Service Worker** (`src/background/service-worker.js`): Handles AI API calls, data management, and communication between different parts of the extension.
- **Content Script** (`src/content/content-script.js`): Injected into web pages to analyze forms and perform the actual filling.
- **Sidebar Interface** (`src/sidebar/`): The main user interface for managing profiles, settings, and viewing status.
- **Shared Utilities** (`src/shared/`): Contains constants and utility functions used throughout the extension.

```
+---------------------------------+
|         Sidebar (UI)            |
| (sidebar.html, sidebar.js)      |
+----------------|----------------+
                 | (Messages)
                 v
+----------------+----------------+      +------------------------+
|      Background Service         |----->|   AI Services (API)    |
|      (service-worker.js)        |      | (Gemini, OpenAI, etc.) |
+----------------|----------------+      +------------------------+
                 | (Messages)
                 v
+----------------+----------------+
|        Content Script           |
|      (content-script.js)        |
+---------------------------------+
                 | (DOM Manipulation)
                 v
+---------------------------------+
|           Web Page (Forms)      |
+---------------------------------+
```

### File Structure Convention
```
.
├── src/
│   ├── background/
│   ├── content/
│   ├── sidebar/
│   └── shared/
├── doc/
├── prototype/
├── test/
├── manifest.json
├── package.json
└── README.md
```

### Key Technical Details
- **AI Models**: Supports a local Flash-Lite model, as well as remote models like Google Gemini, OpenAI, and Anthropic Claude.
- **Data Storage**: Uses the `chrome.storage` API for local data persistence.
- **Permissions**: Requests `activeTab`, `storage`, `sidePanel`, `scripting`, and `tabs` permissions, with host permissions for all sites.
- **Manifest**: This is a Manifest V3 extension.

### Development Commands
The scripts defined in `package.json` are mostly placeholders for now.
- `npm run build`: "Builds" the extension (currently just logs a message).
- `npm run validate`: "Validates" the manifest (also a placeholder).
- `npm run dev`: Placeholder for development mode.
- `npm run test`: Placeholder for running tests.
- `npm run lint`: Placeholder for linting.
- `npm run package`: Placeholder for creating a distribution package.

### Build & Testing
- The `README.md` suggests loading the extension in developer mode by selecting the root directory.
- Test pages are available in the `test/` directory.
