// Smart Autofill Assistant Sidebar JavaScript

// Global state
let currentTab = 'main';
let selectedProfile = null;
let profiles = [];
let settings = {};
let isAutofillRunning = false;

// DOM elements
const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Page info
    pageStatus: document.getElementById('pageStatus'),
    pageInfoTitle: document.getElementById('pageInfoTitle'),
    pageInfoDescription: document.getElementById('pageInfoDescription'),
    
    // Profiles
    profileList: document.getElementById('profileList'),
    addProfileBtn: document.getElementById('addProfileBtn'),
    
    // Main action
    startAutofillBtn: document.getElementById('startAutofillBtn'),
    
    // Progress and results
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    stepsList: document.getElementById('stepsList'),
    resultsSection: document.getElementById('resultsSection'),
    resultsList: document.getElementById('resultsList'),
    
    // Settings
    modelProvider: document.getElementById('modelProvider'),
    apiKeyGroup: document.getElementById('apiKeyGroup'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    autoAnalyzeToggle: document.getElementById('autoAnalyzeToggle'),
    debugModeToggle: document.getElementById('debugModeToggle'),
    apiStatus: document.getElementById('apiStatus'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Modal
    profileModal: document.getElementById('profileModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalClose: document.getElementById('modalClose'),
    profileForm: document.getElementById('profileForm'),
    profileName: document.getElementById('profileName'),
    profileInfo: document.getElementById('profileInfo'),
    nameCount: document.getElementById('nameCount'),
    infoCount: document.getElementById('infoCount'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    cancelProfileBtn: document.getElementById('cancelProfileBtn'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Initialize sidebar
async function init() {
    console.log('Initializing Smart Autofill Assistant sidebar');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadProfiles();
    await loadSettings();
    
    // Update page info
    updateHeaderPageInfo();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
    
    console.log('Sidebar initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Profile management
    elements.addProfileBtn.addEventListener('click', () => openProfileModal());
    
    // Main action
    elements.startAutofillBtn.addEventListener('click', startAutofill);
    
    // Settings
    elements.modelProvider.addEventListener('change', onModelProviderChange);
    elements.apiKeyInput.addEventListener('input', onSettingsChange);
    elements.autoAnalyzeToggle.addEventListener('click', toggleAutoAnalyze);
    elements.debugModeToggle.addEventListener('click', toggleDebugMode);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Modal
    elements.modalClose.addEventListener('click', closeProfileModal);
    elements.cancelProfileBtn.addEventListener('click', closeProfileModal);
    elements.profileForm.addEventListener('submit', saveProfile);
    
    // Form validation
    elements.profileName.addEventListener('input', updateCharacterCount);
    elements.profileInfo.addEventListener('input', updateCharacterCount);
    
    // Click outside modal to close
    elements.profileModal.addEventListener('click', (e) => {
        if (e.target === elements.profileModal) {
            closeProfileModal();
        }
    });
}

// Handle messages from background script
function handleMessage(message, sender, sendResponse) {
    console.log('Sidebar received message:', message);
    
    switch (message.type) {
        case 'ANALYSIS_COMPLETE':
            // This message is sent by background script after AI analysis
            // We can ignore it for now since we handle analysis directly in startAutofill
            console.log('Received analysis complete message:', message.data);
            break;
        case 'AUTOFILL_COMPLETE':
            // This would be for future autofill completion notifications
            console.log('Received autofill complete message:', message.data);
            break;
        case 'AUTOFILL_PROGRESS':
            // This would be for future progress updates
            console.log('Received autofill progress message:', message.data);
            break;
    }
}

// Tab management
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update navigation
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update content
    elements.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
    
    // Tab-specific actions
    if (tabName === 'main') {
        updateHeaderPageInfo();
    }
}

// Profile management
async function loadProfiles() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_PROFILES'
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        profiles = response.data || [];
        renderProfiles();
    } catch (error) {
        console.error('Failed to load profiles:', error);
        showError('Failed to load profiles');
    }
}

function renderProfiles() {
    const container = elements.profileList;
    
    if (profiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h4>No profiles yet</h4>
                <p>Create your first profile to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = profiles.map((profile, index) => `
        <div class="profile-item" data-profile-index="${index}">
            <div class="profile-name">
                <span class="status-indicator"></span>
                ${escapeHtml(profile.name)}
            </div>
            <div class="profile-info">
                ${escapeHtml(profile.info.substring(0, 100))}${profile.info.length > 100 ? '...' : ''}
            </div>
            <div class="profile-actions">
                <button class="action-btn edit-btn" data-profile-index="${index}">✏️</button>
                <button class="action-btn delete-btn" data-profile-index="${index}">🗑️</button>
            </div>
        </div>
    `).join('');
    
    // Add click listeners for profile selection
    container.querySelectorAll('.profile-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) return;
            const profileIndex = parseInt(item.dataset.profileIndex);
            const profile = profiles[profileIndex];
            if (profile) {
                selectProfile(profile.name);
            }
        });
    });
    
    // Add click listeners for edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const profileIndex = parseInt(btn.dataset.profileIndex);
            const profile = profiles[profileIndex];
            if (profile) {
                openProfileModal(profile.name);
            }
        });
    });
    
    // Add click listeners for delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const profileIndex = parseInt(btn.dataset.profileIndex);
            const profile = profiles[profileIndex];
            if (profile) {
                deleteProfile(profile.name);
            }
        });
    });
}

