#!/usr/bin/env node

/**
 * Build script for Smart Autofill Assistant
 * Creates a distribution package ready for Chrome Web Store
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = 'dist';
const EXCLUDE_PATTERNS = [
    /node_modules/,
    /\.git/,
    /prototype/,
    /doc/,
    /\.md$/,
    /package.*\.json$/,
    /build\.js$/,
    /\.gitignore$/,
    /\.env/,
    /test/,
    /coverage/
];

function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(filePath);
        }
        return filePath.includes(pattern);
    });
}

function copyFileSync(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (shouldExclude(srcPath)) {
            console.log(`Excluding: ${srcPath}`);
            continue;
        }
        
        const stat = fs.statSync(srcPath);
        
        if (stat.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
            console.log(`Copied: ${srcPath} -> ${destPath}`);
        }
    }
}

function validateManifest() {
    const manifestPath = 'manifest.json';
    
    if (!fs.existsSync(manifestPath)) {
        throw new Error('manifest.json not found');
    }
    
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Basic validation
        if (!manifest.manifest_version || manifest.manifest_version !== 3) {
            throw new Error('Invalid manifest version');
        }
        
        if (!manifest.name || !manifest.version || !manifest.description) {
            throw new Error('Missing required manifest fields');
        }
        
        console.log(`✓ Manifest validation passed for ${manifest.name} v${manifest.version}`);
        return manifest;
    } catch (error) {
        throw new Error(`Manifest validation failed: ${error.message}`);
    }
}

function build() {
    console.log('🚀 Building Smart Autofill Assistant...\n');
    
    try {
        // Validate manifest
        const manifest = validateManifest();
        
        // Clean build directory
        if (fs.existsSync(BUILD_DIR)) {
            fs.rmSync(BUILD_DIR, { recursive: true });
            console.log(`✓ Cleaned ${BUILD_DIR} directory`);
        }
        
        // Create build directory
        fs.mkdirSync(BUILD_DIR, { recursive: true });
        console.log(`✓ Created ${BUILD_DIR} directory`);
        
        // Copy manifest
        copyFileSync('manifest.json', path.join(BUILD_DIR, 'manifest.json'));
        
        // Copy source files
        copyDirectory('src', path.join(BUILD_DIR, 'src'));
        
        // Copy any additional files that should be included
        const additionalFiles = ['README.md'];
        for (const file of additionalFiles) {
            if (fs.existsSync(file)) {
                copyFileSync(file, path.join(BUILD_DIR, file));
            }
        }
        
        console.log(`\n✅ Build completed successfully!`);
        console.log(`📦 Extension package created in ${BUILD_DIR}/`);
        console.log(`\nTo install:`);
        console.log(`1. Open Chrome and go to chrome://extensions/`);
        console.log(`2. Enable "Developer mode"`);
        console.log(`3. Click "Load unpacked" and select the ${BUILD_DIR} folder`);
        
    } catch (error) {
        console.error(`❌ Build failed: ${error.message}`);
        process.exit(1);
    }
}

// Run build if this script is executed directly
if (require.main === module) {
    build();
}

module.exports = { build, validateManifest };