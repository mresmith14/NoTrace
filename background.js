// URL Cleaner - Background Service Worker

importScripts('rules.js');

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  cleanOnCopy: true,
  cleanOnNavigate: true,
  showNotifications: true,
  aggressiveMode: false,
  customParams: [],
  whitelist: []
};

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set(DEFAULT_SETTINGS);
    console.log('URL Cleaner installed');
  }
});

// Clean URL function
function cleanUrl(urlString, settings = {}) {
  try {
    const url = new URL(urlString);
    
    // Check whitelist
    if (isWhitelisted(url.hostname, settings.whitelist)) {
      return { cleaned: false, url: urlString, reason: 'whitelisted' };
    }
    
    const originalParams = Array.from(url.searchParams.keys());
    let removedParams = [];
    
    // Check each parameter
    originalParams.forEach(param => {
      // Skip essential params
      if (ESSENTIAL_PARAMS.includes(param.toLowerCase())) {
        return;
      }
      
      // Check if parameter is tracking
      if (isTrackingParam(param, settings)) {
        url.searchParams.delete(param);
        removedParams.push(param);
      }
    });
    
    // Remove empty hash
    if (url.hash === '#') {
      url.hash = '';
    }
    
    const cleaned = removedParams.length > 0;
    
    return {
      cleaned,
      url: url.toString(),
      originalUrl: urlString,
      removedParams,
      removedCount: removedParams.length
    };
    
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return { cleaned: false, url: urlString, error: error.message };
  }
}

// Check if hostname is whitelisted
function isWhitelisted(hostname, customWhitelist = []) {
  const allWhitelist = [...SITE_WHITELIST, ...customWhitelist];
  return allWhitelist.some(site => 
    hostname === site || 
    hostname.endsWith('.' + site) ||
    site.endsWith('.' + hostname)
  );
}

// Check if parameter is a tracking parameter
function isTrackingParam(param, settings) {
  const lowerParam = param.toLowerCase();
  
  // Check exact matches
  if (TRACKING_PARAMS.includes(lowerParam)) {
    return true;
  }
  
  // Check custom params
  if (settings.customParams?.includes(lowerParam)) {
    return true;
  }
  
  // Check patterns (aggressive mode)
  if (settings.aggressiveMode) {
    return TRACKING_PATTERNS.some(pattern => pattern.test(lowerParam));
  }
  
  return false;
}

// Listen for web navigation to clean URLs before page loads
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  chrome.storage.sync.get(['enabled', 'cleanOnNavigate', 'aggressiveMode', 'customParams', 'whitelist'], (settings) => {
    if (!settings.enabled || !settings.cleanOnNavigate) return;
    
    const result = cleanUrl(details.url, settings);
    
    if (result.cleaned) {
      // Redirect to cleaned URL
      chrome.tabs.update(details.tabId, { url: result.url });
      
      // Store for popup display
      chrome.storage.local.set({
        lastCleaned: {
          original: result.originalUrl,
          cleaned: result.url,
          params: result.removedParams,
          count: result.removedCount,
          time: Date.now()
        }
      });
      
      // Show badge
      chrome.action.setBadgeText({ text: result.removedCount.toString(), tabId: details.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      
      // Clear badge after 3 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: details.tabId });
      }, 3000);
      
      console.log('URL cleaned:', result.removedParams.join(', '));
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });

// Handle context menu - Copy Clean Link
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyCleanLink') {
    chrome.storage.sync.get(['enabled', 'aggressiveMode', 'customParams', 'whitelist'], (settings) => {
      const result = cleanUrl(info.linkUrl || info.pageUrl, settings);
      
      // Copy to clipboard
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const div = document.createElement('div');
            div.textContent = 'Clean link copied!';
            div.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              padding: 12px 20px;
              border-radius: 4px;
              z-index: 999999;
              font-family: sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 2000);
          });
        },
        args: [result.url]
      });
    });
  }
});

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copyCleanLink',
    title: '🔗 Copy Clean Link (No Tracking)',
    contexts: ['link', 'page']
  });
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'cleanUrl') {
    chrome.storage.sync.get(['aggressiveMode', 'customParams', 'whitelist'], (settings) => {
      const result = cleanUrl(request.url, settings);
      sendResponse(result);
    });
    return true; // Async response
  }
  
  if (request.action === 'getLastCleaned') {
    chrome.storage.local.get('lastCleaned', (data) => {
      sendResponse(data.lastCleaned || null);
    });
    return true;
  }
  
  if (request.action === 'cleanClipboard') {
    // Clean URL in clipboard (if user copies from address bar)
    navigator.clipboard.readText().then(text => {
      if (text.startsWith('http')) {
        chrome.storage.sync.get(['aggressiveMode', 'customParams', 'whitelist'], (settings) => {
          const result = cleanUrl(text, settings);
          if (result.cleaned) {
            navigator.clipboard.writeText(result.url);
          }
        });
      }
    }).catch(err => {
      console.log('Clipboard access denied:', err);
    });
  }
});

// Clean URLs when user copies from address bar (optional feature)
// This requires clipboard permission and is handled in content.js for better UX