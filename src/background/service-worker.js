// Background service worker for Smart Autofill Assistant

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Smart Autofill Assistant installed:', details.reason);
  
  // Set default settings
  if (details.reason === 'install') {
    chrome.storage.local.set({
      settings: {
        modelProvider: 'local',
        apiKey: '',
        autoAnalyze: true,
        debugMode: false
      },
      profiles: []
    });
  }
});

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// Handle messages from content script and sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'ANALYZE_PAGE':
      handlePageAnalysis(message.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'AUTOFILL_FORM':
      handleAutofill(message.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'GENERATE_FILL_DATA':
      handleGenerateFillData(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'SMART_ANALYZE_PAGE':
      handleSmartPageAnalysisWithTabId(message.data, sender)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'GET_PROFILES':
      getProfiles()
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'SAVE_PROFILE':
      saveProfile(message.data)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'DELETE_PROFILE':
      deleteProfile(message.data.name)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'GET_SETTINGS':
      getSettings()
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'SAVE_SETTINGS':
      saveSettings(message.data)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'GENERATE_SMART_FILL_DATA':
      handleGenerateSmartFillData(message.data)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});

// Page analysis handler
async function handlePageAnalysis(pageData, tabId) {
  try {
    console.log('Starting page analysis for tab:', tabId);
    console.log('Page data received:', pageData);
    
    const settings = await getSettings();
    console.log('Using settings:', settings);
    
    const analysisResult = await analyzePageWithAI(pageData, settings);
    console.log('Analysis completed successfully:', analysisResult);
    
    // Notify sidebar about analysis result
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_COMPLETE',
      data: analysisResult,
      tabId: tabId
    });
    
    return { success: true, data: analysisResult };
  } catch (error) {
    console.error('Page analysis failed:', error);
    throw error;
  }
}

