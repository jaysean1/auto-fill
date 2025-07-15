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
    smartFillBtn: document.getElementById('smartFillBtn'),
    
    // Progress and results
    progressResultsSection: document.getElementById('progressResultsSection'),
    progressResultsTitle: document.getElementById('progressResultsTitle'),
    progressContent: document.getElementById('progressContent'),
    resultsContent: document.getElementById('resultsContent'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    stepsList: document.getElementById('stepsList'),
    resultsList: document.getElementById('resultsList'),
    
    // Settings
    modelProvider: document.getElementById('modelProvider'),
    apiKeyGroup: document.getElementById('apiKeyGroup'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    autoAnalyzeToggle: document.getElementById('autoAnalyzeToggle'),
    debugModeToggle: document.getElementById('debugModeToggle'),
    apiStatus: document.getElementById('apiStatus'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Smart Fill Settings
    enableSmartFillToggle: document.getElementById('enableSmartFillToggle'),
    smartFillFallbackToggle: document.getElementById('smartFillFallbackToggle'),
    maxContentSize: document.getElementById('maxContentSize'),
    
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
    
    // Setup dynamic height adjustment
    setupDynamicHeight();
    
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
    elements.smartFillBtn.addEventListener('click', startSmartFill);
    
    // Settings
    elements.modelProvider.addEventListener('change', onModelProviderChange);
    elements.apiKeyInput.addEventListener('input', onSettingsChange);
    elements.autoAnalyzeToggle.addEventListener('click', toggleAutoAnalyze);
    elements.debugModeToggle.addEventListener('click', toggleDebugMode);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Smart Fill Settings
    elements.enableSmartFillToggle.addEventListener('click', toggleSmartFill);
    elements.smartFillFallbackToggle.addEventListener('click', toggleSmartFillFallback);
    elements.maxContentSize.addEventListener('input', onSettingsChange);
    
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
        
        // Adjust height after profiles are rendered
        setTimeout(adjustProfileListHeight, 100);
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
    
    // Enable both buttons
    elements.startAutofillBtn.disabled = false;
    elements.smartFillBtn.disabled = false;
    
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
            elements.smartFillBtn.disabled = true;
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
    elements.enableSmartFillToggle.classList.toggle('active', settings.enableSmartFill !== false);
    elements.smartFillFallbackToggle.classList.toggle('active', settings.smartFillFallback !== false);
    elements.maxContentSize.value = settings.maxContentSize || 500;
    
    onModelProviderChange();
    updateApiStatus();
    
    // Update smart fill button state - always enabled when profile selected
    const isEnabled = settings.enableSmartFill !== false;
    elements.smartFillBtn.disabled = !selectedProfile;
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

function toggleSmartFill() {
    elements.enableSmartFillToggle.classList.toggle('active');
    onSettingsChange();
    
    // Update smart fill button state
    const isEnabled = elements.enableSmartFillToggle.classList.contains('active');
    elements.smartFillBtn.disabled = !isEnabled || !selectedProfile;
}

function toggleSmartFillFallback() {
    elements.smartFillFallbackToggle.classList.toggle('active');
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
        debugMode: elements.debugModeToggle.classList.contains('active'),
        enableSmartFill: elements.enableSmartFillToggle.classList.contains('active'),
        smartFillFallback: elements.smartFillFallbackToggle.classList.contains('active'),
        maxContentSize: parseInt(elements.maxContentSize.value) || 500
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
        elements.smartFillBtn.disabled = false;
    }
}

// Smart Fill functionality - AI-powered page analysis
async function startSmartFill() {
    if (!selectedProfile) {
        showError('Please select a profile first');
        return;
    }
    
    if (isAutofillRunning) {
        showError('Autofill is already running');
        return;
    }
    
    // Check if smart fill is enabled
    if (!settings.enableSmartFill) {
        showError('Smart Fill is disabled. Please enable it in Settings.');
        return;
    }
    
    console.log('Starting Smart Fill for profile:', selectedProfile);
    
    isAutofillRunning = true;
    elements.startAutofillBtn.disabled = true;
    elements.smartFillBtn.disabled = true;
    
    try {
        // Show progress with Smart Fill specific steps
        showSmartFillProgress();
        
        // Step 1: Get current tab and ensure content script is loaded
        updatePageInfo('Preparing...', 'Checking page and loading scripts');
        updateSmartFillStep(1, 'current');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await ensureContentScriptLoaded(tab.id);
        
        // Step 2: Extract full page content for AI analysis
        updatePageInfo('Extracting content...', 'Preparing page content for AI analysis');
        updateSmartFillStep(1, 'completed');
        updateSmartFillStep(2, 'current');
        const pageContent = await extractPageContent(tab.id);
        
        console.log('Extracted page content:', pageContent);
        
        // Check content size
        if (pageContent.stats.estimatedTokens > settings.maxContentSize * 1000) {
            throw new Error(`Page content too large (${Math.round(pageContent.stats.estimatedTokens/1000)}KB > ${settings.maxContentSize}KB limit)`);
        }
        
        // Step 3: Perform AI analysis
        updatePageInfo('AI Analysis...', 'Analyzing page structure with AI');
        updateSmartFillStep(2, 'completed');
        updateSmartFillStep(3, 'current');
        const analysisResult = await performSmartAnalysis(pageContent);
        
        console.log('Smart analysis result:', analysisResult);
        
        if (!analysisResult.forms || analysisResult.forms.length === 0) {
            throw new Error('AI could not identify any forms on this page');
        }
        
        // Count total fields from AI analysis
        const totalFields = analysisResult.forms.reduce((count, form) => count + form.fields.length, 0);
        console.log(`AI identified ${totalFields} fillable fields`);
        
        if (totalFields === 0) {
            throw new Error('AI analysis found forms but no fillable fields');
        }
        
        // Step 4: Generate fill data using AI analysis
        updatePageInfo('Generating data...', `AI found ${totalFields} fields, generating fill values`);
        updateSmartFillStep(3, 'completed');
        updateSmartFillStep(4, 'current');
        const profile = profiles.find(p => p.name === selectedProfile);
        const fillData = await generateSmartFillData(profile, analysisResult);
        
        if (!fillData || Object.keys(fillData).length === 0) {
            throw new Error('Could not generate fill data from AI analysis');
        }
        
        // Step 5: Fill the form
        updatePageInfo('Smart filling...', 'Injecting AI-generated data into form fields');
        updateSmartFillStep(4, 'completed');
        updateSmartFillStep(5, 'current');
        const fillResult = await fillForm(tab.id, fillData);
        
        // Step 6: Show results
        updateSmartFillStep(5, 'completed');
        showResults(fillResult, 'smart-fill');
        updatePageInfo('Smart Fill complete!', `${fillResult.successCount}/${fillResult.totalFields} fields filled successfully`);
        
    } catch (error) {
        console.error('Smart Fill failed:', error);
        
        // Check if fallback is enabled
        if (settings.smartFillFallback) {
            console.log('Smart Fill failed, attempting fallback to traditional method');
            showError(`Smart Fill failed: ${error.message}. Trying traditional method...`);
            
            try {
                // Reset UI state
                hideProgress();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Call traditional autofill
                await startAutofillFallback();
                return;
                
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                showError(`Both Smart Fill and fallback failed: ${fallbackError.message}`);
            }
        } else {
            showError(`Smart Fill failed: ${error.message}`);
        }
        
        updatePageInfo('Smart Fill failed', error.message);
        hideProgress();
    } finally {
        isAutofillRunning = false;
        elements.startAutofillBtn.disabled = false;
        elements.smartFillBtn.disabled = false;
    }
}

// Fallback to traditional autofill method
async function startAutofillFallback() {
    console.log('Starting traditional autofill as fallback');
    
    // Show progress
    showProgress();
    
    // Step 1: Get current tab
    updatePageInfo('Fallback mode...', 'Using traditional form analysis');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Step 2: Analyze page structure (traditional way)
    updatePageInfo('Analyzing page...', 'Detecting form fields (traditional method)');
    const pageData = await getPageData(tab.id);
    
    if (!pageData.forms || pageData.forms.length === 0) {
        throw new Error('No forms found on this page (fallback)');
    }
    
    const totalFields = pageData.forms.reduce((count, form) => count + form.fields.length, 0);
    if (totalFields === 0) {
        throw new Error('No fillable fields found (fallback)');
    }
    
    // Step 3: Generate fill data
    updatePageInfo('Matching data...', `Found ${totalFields} fields (fallback method)`);
    const profile = profiles.find(p => p.name === selectedProfile);
    const fillData = await generateFillData(profile, pageData);
    
    if (!fillData || Object.keys(fillData).length === 0) {
        throw new Error('No matching data could be generated (fallback)');
    }
    
    // Step 4: Fill the form
    updatePageInfo('Filling form...', 'Injecting data (fallback method)');
    const fillResult = await fillForm(tab.id, fillData);
    
    // Step 5: Show results
    showResults(fillResult, 'fallback');
    updatePageInfo('Fallback complete!', `${fillResult.successCount}/${fillResult.totalFields} fields filled successfully`);
}

// Smart Fill helper functions

// Extract page content for AI analysis
async function extractPageContent(tabId) {
    console.log('Extracting page content for AI analysis');
    
    const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_PAGE_CONTENT'
    });
    
    if (response && response.error) {
        throw new Error(response.error);
    }
    
    if (!response || !response.success || !response.data) {
        throw new Error('Failed to extract page content');
    }
    
    return response.data;
}

