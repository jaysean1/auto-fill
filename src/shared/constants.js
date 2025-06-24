// Constants for Smart Autofill Assistant

// Message types
export const MESSAGE_TYPES = {
    // Page analysis
    ANALYZE_PAGE: 'ANALYZE_PAGE',
    ANALYSIS_COMPLETE: 'ANALYSIS_COMPLETE',
    
    // Autofill
    AUTOFILL_FORM: 'AUTOFILL_FORM',
    FILL_FORM: 'FILL_FORM',
    AUTOFILL_COMPLETE: 'AUTOFILL_COMPLETE',
    AUTOFILL_PROGRESS: 'AUTOFILL_PROGRESS',
    
    // Profile management
    GET_PROFILES: 'GET_PROFILES',
    SAVE_PROFILE: 'SAVE_PROFILE',
    DELETE_PROFILE: 'DELETE_PROFILE',
    
    // Settings
    GET_SETTINGS: 'GET_SETTINGS',
    SAVE_SETTINGS: 'SAVE_SETTINGS',
    
    // Page info
    GET_PAGE_INFO: 'GET_PAGE_INFO'
};

// Semantic field labels
export const SEMANTIC_LABELS = {
    EMAIL: 'email',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    FULL_NAME: 'fullName',
    PHONE: 'phone',
    ADDRESS: 'address',
    CITY: 'city',
    STATE: 'state',
    ZIP_CODE: 'zipCode',
    COUNTRY: 'country',
    DATE_OF_BIRTH: 'dateOfBirth',
    PASSWORD: 'password',
    CONFIRM_PASSWORD: 'confirmPassword',
    COMPANY: 'company',
    JOB_TITLE: 'jobTitle',
    WEBSITE: 'website',
    UNKNOWN: 'unknown'
};

// Form types
export const FORM_TYPES = {
    LOGIN: 'login',
    REGISTRATION: 'registration',
    CONTACT: 'contact',
    CHECKOUT: 'checkout',
    PROFILE: 'profile',
    GENERAL: 'general'
};

// AI model providers
export const MODEL_PROVIDERS = {
    LOCAL: 'local',
    GEMINI: 'gemini',
    OPENAI: 'openai',
    CLAUDE: 'claude'
};

// API endpoints
export const API_ENDPOINTS = {
    GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent',
    OPENAI: 'https://api.openai.com/v1/chat/completions',
    CLAUDE: 'https://api.anthropic.com/v1/messages'
};

// Default settings
export const DEFAULT_SETTINGS = {
    modelProvider: MODEL_PROVIDERS.LOCAL,
    apiKey: '',
    autoAnalyze: true,
    debugMode: false,
    fillDelay: 50,
    maxRetries: 3,
    timeout: 30000
};

// Field confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.6,
    LOW: 0.4
};

// Autofill status
export const AUTOFILL_STATUS = {
    IDLE: 'idle',
    ANALYZING: 'analyzing',
    FILLING: 'filling',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// Fill result status
export const FILL_STATUS = {
    SUCCESS: 'success',
    FAILED: 'failed',
    SKIPPED: 'skipped'
};

// Storage keys
export const STORAGE_KEYS = {
    PROFILES: 'profiles',
    SETTINGS: 'settings',
    ANALYSIS_CACHE: 'analysisCache'
};

// Regular expressions
export const REGEX_PATTERNS = {
    EMAIL: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    PHONE: /(\+?[\d\s\-\(\)]{10,})/,
    DATE: /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
    ZIP_CODE: /(\d{5}(-\d{4})?)/,
    URL: /(https?:\/\/[^\s]+)/
};

// Field type mappings
export const FIELD_TYPE_MAPPINGS = {
    'input[type="email"]': SEMANTIC_LABELS.EMAIL,
    'input[type="tel"]': SEMANTIC_LABELS.PHONE,
    'input[type="password"]': SEMANTIC_LABELS.PASSWORD,
    'input[type="date"]': SEMANTIC_LABELS.DATE_OF_BIRTH,
    'input[type="url"]': SEMANTIC_LABELS.WEBSITE
};

// Common field name patterns
export const FIELD_NAME_PATTERNS = {
    [SEMANTIC_LABELS.EMAIL]: ['email', 'e-mail', 'mail', 'user', 'login'],
    [SEMANTIC_LABELS.FIRST_NAME]: ['firstname', 'first-name', 'fname', 'given-name'],
    [SEMANTIC_LABELS.LAST_NAME]: ['lastname', 'last-name', 'lname', 'family-name', 'surname'],
    [SEMANTIC_LABELS.FULL_NAME]: ['name', 'fullname', 'full-name', 'username'],
    [SEMANTIC_LABELS.PHONE]: ['phone', 'tel', 'mobile', 'cell', 'telephone'],
    [SEMANTIC_LABELS.ADDRESS]: ['address', 'street', 'addr'],
    [SEMANTIC_LABELS.CITY]: ['city', 'town'],
    [SEMANTIC_LABELS.STATE]: ['state', 'province', 'region'],
    [SEMANTIC_LABELS.ZIP_CODE]: ['zip', 'postal', 'postcode', 'zipcode'],
    [SEMANTIC_LABELS.COUNTRY]: ['country', 'nation'],
    [SEMANTIC_LABELS.COMPANY]: ['company', 'organization', 'org'],
    [SEMANTIC_LABELS.JOB_TITLE]: ['title', 'position', 'job', 'role'],
    [SEMANTIC_LABELS.WEBSITE]: ['website', 'url', 'homepage', 'site']
};

// Autofill steps
export const AUTOFILL_STEPS = [
    'Analyzing page structure',
    'Identifying form fields',
    'Matching user data',
    'Filling form fields',
    'Validation complete'
];

// Error messages
export const ERROR_MESSAGES = {
    NO_PROFILE_SELECTED: 'Please select a profile first',
    NO_FORMS_FOUND: 'No forms found on this page',
    ANALYSIS_FAILED: 'Failed to analyze page structure',
    AUTOFILL_FAILED: 'Failed to fill form fields',
    API_KEY_MISSING: 'API key is required for this model provider',
    INVALID_API_KEY: 'Invalid API key provided',
    NETWORK_ERROR: 'Network error occurred',
    TIMEOUT_ERROR: 'Request timed out'
};

// Success messages
export const SUCCESS_MESSAGES = {
    PROFILE_SAVED: 'Profile saved successfully',
    PROFILE_DELETED: 'Profile deleted successfully',
    SETTINGS_SAVED: 'Settings saved successfully',
    ANALYSIS_COMPLETE: 'Page analysis completed',
    AUTOFILL_COMPLETE: 'Form filled successfully'
};

// CSS classes for visual feedback
export const CSS_CLASSES = {
    HIGHLIGHT_SUCCESS: 'autofill-highlight-success',
    HIGHLIGHT_ERROR: 'autofill-highlight-error',
    HIGHLIGHT_PROCESSING: 'autofill-highlight-processing'
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
    HIGHLIGHT: 2000,
    TYPING_DELAY: 50,
    STEP_DELAY: 800,
    PROGRESS_UPDATE: 500
};

// Maximum values
export const MAX_VALUES = {
    PROFILE_NAME_LENGTH: 50,
    PROFILE_INFO_LENGTH: 1000,
    ANALYSIS_CACHE_SIZE: 10,
    RETRY_ATTEMPTS: 3
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
    API_REQUEST: 30000,
    PAGE_ANALYSIS: 10000,
    FORM_FILL: 5000,
    ELEMENT_WAIT: 1000
};