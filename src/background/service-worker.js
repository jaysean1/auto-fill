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