// Perform smart analysis using AI
async function performSmartAnalysis(pageContent) {
    console.log('Performing smart analysis with AI');
    
    const response = await chrome.runtime.sendMessage({
        type: 'SMART_ANALYZE_PAGE',
        data: pageContent
    });
    
    if (response && response.error) {
        throw new Error(response.error);
    }
    
    if (!response || !response.success || !response.data) {
        throw new Error('AI analysis failed');
    }
    
    return response.data;
}

// Generate fill data from smart analysis result
async function generateSmartFillData(profile, analysisResult) {
    console.log('Generating smart fill data');
    
    const fillData = {};
    
    // Process each form from AI analysis
    analysisResult.forms.forEach(form => {
        form.fields.forEach(field => {
            if (field.selector && field.semanticType && field.semanticType !== 'unknown') {
                // Use AI-determined semantic type to match profile data
                const value = extractValueFromProfile(profile.info, field.semanticType, field.label);
                if (value) {
                    fillData[field.selector] = value;
                }
            }
        });
    });
    
    console.log('Generated smart fill data:', fillData);
    return fillData;
}

// Extract value from profile based on semantic type
function extractValueFromProfile(profileInfo, semanticType, fieldLabel) {
    const info = profileInfo.toLowerCase();
    
    switch (semanticType) {
        case 'email':
            const emailMatch = info.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            return emailMatch ? emailMatch[1] : null;
            
        case 'firstName':
            // Try to extract first name from various patterns
            const firstNamePatterns = [
                /我叫([^\s，,]+)/,
                /名字[是叫]([^\s，,]+)/,
                /first name[:\s]+([^\s，,]+)/i,
                /名[：:]([^\s，,]+)/
            ];
            for (const pattern of firstNamePatterns) {
                const match = info.match(pattern);
                if (match) return match[1];
            }
            break;
            
        case 'lastName':
            // Try to extract last name
            const lastNamePatterns = [
                /姓([^\s，,]+)/,
                /last name[:\s]+([^\s，,]+)/i,
                /family name[:\s]+([^\s，,]+)/i
            ];
            for (const pattern of lastNamePatterns) {
                const match = info.match(pattern);
                if (match) return match[1];
            }
            break;
            
        case 'fullName':
            const fullNamePatterns = [
                /我叫([^\s，,]+)/,
                /名字[是叫]([^\s，,]+)/,
                /英文名[是叫]([^\s，,]+)/,
                /name[:\s]+([^\s，,]+)/i
            ];
            for (const pattern of fullNamePatterns) {
                const match = info.match(pattern);
                if (match) return match[1];
            }
            break;
            
        case 'phone':
            const phoneMatch = info.match(/(\+?[\d\s\-\(\)]{10,})/);
            return phoneMatch ? phoneMatch[1].replace(/\s/g, '') : null;
            
        case 'dateOfBirth':
            const datePatterns = [
                /出生[于在]?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
                /生日[是:]?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
                /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
            ];
            for (const pattern of datePatterns) {
                const match = info.match(pattern);
                if (match) return match[1];
            }
            break;
            
        case 'address':
            const addressPatterns = [
                /地址[是:]?([^，,。.]+)/,
                /住[在址]([^，,。.]+)/,
                /address[:\s]+([^，,。.]+)/i
            ];
            for (const pattern of addressPatterns) {
                const match = info.match(pattern);
                if (match) return match[1].trim();
            }
            break;
            
        case 'city':
            const cityPatterns = [
                /在([^，,。.]*[市城])/,
                /city[:\s]+([^\s，,]+)/i
            ];
            for (const pattern of cityPatterns) {
                const match = info.match(pattern);
                if (match) return match[1];
            }
            break;
            
        case 'company':
            const companyPatterns = [
                /公司[是:]?([^，,。.]+)/,
                /工作[在于]([^，,。.]+)/,
                /company[:\s]+([^，,。.]+)/i
            ];
            for (const pattern of companyPatterns) {
                const match = info.match(pattern);
                if (match) return match[1].trim();
            }
            break;
            
        case 'website':
            const urlMatch = info.match(/(https?:\/\/[^\s]+)/);
            return urlMatch ? urlMatch[1] : null;
            
        default:
            // For unknown types, try to match based on field label
            if (fieldLabel) {
                const labelLower = fieldLabel.toLowerCase();
                if (labelLower.includes('email') || labelLower.includes('邮箱')) {
                    return extractValueFromProfile(profileInfo, 'email');
                }
                if (labelLower.includes('name') || labelLower.includes('姓名')) {
                    return extractValueFromProfile(profileInfo, 'fullName');
                }
                if (labelLower.includes('phone') || labelLower.includes('电话')) {
                    return extractValueFromProfile(profileInfo, 'phone');
                }
            }
            return null;
    }
    
    return null;
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
    elements.progressResultsSection.style.display = 'block';
    elements.progressResultsTitle.textContent = 'Progress';
    elements.progressContent.style.display = 'block';
    elements.resultsContent.style.display = 'none';
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
    
    // Adjust profile list height after showing progress
    setTimeout(adjustProfileListHeight, 100);
    
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
    elements.progressResultsSection.style.display = 'none';
    
    // Adjust profile list height after hiding progress
    setTimeout(adjustProfileListHeight, 100);
}

