// Content script for Smart Autofill Assistant

console.log('Smart Autofill Assistant content script loaded');

// Page analysis state
let isAnalyzing = false;
let lastAnalysisTime = 0;
const ANALYSIS_COOLDOWN = 2000; // 2 seconds

// Initialize content script
function init() {
  // Listen for DOM changes
  observePageChanges();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Auto-analyze page if enabled
  checkAutoAnalyze();
}

// Handle messages from background script and sidebar
function handleMessage(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'ANALYZE_PAGE':
      console.log('Content script handling ANALYZE_PAGE request');
      analyzePage()
        .then(result => {
          console.log('Content script sending analysis result:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Content script analysis error:', error);
          sendResponse({ error: error.message });
        });
      return true; // Keep message channel open for async response
      
    case 'FILL_FORM':
      console.log('Content script handling FILL_FORM request');
      fillForm(message.data)
        .then(result => {
          console.log('Content script sending fill result:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Content script fill error:', error);
          sendResponse({ error: error.message });
        });
      return true; // Keep message channel open for async response
      
    case 'GET_PAGE_INFO':
      const pageInfo = getPageInfo();
      console.log('Content script sending page info:', pageInfo);
      sendResponse(pageInfo);
      break;
      
    case 'EXTRACT_PAGE_CONTENT':
      console.log('Content script handling EXTRACT_PAGE_CONTENT request');
      extractPageContent()
        .then(result => {
          console.log('Content script sending page content:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Content script content extraction error:', error);
          sendResponse({ error: error.message });
        });
      return true; // Keep message channel open for async response
      
    default:
      console.log('Content script received unknown message type:', message.type);
      break;
  }
}

// Analyze current page structure
async function analyzePage() {
  if (isAnalyzing) {
    throw new Error('Analysis already in progress');
  }
  
  const now = Date.now();
  if (now - lastAnalysisTime < ANALYSIS_COOLDOWN) {
    throw new Error('Analysis on cooldown');
  }
  
  isAnalyzing = true;
  lastAnalysisTime = now;
  
  try {
    const pageData = extractPageData();
    console.log('Content script extracted page data:', pageData);
    
    // For sidebar requests, we should return the raw page data, not AI analysis
    // The sidebar will handle AI analysis separately if needed
    return { success: true, data: pageData };
  } finally {
    isAnalyzing = false;
  }
}

