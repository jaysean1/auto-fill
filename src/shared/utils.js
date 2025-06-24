// Shared utilities for Smart Autofill Assistant

/**
 * Storage utilities
 */
export const Storage = {
    async get(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    },

    async set(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, resolve);
        });
    },

    async remove(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(keys, resolve);
        });
    },

    async clear() {
        return new Promise((resolve) => {
            chrome.storage.local.clear(resolve);
        });
    }
};

/**
 * Message passing utilities
 */
export const Messaging = {
    async sendToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    },

    async sendToTab(tabId, message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    },

    onMessage(callback) {
        chrome.runtime.onMessage.addListener(callback);
    }
};

/**
 * DOM utilities
 */
export const DOM = {
    /**
     * Generate a unique CSS selector for an element
     */
    generateSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.name) {
            return `[name="${element.name}"]`;
        }

        // Generate path-based selector
        const path = [];
        let current = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.className) {
                const classes = current.className.split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                    selector += '.' + classes.join('.');
                }
            }

            // Add nth-child if needed for uniqueness
            const siblings = Array.from(current.parentNode?.children || []);
            const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }

            path.unshift(selector);
            current = current.parentElement;
        }

        return path.join(' > ');
    },

    /**
     * Find label text for a form field
     */
    findFieldLabel(field) {
        // Check for explicit label
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Check for parent label
        const parentLabel = field.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.replace(field.value, '').trim();
        }

        // Check for preceding text
        const prevSibling = field.previousElementSibling;
        if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN')) {
            return prevSibling.textContent.trim();
        }

        // Check for aria-label
        if (field.getAttribute('aria-label')) {
            return field.getAttribute('aria-label');
        }

        return '';
    },

    /**
     * Simulate human-like typing
     */
    async simulateTyping(element, text, delay = 50) {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Add character to value
            element.value += char;
            
            // Dispatch input event
            element.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: char,
                inputType: 'insertText'
            }));
            
            // Small delay to simulate human typing
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    },

    /**
     * Trigger form events
     */
    triggerEvents(element) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    }
};

/**
 * Form analysis utilities
 */
export const FormAnalyzer = {
    /**
     * Extract semantic meaning from field attributes
     */
    getSemanticLabel(field) {
        const name = field.name?.toLowerCase() || '';
        const placeholder = field.placeholder?.toLowerCase() || '';
        const type = field.type || 'text';
        const label = DOM.findFieldLabel(field).toLowerCase();
        const autocomplete = field.autocomplete?.toLowerCase() || '';

        // Email detection
        if (type === 'email' || 
            name.includes('email') || 
            placeholder.includes('email') ||
            label.includes('email') ||
            autocomplete.includes('email')) {
            return 'email';
        }

        // Name detection
        if (name.includes('name') || placeholder.includes('name') || label.includes('name')) {
            if (name.includes('first') || placeholder.includes('first') || label.includes('first')) {
                return 'firstName';
            } else if (name.includes('last') || placeholder.includes('last') || label.includes('last')) {
                return 'lastName';
            } else {
                return 'fullName';
            }
        }

        // Phone detection
        if (type === 'tel' || 
            name.includes('phone') || 
            placeholder.includes('phone') ||
            label.includes('phone') ||
            autocomplete.includes('tel')) {
            return 'phone';
        }

        // Address detection
        if (name.includes('address') || 
            placeholder.includes('address') ||
            label.includes('address') ||
            autocomplete.includes('address')) {
            return 'address';
        }

        // Date of birth
        if (type === 'date' ||
            name.includes('birth') ||
            placeholder.includes('birth') ||
            label.includes('birth')) {
            return 'dateOfBirth';
        }

        // Password
        if (type === 'password') {
            return 'password';
        }

        return 'unknown';
    },

    /**
     * Determine form type based on fields and context
     */
    determineFormType(fields, pageContext) {
        const fieldTypes = fields.map(f => this.getSemanticLabel(f));
        
        if (fieldTypes.includes('email') && fieldTypes.includes('password')) {
            if (fieldTypes.filter(t => t === 'password').length > 1) {
                return 'registration';
            } else {
                return 'login';
            }
        }

        if (fieldTypes.includes('address') || fieldTypes.includes('phone')) {
            return 'contact';
        }

        if (pageContext.url.includes('checkout') || pageContext.url.includes('payment')) {
            return 'checkout';
        }

        return 'general';
    }
};

/**
 * Data extraction utilities
 */
export const DataExtractor = {
    /**
     * Extract email from text
     */
    extractEmail(text) {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const match = text.match(emailRegex);
        return match ? match[1] : null;
    },

    /**
     * Extract phone number from text
     */
    extractPhone(text) {
        const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/;
        const match = text.match(phoneRegex);
        return match ? match[1].replace(/\s/g, '') : null;
    },

    /**
     * Extract name from Chinese or English text
     */
    extractName(text) {
        // Chinese name pattern
        const chineseNameMatch = text.match(/我叫([^，,。\s]+)/);
        if (chineseNameMatch) {
            return chineseNameMatch[1];
        }

        // General name pattern
        const nameMatch = text.match(/叫([^，,。\s]+)/);
        if (nameMatch) {
            return nameMatch[1];
        }

        // English name pattern
        const englishNameMatch = text.match(/name\s+is\s+([a-zA-Z\s]+)/i);
        if (englishNameMatch) {
            return englishNameMatch[1].trim();
        }

        return null;
    },

    /**
     * Extract address from text
     */
    extractAddress(text) {
        // Look for address patterns
        const addressPatterns = [
            /(Unit \d+[^,]*,[^,]*,[^,]*)/i,
            /([^,]*街[^,]*)/,
            /(\d+[^,]*[Ss]treet[^,]*)/i,
            /(\d+[^,]*[Aa]venue[^,]*)/i,
            /(\d+[^,]*[Rr]oad[^,]*)/i
        ];

        for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    },

    /**
     * Extract date of birth from text
     */
    extractDateOfBirth(text) {
        const datePatterns = [
            /(\d{4}\/\d{1,2}\/\d{1,2})/,
            /(\d{4}-\d{1,2}-\d{1,2})/,
            /(\d{1,2}\/\d{1,2}\/\d{4})/,
            /(\d{1,2}-\d{1,2}-\d{4})/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }
};

/**
 * Validation utilities
 */
export const Validator = {
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

/**
 * Debounce utility
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle utility
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Logger utility
 */
export const Logger = {
    debug(...args) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Smart Autofill Debug]', ...args);
        }
    },

    info(...args) {
        console.info('[Smart Autofill]', ...args);
    },

    warn(...args) {
        console.warn('[Smart Autofill Warning]', ...args);
    },

    error(...args) {
        console.error('[Smart Autofill Error]', ...args);
    }
};