function showResults(result) {
    // Switch to results view in the same section
    elements.progressResultsTitle.textContent = 'Fill Results';
    elements.progressContent.style.display = 'none';
    elements.resultsContent.style.display = 'block';
    
    elements.resultsList.innerHTML = result.results.map(r => `
        <div class="field-result">
            <span class="field-name">${getFieldDisplayName(r.selector)}</span>
            <span class="field-status ${r.status}">
                ${r.status === 'success' ? 'Filled' : 
                  r.status === 'failed' ? 'Failed' : 'Skipped'}
            </span>
        </div>
    `).join('');
    
    // Adjust profile list height after showing results
    setTimeout(adjustProfileListHeight, 100);
}

// Smart Fill progress functions
function showSmartFillProgress() {
    elements.progressResultsSection.style.display = 'block';
    elements.progressResultsTitle.textContent = 'Smart Fill Progress';
    elements.progressContent.style.display = 'block';
    elements.resultsContent.style.display = 'none';
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
    
    // Clear existing steps
    elements.stepsList.innerHTML = '';
    
    // Add Smart Fill specific steps
    const smartFillSteps = [
        'Extracting page content',
        'AI analyzing page structure',
        'Identifying form fields',
        'Generating fill data',
        'Filling form fields',
        'Validation complete'
    ];
    
    smartFillSteps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'step-item';
        stepElement.innerHTML = `
            <div class="step-icon pending" data-step="${index + 1}">${index + 1}</div>
            <div class="step-text pending">${step}</div>
        `;
        elements.stepsList.appendChild(stepElement);
    });
    
    // Adjust profile list height
    setTimeout(adjustProfileListHeight, 100);
}