function selectProfile(profileName) {
    selectedProfile = profileName;
    
    // Update UI
    elements.profileList.querySelectorAll('.profile-item').forEach(item => {
        const profileIndex = parseInt(item.dataset.profileIndex);
        const profile = profiles[profileIndex];
        item.classList.toggle('selected', profile && profile.name === profileName);
    });
    
    // Enable autofill button
    elements.startAutofillBtn.disabled = false;
    
    // Update page info
    updatePageInfo(`Profile "${profileName}" selected`, 'Ready to start autofill');
}

function openProfileModal(profileName = null) {
    const isEdit = profileName !== null;
    const profile = isEdit ? profiles.find(p => p.name === profileName) : null;
    
    elements.modalTitle.textContent = isEdit ? 'Edit Profile' : 'Add Profile';
    elements.profileName.value = profile ? profile.name : '';
    elements.profileInfo.value = profile ? profile.info : '';
    
    updateCharacterCount();
    elements.profileModal.classList.add('show');
    elements.profileName.focus();
}

function closeProfileModal() {
    elements.profileModal.classList.remove('show');
    elements.profileForm.reset();
    updateCharacterCount();
}

async function saveProfile(e) {
    e.preventDefault();
    
    const profileData = {
        name: elements.profileName.value.trim(),
        info: elements.profileInfo.value.trim()
    };
    
    if (!profileData.name || !profileData.info) {
        showError('Please fill in all required fields');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await chrome.runtime.sendMessage({
            type: 'SAVE_PROFILE',
            data: profileData
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        await loadProfiles();
        closeProfileModal();
        showSuccess('Profile saved successfully');
    } catch (error) {
        console.error('Failed to save profile:', error);
        showError('Failed to save profile');
    } finally {
        showLoading(false);
    }
}

async function deleteProfile(profileName) {
    if (!confirm(`Are you sure you want to delete profile "${profileName}"?`)) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await chrome.runtime.sendMessage({
            type: 'DELETE_PROFILE',
            data: { name: profileName }
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Clear selection if deleted profile was selected
        if (selectedProfile === profileName) {
            selectedProfile = null;
            elements.startAutofillBtn.disabled = true;
            updatePageInfo('Ready to start', 'Select a profile to begin');
        }
        
        await loadProfiles();
        showSuccess('Profile deleted successfully');
    } catch (error) {
        console.error('Failed to delete profile:', error);
        showError('Failed to delete profile');
    } finally {
        showLoading(false);
    }
}

// Functions are now handled by event listeners in renderProfiles()
// No need for global functions anymore

function updateCharacterCount() {
    elements.nameCount.textContent = elements.profileName.value.length;
    elements.infoCount.textContent = elements.profileInfo.value.length;
    
    const nameValid = elements.profileName.value.trim().length > 0;
    const infoValid = elements.profileInfo.value.trim().length > 0;
    
    elements.saveProfileBtn.disabled = !(nameValid && infoValid);
}

// Settings management
async function loadSettings() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SETTINGS'
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        settings = response.data || {};
        renderSettings();
    } catch (error) {
        console.error('Failed to load settings:', error);
        showError('Failed to load settings');
    }
}

function renderSettings() {
    elements.modelProvider.value = settings.modelProvider || 'local';
    elements.apiKeyInput.value = settings.apiKey || '';
    
    elements.autoAnalyzeToggle.classList.toggle('active', settings.autoAnalyze !== false);
    elements.debugModeToggle.classList.toggle('active', settings.debugMode === true);
    
    onModelProviderChange();
    updateApiStatus();
}

function onModelProviderChange() {
    const isRemote = elements.modelProvider.value !== 'local';
    elements.apiKeyGroup.style.display = isRemote ? 'block' : 'none';
    
    updateApiKeyPlaceholder();
    updateApiStatus();
    onSettingsChange();
}

function updateApiKeyPlaceholder() {
    const provider = elements.modelProvider.value;
    const placeholders = {
        'gemini': 'Enter your Google Gemini API key...',
        'openai': 'Enter your OpenAI API key...',
        'claude': 'Enter your Anthropic Claude API key...'
    };
    
    elements.apiKeyInput.placeholder = placeholders[provider] || 'Enter your API key...';
}

function updateApiStatus() {
    const provider = elements.modelProvider.value;
    const hasApiKey = elements.apiKeyInput.value.trim().length > 0;
    
    let statusClass = 'status-indicator';
    let statusText = 'Connected';
    
    if (provider === 'local') {
        statusClass = 'status-indicator';
        statusText = 'Local model ready';
    } else if (hasApiKey) {
        statusClass = 'status-indicator';
        statusText = 'API key configured';
    } else {
        statusClass = 'status-indicator warning';
        statusText = 'API key required';
    }
    
    elements.apiStatus.innerHTML = `
        <div class="${statusClass}">
            <div class="status-dot"></div>
            <span class="status-text">${statusText}</span>
        </div>
    `;
}

function toggleAutoAnalyze() {
    elements.autoAnalyzeToggle.classList.toggle('active');
    onSettingsChange();
}

function toggleDebugMode() {
    elements.debugModeToggle.classList.toggle('active');
    onSettingsChange();
}

function onSettingsChange() {
    const provider = elements.modelProvider.value;
    const hasApiKey = elements.apiKeyInput.value.trim().length > 0;
    const isValid = provider === 'local' || hasApiKey;
    
    elements.saveSettingsBtn.disabled = !isValid;
    updateApiStatus();
}

async function saveSettings() {
    const newSettings = {
        modelProvider: elements.modelProvider.value,
        apiKey: elements.apiKeyInput.value.trim(),
        autoAnalyze: elements.autoAnalyzeToggle.classList.contains('active'),
        debugMode: elements.debugModeToggle.classList.contains('active')
    };
    
    try {
        showLoading(true);
        
        const response = await chrome.runtime.sendMessage({
            type: 'SAVE_SETTINGS',
            data: newSettings
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        settings = newSettings;
        elements.saveSettingsBtn.disabled = true;
        showSuccess('Settings saved successfully');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('Failed to save settings');
    } finally {
        showLoading(false);
    }
}

// Main autofill functionality
async function startAutofill() {
    if (!selectedProfile) {
        showError('Please select a profile first');
        return;
    }
    
    if (isAutofillRunning) {
        showError('Autofill is already running');
        return;
    }
    
    console.log('Starting autofill for profile:', selectedProfile);
    
    isAutofillRunning = true;
    elements.startAutofillBtn.disabled = true;
    
    try {
        // Show progress
        showProgress();
        
        // Step 1: Get current tab and ensure content script is loaded
        updatePageInfo('Preparing...', 'Checking page and loading scripts');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await ensureContentScriptLoaded(tab.id);
        
        // Step 2: Analyze page structure
        updatePageInfo('Analyzing page...', 'Detecting form fields');
        const pageData = await getPageData(tab.id);
        
        console.log('Received page data:', pageData);
        
        if (!pageData.forms || pageData.forms.length === 0) {
            throw new Error('No forms found on this page');
        }
        
        // Count total fields
        const totalFields = pageData.forms.reduce((count, form) => count + form.fields.length, 0);
        console.log(`Total fillable fields found: ${totalFields}`);
        
        if (totalFields === 0) {
            // Provide more detailed error information
            const totalFormFields = pageData.forms.reduce((count, form) => {
                const allFields = document.querySelectorAll(`form:nth-child(${form.index + 1}) input, form:nth-child(${form.index + 1}) select, form:nth-child(${form.index + 1}) textarea`);
                return count + allFields.length;
            }, 0);
            
            throw new Error(`No fillable fields found. Found ${pageData.forms.length} forms but all fields are hidden, submit buttons, or other non-fillable types.`);
        }
        
        // Step 3: Generate fill data using AI
        updatePageInfo('Matching data...', `Found ${totalFields} fields, generating fill values`);
        const profile = profiles.find(p => p.name === selectedProfile);
        const fillData = await generateFillData(profile, pageData);
        
        if (!fillData || Object.keys(fillData).length === 0) {
            throw new Error('No matching data could be generated for the form fields');
        }
        
        // Step 4: Fill the form
        updatePageInfo('Filling form...', 'Injecting data into form fields');
        const fillResult = await fillForm(tab.id, fillData);
        
        // Step 5: Show results
        showResults(fillResult);
        updatePageInfo('Autofill complete!', `${fillResult.successCount}/${fillResult.totalFields} fields filled successfully`);
        
    } catch (error) {
        console.error('Autofill failed:', error);
        showError(`Autofill failed: ${error.message}`);
        updatePageInfo('Autofill failed', error.message);
        hideProgress();
    } finally {
        isAutofillRunning = false;
        elements.startAutofillBtn.disabled = false;
    }
}

async function ensureContentScriptLoaded(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_INFO' });
        console.log('Content script already loaded');
    } catch (error) {
        console.log('Content script not loaded, injecting...');
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content-script.js']
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Content script injected');
    }
}

async function getPageData(tabId) {
    console.log('Sidebar sending ANALYZE_PAGE message to tab:', tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
        type: 'ANALYZE_PAGE'
    });
    
    console.log('Sidebar received analysis response:', response);
    
    if (response && response.error) {
        throw new Error(response.error);
    }
    
    if (!response || !response.success || !response.data) {
        throw new Error('No analysis data received from content script');
    }
    
    return response.data;
}

async function generateFillData(profile, pageData) {
    // Flatten all fields from all forms
    const allFields = [];
    pageData.forms.forEach(form => {
        form.fields.forEach(field => {
            allFields.push(field);
        });
    });
    
    const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_FILL_DATA',
        data: {
            profile: profile,
            fields: allFields
        }
    });
    
    if (response && response.error) {
        throw new Error(response.error);
    }
    
    if (!response || !response.data) {
        throw new Error('Failed to generate fill data');
    }
    
    return response.data;
}