// Autofill handler
async function handleAutofill(autofillData, tabId) {
  try {
    const { profileName, formFields } = autofillData;
    const profiles = await getProfiles();
    const profile = profiles.find(p => p.name === profileName);
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    const settings = await getSettings();
    const fillData = await generateFillData(profile, formFields, settings);
    
    // Send fill data to content script
    const result = await chrome.tabs.sendMessage(tabId, {
      type: 'FILL_FORM',
      data: fillData
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Autofill failed:', error);
    throw error;
  }
}

// Generate fill data handler
async function handleGenerateFillData(data) {
  try {
    console.log('Generating fill data for profile:', data.profile.name);
    console.log('Fields to fill:', data.fields.length);
    
    const settings = await getSettings();
    const fillData = await generateFillData(data.profile, data.fields, settings);
    
    console.log('Fill data generated successfully:', Object.keys(fillData).length, 'fields');
    return { success: true, data: fillData };
  } catch (error) {
    console.error('Generate fill data failed:', error);
    throw error;
  }
}

// Generate smart fill data handler - Enhanced version
async function handleGenerateSmartFillData(data) {
  try {
    console.log('Generating smart fill data for profile:', data.profile.name);
    console.log('Analysis result forms:', data.analysisResult.forms?.length || 0);
    
    const settings = await getSettings();
    const fillData = await generateSmartFillData(data.profile, data.analysisResult, settings);
    
    console.log('Smart fill data generated successfully:', Object.keys(fillData).length, 'fields');
    return fillData;
  } catch (error) {
    console.error('Generate smart fill data failed:', error);
    throw error;
  }
}

// Smart Fill - AI-powered page analysis handler
async function handleSmartPageAnalysis(pageContent, tabId) {
  try {
    console.log('=== Starting Smart Page Analysis ===');
    console.log('Tab ID:', tabId);
    console.log('Page content validation:', {
      hasPageContent: !!pageContent,
      pageContentType: typeof pageContent,
      hasStats: !!pageContent?.stats,
      hasMetadata: !!pageContent?.metadata,
      hasHtml: !!pageContent?.html
    });
    
    // Validate input parameters
    if (!pageContent) {
      throw new Error('pageContent parameter is required');
    }
    
    if (!tabId) {
      throw new Error('tabId parameter is required');
    }
    
    console.log('Page content stats:', pageContent.stats || 'No stats available');
    
    const settings = await getSettings();
    
    // Check if using remote AI model
    if (settings.modelProvider === 'local') {
      throw new Error('Smart Fill requires a remote AI model (Gemini, OpenAI, or Claude)');
    }
    
    // Validate API key
    if (!settings.apiKey) {
      throw new Error(`API key required for ${settings.modelProvider}`);
    }
    
    // Perform AI analysis
    const analysisResult = await analyzePageWithFullAI(pageContent, settings);
    
    console.log('Smart analysis completed successfully:', analysisResult);
    
    return { success: true, data: analysisResult };
    
  } catch (error) {
    console.error('Smart page analysis failed:', error);
    throw error;
  }
}

// Full page AI analysis using Gemini 2.5 Flash
async function analyzePageWithFullAI(pageContent, settings) {
  try {
    console.log('=== Starting Smart Page Analysis ===');
    console.log('AI Provider:', settings.modelProvider);
    console.log('Page content structure:', {
      hasMetadata: !!pageContent.metadata,
      hasStats: !!pageContent.stats,
      hasHtml: !!pageContent.html,
      htmlLength: pageContent.html?.length || 0
    });
    
    // Validate input parameters
    if (!pageContent) {
      throw new Error('pageContent is required');
    }
    
    if (!settings.apiKey) {
      throw new Error(`API key is required for ${settings.modelProvider}`);
    }
    
    const prompt = buildSmartAnalysisPrompt(pageContent);
    console.log('Generated prompt length:', prompt.length);
    
    let response;
    console.log('Calling AI API...');
    switch (settings.modelProvider) {
      case 'gemini':
        response = await callGeminiAPI(prompt, settings.apiKey);
        break;
      case 'openai':
        response = await callOpenAIAPI(prompt, settings.apiKey);
        break;
      case 'claude':
        response = await callClaudeAPI(prompt, settings.apiKey);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${settings.modelProvider}`);
    }
    
    console.log('AI response received, length:', response?.length || 0);
    console.log('AI response preview:', response?.substring(0, 200) + '...');
    
    // Parse and validate AI response
    const analysisResult = parseSmartAnalysisResponse(response);
    console.log('Analysis result parsed successfully:', {
      formsCount: analysisResult.forms?.length || 0,
      totalFields: analysisResult.forms?.reduce((sum, form) => sum + (form.fields?.length || 0), 0) || 0
    });
    
    return analysisResult;
    
  } catch (error) {
    console.error('=== Smart Page Analysis Failed ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Settings:', {
      modelProvider: settings.modelProvider,
      hasApiKey: !!settings.apiKey,
      apiKeyLength: settings.apiKey?.length || 0
    });
    throw error;
  }
}

// Build AI prompt for smart analysis
function buildSmartAnalysisPrompt(pageContent) {
  console.log('Building smart analysis prompt for pageContent:', {
    hasPageContent: !!pageContent,
    pageContentType: typeof pageContent,
    hasMetadata: !!pageContent?.metadata,
    hasHtml: !!pageContent?.html,
    hasStats: !!pageContent?.stats
  });
  
  // Validate pageContent structure
  if (!pageContent || typeof pageContent !== 'object') {
    throw new Error('Invalid pageContent: must be an object');
  }
  
  // Safely access metadata with fallback values
  const metadata = pageContent.metadata || {};
  const url = metadata.url || 'Unknown';
  const title = metadata.title || 'Unknown';
  const language = metadata.language || 'Unknown';
  const pageType = metadata.pageType || 'Unknown';
  
  console.log('Building smart analysis prompt with metadata:', { url, title, language, pageType });
  
  const htmlContent = pageContent.html ? pageContent.html.substring(0, 100000) : 'No HTML content available';
  
  return `# Advanced Web Form Analysis Task

## Page Context
- URL: ${url}
- Title: ${title}
- Language: ${language}
- Page Type: ${pageType}

## Analysis Instructions
You are an expert form analysis AI. Analyze the HTML content and identify ALL fillable form fields with high accuracy. Pay special attention to naming conventions and semantic meaning.

### Field Identification Strategy
1. Complete Coverage: Find EVERY input, select, textarea element
2. Smart Naming: Handle various naming conventions (camelCase, snake_case, kebab-case)
3. Semantic Inference: Use labels, placeholders, names, and context clues
4. Accurate Selectors: Generate reliable CSS selectors

### Enhanced Semantic Type Mapping
Names and Identity:
- "firstName", "fname", "first_name", "givenName" maps to "firstName"
- "lastName", "lname", "last_name", "surname", "familyName" maps to "lastName"
- "fullName", "name", "user_name", "userName", "displayName" maps to "fullName"

Contact Information:
- "email", "e-mail", "emailAddress", "user_mail", "contactEmail", "mail" maps to "email"
- "phone", "phoneNumber", "tel", "telephone", "mobile", "mobile_phone", "mobilePhone" maps to "phone"
- "website", "url", "homepage", "personal_website", "personalWebsite" maps to "website"

Location Information:
- "address", "streetAddress", "home_address", "homeAddress", "street" maps to "address"
- "city", "town", "locality" maps to "city"
- "state", "province", "region", "stateProvince" maps to "state"
- "zipCode", "zip", "postalCode", "postal_code", "postcode" maps to "zipCode"
- "country", "nation", "countryCode" maps to "country"

Professional Information:
- "company", "companyName", "organization", "employer" maps to "company"
- "jobTitle", "title", "position", "role", "job_title" maps to "jobTitle"

Personal Information:
- "birthDate", "dateOfBirth", "birthday", "birth_date", "dob" maps to "dateOfBirth"
- "password", "pwd", "pass" maps to "password"
- "confirmPassword", "confirm_password", "passwordConfirm", "repeatPassword" maps to "confirmPassword"

### Special Handling Rules
1. Underscore Convention: Convert snake_case to camelCase semantics
2. Multiple Similar Fields: Distinguish by context (e.g., "email" vs "contactEmail")
3. Mixed Languages: Handle English labels with confidence
4. Form Context: Use form titles and sections to improve accuracy

### CSS Selector Generation
Priority order for reliable selectors:
1. ID selector if available: #elementId
2. Name attribute if available: [name="elementName"]
3. Type with context: input[type="inputType"]
4. Form-scoped selector: form#formId input[name="fieldName"]

### Output Structure
Return ONLY valid JSON in this exact format:
{
  "success": true,
  "analysis": {
    "pageType": "registration",
    "confidence": 0.95,
    "forms": [
      {
        "type": "registration",
        "title": "User Registration Form",
        "description": "Sign up form",
        "fields": [
          {
            "selector": "#firstName",
            "semanticType": "firstName",
            "label": "First Name",
            "type": "text",
            "required": true,
            "placeholder": "Enter your first name",
            "confidence": 0.9
          }
        ]
      }
    ],
    "totalFields": 24
  }
}

### Quality Requirements
- High Coverage: Identify 95%+ of fillable fields
- Accurate Mapping: Match semantic types precisely
- Reliable Selectors: Ensure selectors work in browser
- Consistent Confidence: Use 0.9+ for clear matches, 0.7+ for likely matches
- Complete JSON: Valid, parseable JSON structure

### CRITICAL: Process ALL Fields
Do not skip fields due to complexity or uncertainty. For unclear fields, use the most appropriate semantic type from the list above or "unknown" as last resort.

## HTML Content to Analyze
${htmlContent}

IMPORTANT: Return complete analysis covering ALL form fields. Focus on accuracy and completeness.`;
}

// Parse AI response and validate structure with enhanced debugging
function parseSmartAnalysisResponse(response) {
  try {
    console.log('=== Parsing AI Response ===');
    console.log('Response type:', typeof response);
    console.log('Response length:', response?.length || 0);
    console.log('Response preview:', response?.substring(0, 200) + '...');
    
    if (!response || typeof response !== 'string') {
      console.error('❌ Invalid response type:', typeof response);
      throw new Error('Invalid response: must be a non-empty string');
    }
    
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response, full content:');
      console.error(response);
      throw new Error('No valid JSON found in AI response');
    }
    
    console.log('✅ JSON match found, length:', jsonMatch[0].length);
    console.log('JSON preview:', jsonMatch[0].substring(0, 300) + '...');
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ JSON parsed successfully, structure:', {
      keys: Object.keys(parsed),
      hasSuccess: !!parsed.success,
      hasAnalysis: !!parsed.analysis
    });
    
    // Validate structure
    if (!parsed.analysis || !Array.isArray(parsed.analysis.forms)) {
      console.error('❌ Invalid analysis structure:', {
        hasAnalysis: !!parsed.analysis,
        analysisType: typeof parsed.analysis,
        hasForms: !!parsed.analysis?.forms,
        formsType: typeof parsed.analysis?.forms,
        isFormsArray: Array.isArray(parsed.analysis?.forms),
        analysisKeys: parsed.analysis ? Object.keys(parsed.analysis) : 'N/A'
      });
      throw new Error('Invalid analysis structure: missing analysis.forms array');
    }
    
    console.log('📊 Analysis structure validation passed:', {
      formsCount: parsed.analysis.forms.length,
      totalFields: parsed.analysis.totalFields,
      confidence: parsed.analysis.confidence
    });
    
    // Enhanced field validation and cleaning
    let totalValidFields = 0;
    let totalInvalidFields = 0;
    
    parsed.analysis.forms.forEach((form, formIndex) => {
      console.log(`🔍 Processing form ${formIndex}:`, {
        type: form.type,
        title: form.title,
        hasFields: !!form.fields,
        fieldsType: typeof form.fields,
        isFieldsArray: Array.isArray(form.fields),
        fieldsLength: form.fields?.length || 0
      });
      
      if (!Array.isArray(form.fields)) {
        console.warn(`⚠️ Form ${formIndex} has invalid fields, resetting to empty array`);
        form.fields = [];
      }
      
      const originalFieldsCount = form.fields.length;
      const validFields = [];
      
      form.fields.forEach((field, fieldIndex) => {
        const isValid = field.selector && field.semanticType && field.semanticType !== 'unknown';
        const hasRequiredProps = field.selector && field.semanticType && field.type;
        
        console.log(`  Field ${fieldIndex}:`, {
          selector: field.selector,
          semanticType: field.semanticType,
          type: field.type,
          label: field.label,
          required: field.required,
          confidence: field.confidence,
          isValid: isValid,
          hasRequiredProps: hasRequiredProps
        });
        
        if (isValid && hasRequiredProps) {
          validFields.push(field);
          totalValidFields++;
        } else {
          console.warn(`❌ Filtering out invalid field:`, {
            reason: !field.selector ? 'missing selector' : 
                   !field.semanticType ? 'missing semanticType' : 
                   field.semanticType === 'unknown' ? 'semanticType is unknown' :
                   !field.type ? 'missing type' : 'other validation failure',
            field: field
          });
          totalInvalidFields++;
        }
      });
      
      form.fields = validFields;
      console.log(`📋 Form ${formIndex} field processing complete: ${originalFieldsCount} -> ${form.fields.length} valid fields`);
    });
    
    // Remove empty forms
    const originalFormsCount = parsed.analysis.forms.length;
    const validForms = parsed.analysis.forms.filter(form => form.fields.length > 0);
    parsed.analysis.forms = validForms;
    
    console.log('📈 Final validation summary:', {
      originalForms: originalFormsCount,
      validForms: parsed.analysis.forms.length,
      totalValidFields: totalValidFields,
      totalInvalidFields: totalInvalidFields,
      validationRate: totalValidFields > 0 ? (totalValidFields / (totalValidFields + totalInvalidFields) * 100).toFixed(1) + '%' : '0%'
    });
    
    // Update totalFields to reflect actual valid fields
    parsed.analysis.totalFields = totalValidFields;
    
    if (parsed.analysis.forms.length === 0) {
      console.error('❌ No valid forms found after processing');
      throw new Error('AI analysis resulted in no valid forms with fillable fields');
    }
    
    console.log('✅ AI response parsing completed successfully');
    return parsed.analysis;
    
  } catch (error) {
    console.error('❌ === Failed to parse AI response ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed - position:', error.message.match(/position (\d+)/)?.[1]);
      console.error('Character at error position:', response?.charAt(parseInt(error.message.match(/position (\d+)/)?.[1] || '0')));
    }
    console.error('Response debug info:', {
      length: response?.length || 0,
      firstLine: response?.split('\n')[0] || 'N/A',
      lastLine: response?.split('\n').slice(-1)[0] || 'N/A',
      containsJSON: response?.includes('{') && response?.includes('}')
    });
    console.error('Full response content:', response);
    throw new Error(`Invalid AI response format: ${error.message}`);
  }
}

// API call functions for different providers
async function callGeminiAPI(prompt, apiKey) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent';
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };
  
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAIAPI(prompt, apiKey) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  
  const requestBody = {
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a web form analysis expert. Analyze HTML content and return structured JSON data about form fields.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000
  };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaudeAPI(prompt, apiKey) {
  const endpoint = 'https://api.anthropic.com/v1/messages';
  
  const requestBody = {
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

// AI integration functions
async function analyzePageWithAI(pageData, settings) {
  console.log('Starting AI analysis with provider:', settings.modelProvider);
  
  const prompt = `Analyze the following HTML form structure and identify all form fields with their semantic meaning.

Form Data:
${JSON.stringify(pageData, null, 2)}

Return a JSON object with this exact structure (no additional text or formatting):
{
  "fields": [
    {
      "selector": "CSS selector for the field",
      "type": "input type (text, email, tel, etc.)",
      "semanticLabel": "semantic meaning (email, firstName, lastName, phone, address, etc.)",
      "placeholder": "placeholder text if any",
      "required": boolean,
      "confidence": number between 0-1
    }
  ],
  "formType": "detected form type (registration, login, checkout, etc.)",
  "confidence": number between 0-1
}`;

  if (settings.modelProvider === 'local') {
    console.log('Using local mock analysis');
    // For now, return mock data for local model
    return mockAnalysisResult(pageData);
  } else {
    console.log('Using remote AI analysis with prompt length:', prompt.length);
    return await callRemoteAI(prompt, settings);
  }
}

async function generateFillData(profile, formFields, settings) {
  const prompt = `Based on the user profile information and identified form fields, generate appropriate fill values.

User Profile:
Name: ${profile.name}
Info: ${profile.info}

Form Fields:
${JSON.stringify(formFields, null, 2)}

Return a JSON object with field selectors as keys and fill values as values (no additional text or formatting):
{
  "selector1": "fill value 1",
  "selector2": "fill value 2"
}

Only include fields that can be confidently filled based on the profile information.`;

  if (settings.modelProvider === 'local') {
    // For now, return mock data for local model
    return mockFillData(profile, formFields);
  } else {
    return await callRemoteAI(prompt, settings);
  }
}

async function callRemoteAI(prompt, settings) {
  const { modelProvider, apiKey } = settings;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }
  
  let apiUrl, headers, body;
  
  switch (modelProvider) {
    case 'gemini':
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
      body = JSON.stringify({
        contents: [{
          parts: [{
            text: prompt + "\n\nIMPORTANT: Return ONLY valid JSON without any additional text, markdown formatting, or code blocks."
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      });
      break;
      
    default:
      throw new Error(`Unsupported model provider: ${modelProvider}`);
  }
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: body
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (modelProvider === 'gemini') {
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Invalid API response:', result);
      throw new Error('Invalid API response format - no text content found');
    }
    
    // Clean up the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Extract JSON from the text if it's wrapped in other content
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    try {
      const parsedResult = JSON.parse(cleanedText);
      console.log('Successfully parsed AI response:', parsedResult);
      return parsedResult;
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', {
        originalText: text,
        cleanedText: cleanedText,
        error: error.message
      });
      
      // Fallback: try to extract JSON more aggressively
      try {
        // Look for the first { and last } to extract JSON
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const extractedJson = cleanedText.substring(firstBrace, lastBrace + 1);
          const fallbackResult = JSON.parse(extractedJson);
          console.log('Successfully parsed AI response with fallback method:', fallbackResult);
          return fallbackResult;
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError.message);
      }
      
      throw new Error(`Failed to parse AI response as JSON. Response was: "${text.substring(0, 200)}..."`);
    }
  }
}

// Enhanced personal information preprocessing for Smart Fill
function preprocessPersonalInfo(profile) {
  console.log('Preprocessing personal info for profile:', profile.name);
  
  const processedInfo = {
    original: profile.info,
    parsed: {}
  };
  
  const info = profile.info.toLowerCase();
  
  // Parse full name
  if (profile.name) {
    const nameParts = profile.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      processedInfo.parsed.firstName = nameParts[0];
      processedInfo.parsed.lastName = nameParts.slice(1).join(' ');
    }
    processedInfo.parsed.fullName = profile.name.trim();
  }
  
  // Extract email
  const emailMatch = profile.info.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    processedInfo.parsed.email = emailMatch[1];
  }
  
  // Extract phone number
  const phoneMatch = profile.info.match(/(\+?[\d\s\-\(\)]{10,})/);
  if (phoneMatch) {
    processedInfo.parsed.phone = phoneMatch[1].replace(/[\s\-\(\)]/g, '');
  }
  
  // Extract and parse address
  const addressMatch = profile.info.match(/(?:address?:?\s*)?(.+(?:Unit|Street|Road|Avenue|Drive|Lane|Way|Court|Place|NSW|VIC|QLD|SA|WA|TAS|NT|ACT).+?)(?:\n|$)/i);
  if (addressMatch) {
    const fullAddress = addressMatch[1].trim();
    processedInfo.parsed.address = fullAddress;
    
    // Try to extract city, state, zipcode from address
    const addressParts = fullAddress.split(',').map(part => part.trim());
    if (addressParts.length >= 3) {
      // Format: "Unit 308, 119 Ross Street (Eden), Glebe, NSW 2037, Australia"
      processedInfo.parsed.city = addressParts[addressParts.length - 3];
      
      const lastPart = addressParts[addressParts.length - 2];
      const stateZipMatch = lastPart.match(/(\w+)\s+(\d+)/);
      if (stateZipMatch) {
        processedInfo.parsed.state = stateZipMatch[1];
        processedInfo.parsed.zipCode = stateZipMatch[2];
      }
    }
  }
  
  // Extract birth date and convert formats
  const birthMatch = profile.info.match(/(?:birth\s*date?:?\s*)?(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/i);
  if (birthMatch) {
    const year = birthMatch[1];
    const month = birthMatch[2].padStart(2, '0');
    const day = birthMatch[3].padStart(2, '0');
    processedInfo.parsed.dateOfBirth = `${year}-${month}-${day}`;
  }
  
  // Extract country and map to country codes
  const countryMatch = profile.info.match(/(?:country:?\s*)?(china|australia|usa?|united\s+states|uk|united\s+kingdom|canada)/i);
  if (countryMatch) {
    const country = countryMatch[1].toLowerCase();
    const countryMap = {
      'china': 'CN',
      'australia': 'AU',
      'usa': 'US',
      'united states': 'US',
      'uk': 'UK',
      'united kingdom': 'UK',
      'canada': 'CA'
    };
    processedInfo.parsed.country = countryMap[country] || country;
  }
  
  // Extract website
  const websiteMatch = profile.info.match(/(https?:\/\/[^\s]+)/);
  if (websiteMatch) {
    processedInfo.parsed.website = websiteMatch[1];
  }
  
  console.log('Processed personal info:', processedInfo.parsed);
  return processedInfo;
}

// Generate fill data with enhanced personal info mapping
async function generateSmartFillData(profile, analysisResult, settings) {
  console.log('=== Generating Smart Fill Data ===');
  console.log('Profile:', profile.name);
  console.log('Analysis result forms:', analysisResult.forms?.length || 0);
  
  // Preprocess personal information
  const processedInfo = preprocessPersonalInfo(profile);
  
  const fillData = {};
  let fieldsProcessed = 0;
  let fieldsMatched = 0;
  
  // Process each form and field
  analysisResult.forms?.forEach((form, formIndex) => {
    console.log(`Processing form ${formIndex}: ${form.type} with ${form.fields?.length || 0} fields`);
    
    form.fields?.forEach((field, fieldIndex) => {
      fieldsProcessed++;
      const selector = field.selector;
      const semanticType = field.semanticType;
      
      console.log(`Field ${fieldIndex}: ${semanticType} (${selector})`);
      
      // Map semantic types to processed personal info
      let value = null;
      switch (semanticType) {
        case 'firstName':
          value = processedInfo.parsed.firstName;
          break;
        case 'lastName':
          value = processedInfo.parsed.lastName;
          break;
        case 'fullName':
          value = processedInfo.parsed.fullName;
          break;
        case 'email':
          value = processedInfo.parsed.email;
          break;
        case 'phone':
          value = processedInfo.parsed.phone;
          break;
        case 'address':
          value = processedInfo.parsed.address;
          break;
        case 'city':
          value = processedInfo.parsed.city;
          break;
        case 'state':
          value = processedInfo.parsed.state;
          break;
        case 'zipCode':
          value = processedInfo.parsed.zipCode;
          break;
        case 'country':
          value = processedInfo.parsed.country;
          break;
        case 'dateOfBirth':
          value = processedInfo.parsed.dateOfBirth;
          break;
        case 'website':
          value = processedInfo.parsed.website;
          break;
        case 'password':
          // For demo purposes, use a default password
          value = 'Demo123!';
          break;
        case 'confirmPassword':
          // For demo purposes, use the same default password
          value = 'Demo123!';
          break;
        default:
          console.log(`Unhandled semantic type: ${semanticType}`);
          break;
      }
      
      if (value && value.trim()) {
        fillData[selector] = value.trim();
        fieldsMatched++;
        console.log(`✅ Mapped ${semanticType} → "${value}"`);
      } else {
        console.log(`❌ No value found for ${semanticType}`);
      }
    });
  });
  
  console.log(`Fill data generation complete: ${fieldsMatched}/${fieldsProcessed} fields matched`);
  console.log('Final fill data:', fillData);
  
  return fillData;
}

// Mock functions for local development
function mockAnalysisResult(pageData) {
  const fields = [];
  
  // Simple heuristic analysis for demo
  pageData.forms?.forEach(form => {
    form.fields?.forEach(field => {
      let semanticLabel = 'unknown';
      const name = field.name?.toLowerCase() || '';
      const placeholder = field.placeholder?.toLowerCase() || '';
      const type = field.type || 'text';
      
      if (type === 'email' || name.includes('email') || placeholder.includes('email')) {
        semanticLabel = 'email';
      } else if (name.includes('name') || placeholder.includes('name')) {
        if (name.includes('first') || placeholder.includes('first')) {
          semanticLabel = 'firstName';
        } else if (name.includes('last') || placeholder.includes('last')) {
          semanticLabel = 'lastName';
        } else {
          semanticLabel = 'fullName';
        }
      } else if (type === 'tel' || name.includes('phone') || placeholder.includes('phone')) {
        semanticLabel = 'phone';
      } else if (name.includes('address') || placeholder.includes('address')) {
        semanticLabel = 'address';
      }
      
      fields.push({
        selector: field.selector,
        type: type,
        semanticLabel: semanticLabel,
        placeholder: field.placeholder || '',
        required: field.required || false,
        confidence: semanticLabel !== 'unknown' ? 0.8 : 0.3
      });
    });
  });
  
  return {
    fields: fields,
    formType: 'general',
    confidence: 0.7
  };
}

function mockFillData(profile, formFields) {
  const fillData = {};
  const info = profile.info.toLowerCase();
  
  formFields.forEach(field => {
    switch (field.semanticLabel) {
      case 'email':
        const emailMatch = profile.info.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          fillData[field.selector] = emailMatch[1];
        }
        break;
        
      case 'firstName':
        // Extract first name from Chinese or English names
        if (info.includes('我叫')) {
          const nameMatch = info.match(/我叫([^，,。\s]+)/);
          if (nameMatch) {
            fillData[field.selector] = nameMatch[1];
          }
        }
        break;
        
      case 'fullName':
        if (info.includes('我叫')) {
          const nameMatch = info.match(/我叫([^，,。\s]+)/);
          if (nameMatch) {
            fillData[field.selector] = nameMatch[1];
          }
        } else if (info.includes('叫')) {
          const nameMatch = info.match(/叫([^，,。\s]+)/);
          if (nameMatch) {
            fillData[field.selector] = nameMatch[1];
          }
        }
        break;
        
      case 'phone':
        const phoneMatch = profile.info.match(/(\+?[\d\s\-\(\)]{10,})/);
        if (phoneMatch) {
          fillData[field.selector] = phoneMatch[1].replace(/\s/g, '');
        }
        break;
        
      case 'address':
        // Look for address patterns
        const addressMatch = profile.info.match(/(Unit \d+[^,]*,[^,]*,[^,]*)/i) || 
                            profile.info.match(/([^,]*街[^,]*)/);
        if (addressMatch) {
          fillData[field.selector] = addressMatch[1];
        }
        break;
    }
  });
  
  return fillData;
}

// Storage functions
async function getProfiles() {
  const result = await chrome.storage.local.get(['profiles']);
  return result.profiles || [];
}

async function saveProfile(profile) {
  const profiles = await getProfiles();
  const existingIndex = profiles.findIndex(p => p.name === profile.name);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  await chrome.storage.local.set({ profiles });
  return { success: true };
}

async function deleteProfile(name) {
  const profiles = await getProfiles();
  const filteredProfiles = profiles.filter(p => p.name !== name);
  await chrome.storage.local.set({ profiles: filteredProfiles });
  return { success: true };
}

async function getSettings() {
  const result = await chrome.storage.local.get(['settings']);
  return result.settings || {
    modelProvider: 'local',
    apiKey: '',
    autoAnalyze: true,
    debugMode: false
  };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
  return { success: true };
}

// Helper function to get current active tab ID
async function getCurrentActiveTabId() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      return tabs[0].id;
    }
    throw new Error('No active tab found');
  } catch (error) {
    console.error('Failed to get current active tab:', error);
    throw error;
  }
}

// Wrapper function to handle tabId resolution for Smart Fill
async function handleSmartPageAnalysisWithTabId(pageContent, sender) {
  try {
    console.log('=== Smart Page Analysis Started ===');
    console.log('Sender info:', {
      hasTab: !!sender.tab,
      tabId: sender.tab?.id,
      url: sender.tab?.url,
      origin: sender.origin,
      senderType: sender.tab ? 'content_script' : 'extension_page'
    });
    
    // Get tab ID from sender if available (content script), otherwise get current active tab (sidebar)
    let tabId;
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id;
      console.log('✅ Using tab ID from sender:', tabId);
    } else {
      console.log('⚠️ No sender.tab found, getting current active tab...');
      tabId = await getCurrentActiveTabId();
      console.log('✅ Using current active tab ID:', tabId);
    }
    
    console.log('📄 Page content summary:', {
      hasContent: !!pageContent,
      htmlLength: pageContent?.html?.length || 0,
      hasMetadata: !!pageContent?.metadata,
      hasStats: !!pageContent?.stats
    });
    
    const result = await handleSmartPageAnalysis(pageContent, tabId);
    console.log('✅ Smart Page Analysis completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Smart Page Analysis failed:', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    throw error;
  }
}