function updateSmartFillStep(stepNumber, status) {
    const stepElements = elements.stepsList.querySelectorAll('.step-item');
    if (stepElements[stepNumber - 1]) {
        const stepElement = stepElements[stepNumber - 1];
        const icon = stepElement.querySelector('.step-icon');
        const text = stepElement.querySelector('.step-text');
        
        // Remove existing classes
        icon.className = `step-icon ${status}`;
        text.className = `step-text ${status}`;
        
        // Update icon content based on status
        if (status === 'completed') {
            icon.textContent = '✓';
        } else if (status === 'current') {
            icon.textContent = stepNumber;
        }
        
        // Update progress bar
        const progress = (stepNumber / 6) * 100;
        elements.progressFill.style.width = progress + '%';
        elements.progressText.textContent = Math.round(progress) + '% Complete';
    }
}

// Enhanced results display for Smart Fill
function showResults(result, source = 'traditional') {
    // Switch to results view
    elements.progressResultsTitle.textContent = source === 'smart-fill' ? 'Smart Fill Results' : 
                                               source === 'fallback' ? 'Fallback Results' : 'Fill Results';
    elements.progressContent.style.display = 'none';
    elements.resultsContent.style.display = 'block';
    
    // Add source indicator
    let sourceIndicator = '';
    if (source === 'smart-fill') {
        sourceIndicator = '<div class="result-source">🧠 AI Analysis</div>';
    } else if (source === 'fallback') {
        sourceIndicator = '<div class="result-source">⚡ Fallback Mode</div>';
    }
    
    elements.resultsList.innerHTML = sourceIndicator + result.results.map(r => `
        <div class="field-result">
            <span class="field-name">${getFieldDisplayName(r.selector)}</span>
            <span class="field-status ${r.status}">
                ${r.status === 'success' ? 'Filled' : 
                  r.status === 'failed' ? 'Failed' : 'Skipped'}
            </span>
        </div>
    `).join('');
    
    // Adjust profile list height
    setTimeout(adjustProfileListHeight, 100);
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

// Dynamic height adjustment
function setupDynamicHeight() {
    adjustProfileListHeight();
    
    // Listen for window resize
    window.addEventListener('resize', adjustProfileListHeight);
    
    // Listen for profile list changes
    const observer = new MutationObserver(() => {
        adjustProfileListHeight();
    });
    
    if (elements.profileList) {
        observer.observe(elements.profileList, { childList: true });
    }
}

function adjustProfileListHeight() {
    const profileSection = document.querySelector('.section.profile-section');
    const profileList = elements.profileList;
    
    if (!profileSection || !profileList) return;
    
    // Get viewport height
    const viewportHeight = window.innerHeight;
    
    // Calculate available space
    const header = document.querySelector('.sidebar-header');
    const navTabs = document.querySelector('.nav-tabs');
    const sectionHeader = profileSection.querySelector('.section-header');
    const infoSection = document.querySelector('.section.info-section');
    const actionSection = document.querySelector('.section.action-section');
    const progressResultsSection = document.querySelector('.section.progress-results-section');
    
    const headerHeight = header ? header.offsetHeight : 0;
    const navTabsHeight = navTabs ? navTabs.offsetHeight : 0;
    const sectionHeaderHeight = sectionHeader ? sectionHeader.offsetHeight : 0;
    const infoSectionHeight = infoSection ? infoSection.offsetHeight : 0;
    const actionSectionHeight = actionSection ? actionSection.offsetHeight : 0;
    
    // Calculate height of progress/results section if visible
    let progressResultsSectionHeight = 0;
    
    if (progressResultsSection && progressResultsSection.style.display !== 'none') {
        progressResultsSectionHeight = progressResultsSection.offsetHeight;
    }
    
    // Calculate padding and margins
    const profileSectionPadding = 32; // 16px top + 16px bottom
    const profileSectionMargin = 16; // margin-bottom
    const buffer = 40; // Extra buffer for safety (increased for better spacing)
    
    // Calculate available height for profile list
    const usedHeight = headerHeight + navTabsHeight + sectionHeaderHeight + 
                      infoSectionHeight + actionSectionHeight + 
                      progressResultsSectionHeight +
                      profileSectionPadding + profileSectionMargin + buffer;
    
    const availableHeight = viewportHeight - usedHeight;
    
    // Set minimum and maximum heights
    const minHeight = 120; // Minimum height to show at least 1 profile
    const maxHeight = Math.max(availableHeight, minHeight);
    
    // Apply the calculated height
    profileList.style.maxHeight = `${maxHeight}px`;
    
    console.log('Profile list height adjusted:', {
        viewportHeight,
        usedHeight,
        availableHeight,
        finalHeight: maxHeight,
        progressResultsVisible: progressResultsSection && progressResultsSection.style.display !== 'none',
        progressResultsHeight: progressResultsSectionHeight
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}