// Extract page data for analysis
function extractPageData() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    forms: [],
    meta: extractMetaData()
  };
  
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} forms on page`);
  
  forms.forEach((form, formIndex) => {
    const formData = {
      index: formIndex,
      action: form.action || '',
      method: form.method || 'get',
      fields: []
    };
    
    // Extract form fields
    const fields = form.querySelectorAll('input, select, textarea');
    console.log(`Form ${formIndex}: found ${fields.length} total fields`);
    
    let skippedCount = 0;
    fields.forEach((field, fieldIndex) => {
      // Skip hidden, submit, and button fields
      if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
        console.log(`Skipping field ${fieldIndex}: type=${field.type}, name=${field.name}, id=${field.id}`);
        skippedCount++;
        return;
      }
      
      const fieldData = {
        selector: generateSelector(field),
        type: field.type || 'text',
        name: field.name || '',
        id: field.id || '',
        placeholder: field.placeholder || '',
        value: field.value || '',
        required: field.required || false,
        label: findFieldLabel(field),
        autocomplete: field.autocomplete || ''
      };
      
      console.log(`Including field ${fieldIndex}:`, fieldData);
      formData.fields.push(fieldData);
    });
    
    console.log(`Form ${formIndex}: included ${formData.fields.length} fields, skipped ${skippedCount} fields`);
    
    // Always include the form, even if it has no fillable fields, for debugging
    pageData.forms.push(formData);
  });
  
  console.log(`Final result: ${pageData.forms.length} forms with fillable fields`);
  return pageData;
}

// Generate CSS selector for an element
function generateSelector(element) {
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
}

// Find label for a form field
function findFieldLabel(field) {
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
}

// Extract meta data from page
function extractMetaData() {
  const meta = {
    description: '',
    keywords: '',
    viewport: '',
    language: document.documentElement.lang || 'en'
  };
  
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    
    if (name && content) {
      switch (name.toLowerCase()) {
        case 'description':
          meta.description = content;
          break;
        case 'keywords':
          meta.keywords = content;
          break;
        case 'viewport':
          meta.viewport = content;
          break;
      }
    }
  });
  
  return meta;
}

// Fill form with provided data
async function fillForm(fillData) {
  const results = [];
  
  for (const [selector, value] of Object.entries(fillData)) {
    try {
      const element = document.querySelector(selector);
      
      if (!element) {
        results.push({
          selector,
          status: 'failed',
          error: 'Element not found'
        });
        continue;
      }
      
      // Fill the field
      await fillField(element, value);
      
      results.push({
        selector,
        status: 'success',
        value: value
      });
      
      // Add visual feedback
      highlightField(element);
      
    } catch (error) {
      results.push({
        selector,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    results: results,
    totalFields: Object.keys(fillData).length,
    successCount: results.filter(r => r.status === 'success').length
  };
}

// Fill individual field
async function fillField(element, value) {
  // Focus the element
  element.focus();
  
  // Clear existing value
  element.value = '';
  
  // Simulate typing for better compatibility
  if (element.type === 'text' || element.type === 'email' || element.type === 'tel' || element.tagName === 'TEXTAREA') {
    await simulateTyping(element, value);
  } else {
    element.value = value;
  }
  
  // Trigger events
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// Simulate typing for better compatibility with modern forms
async function simulateTyping(element, text) {
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
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Highlight filled field with visual feedback
function highlightField(element) {
  const originalStyle = element.style.cssText;
  
  element.style.transition = 'all 0.3s ease';
  element.style.backgroundColor = '#e6ffed';
  element.style.borderColor = '#48bb78';
  element.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
  
  setTimeout(() => {
    element.style.cssText = originalStyle;
  }, 2000);
}

// Observe page changes for dynamic forms
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    let hasFormChanges = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || node.querySelector('form')) {
              hasFormChanges = true;
            }
          }
        });
      }
    });
    
    if (hasFormChanges) {
      // Debounce analysis
      clearTimeout(window.autofillAnalysisTimeout);
      window.autofillAnalysisTimeout = setTimeout(() => {
        checkAutoAnalyze();
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Check if auto-analyze is enabled and trigger analysis
async function checkAutoAnalyze() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response && response.data?.autoAnalyze && document.querySelectorAll('form').length > 0) {
      // Auto-analyze after a delay
      setTimeout(() => {
        analyzePage().catch(console.error);
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to check auto-analyze setting:', error);
  }
}

// Get basic page info
function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    formCount: document.querySelectorAll('form').length,
    fieldCount: document.querySelectorAll('input, select, textarea').length
  };
}

// Smart Fill - Extract page content for AI analysis
async function extractPageContent() {
  console.log('Extracting page content for AI analysis');
  
  try {
    // Get full body HTML
    const bodyHTML = document.body.innerHTML;
    
    // Clean and optimize content
    const cleanedHTML = cleanHTMLForAI(bodyHTML);
    
    // Extract page metadata
    const pageMetadata = {
      url: window.location.href,
      title: document.title,
      language: document.documentElement.lang || 'en',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pageType: inferPageType()
    };
    
    // Calculate content stats
    const stats = {
      originalSize: bodyHTML.length,
      cleanedSize: cleanedHTML.length,
      estimatedTokens: estimateTokenCount(cleanedHTML),
      formCount: document.querySelectorAll('form').length,
      inputCount: document.querySelectorAll('input, select, textarea').length
    };
    
    return {
      success: true,
      data: {
        html: cleanedHTML,
        metadata: pageMetadata,
        stats: stats
      }
    };
    
  } catch (error) {
    console.error('Failed to extract page content:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Clean HTML content for AI analysis
function cleanHTMLForAI(html) {
  let cleaned = html;
  
  // Remove script tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove noscript tags
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  
  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove SVG content (can be large)
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  
  // Simplify attributes - keep only important ones
  cleaned = cleaned.replace(/\s+(class|id|name|type|placeholder|value|required|aria-label|aria-labelledby|for|role|data-[^=]+)=/g, ' $1=');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Estimate token count for content size control
function estimateTokenCount(text) {
  // Rough estimation: 1 token ≈ 4 characters for English, 1 token ≈ 1 character for Chinese
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - englishChars - chineseChars;
  
  return Math.ceil(englishChars / 4) + chineseChars + Math.ceil(otherChars / 2);
}

// Infer page type based on content and URL
function inferPageType() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = document.body.textContent.toLowerCase();
  
  // Check URL patterns
  if (url.includes('login') || url.includes('signin')) return 'login';
  if (url.includes('register') || url.includes('signup')) return 'registration';
  if (url.includes('contact')) return 'contact';
  if (url.includes('checkout') || url.includes('billing')) return 'checkout';
  if (url.includes('profile') || url.includes('account')) return 'profile';
  
  // Check title and content
  if (title.includes('login') || title.includes('sign in')) return 'login';
  if (title.includes('register') || title.includes('sign up')) return 'registration';
  if (title.includes('contact')) return 'contact';
  if (bodyText.includes('login') && bodyText.includes('password')) return 'login';
  if (bodyText.includes('register') && bodyText.includes('email')) return 'registration';
  
  return 'general';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}