async function fillForm(tabId, fillData) {
    const response = await chrome.tabs.sendMessage(tabId, {
        type: 'FILL_FORM',
        data: fillData
    });
    
    if (response && response.error) {
        throw new Error(response.error);
    }
    
    if (!response) {
        throw new Error('Failed to fill form');
    }
    
    return response;
}


// Progress and results functions
function showProgress() {
    elements.progressSection.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
    
    // Simple progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 2;
        elements.progressFill.style.width = progress + '%';
        elements.progressText.textContent = progress + '% Complete';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);
}

function hideProgress() {
    elements.progressSection.style.display = 'none';
}

function showResults(result) {
    elements.resultsSection.style.display = 'block';
    elements.resultsList.innerHTML = result.results.map(r => `
        <div class="field-result">
            <span class="field-name">${getFieldDisplayName(r.selector)}</span>
            <span class="field-status ${r.status}">
                ${r.status === 'success' ? '✓ Filled' : 
                  r.status === 'failed' ? '✗ Failed' : '⚠ Skipped'}
            </span>
        </div>
    `).join('');
}

function getFieldDisplayName(selector) {
    // Try to extract a meaningful name from the selector
    if (selector.includes('email')) return 'Email';
    if (selector.includes('name')) return 'Name';
    if (selector.includes('phone')) return 'Phone';
    if (selector.includes('address')) return 'Address';
    return selector.replace(/[#\.\[\]"']/g, '').substring(0, 20);
}

function updatePageInfo(title = 'Ready to start', description = 'Select a profile and click "Start Autofill" to begin') {
    if (elements.pageInfoTitle) {
        elements.pageInfoTitle.textContent = title;
    }
    if (elements.pageInfoDescription) {
        elements.pageInfoDescription.textContent = description;
    }
}

// Page info for header
async function updateHeaderPageInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'GET_PAGE_INFO'
            });
            
            if (response && !response.error) {
                const { formCount, fieldCount } = response;
                elements.pageStatus.textContent = `${formCount} forms, ${fieldCount} fields`;
            }
        }
    } catch (error) {
        console.error('Failed to get page info:', error);
        elements.pageStatus.textContent = 'Ready';
    }
}

// Utility functions
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    console.error('Sidebar Error:', message);
    
    // Create a better error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        color: #742a2a;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #feb2b2;
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess(message) {
    // Simple success display - could be enhanced with a proper notification system
    console.log('Sidebar Success:', message);
    
    // Create a success notification
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #c6f6d5;
        color: #22543d;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #9ae6b4;
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}