// URL Cleaner - Content Script
// Runs on all pages to handle clipboard cleaning and UI feedback

// Track if we've shown the notification on this page
let notificationShown = false;

// Listen for copy events to clean clipboard
document.addEventListener('copy', (e) => {
  chrome.storage.sync.get(['enabled', 'cleanOnCopy'], (settings) => {
    if (!settings.enabled || !settings.cleanOnCopy) return;
    
    // Get selected text
    const selection = window.getSelection().toString().trim();
    
    // Check if selection looks like a URL
    if (selection && (selection.startsWith('http://') || selection.startsWith('https://'))) {
      chrome.runtime.sendMessage({ 
        action: 'cleanUrl', 
        url: selection 
      }, (result) => {
        if (result && result.cleaned) {
          // Replace clipboard with cleaned URL
          e.clipboardData.setData('text/plain', result.url);
          e.preventDefault();
          
          showNotification(`Cleaned ${result.removedCount} tracking parameters from copied link`);
        }
      });
    }
  });
});

// Show floating notification
function showNotification(message) {
  if (notificationShown) return;
  
  const div = document.createElement('div');
  div.id = 'url-cleaner-notification';
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    line-height: 1.4;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(div);
  notificationShown = true;
  
  // Remove after 3 seconds
  setTimeout(() => {
    div.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      div.remove();
      notificationShown = false;
    }, 300);
  }, 3000);
}

// Clean links on hover (show tooltip preview)
let hoverTooltip = null;

document.addEventListener('mouseover', (e) => {
  const link = e.target.closest('a');
  if (!link || !link.href) return;
  
  chrome.storage.sync.get(['enabled'], (settings) => {
    if (!settings.enabled) return;
    
    // Clean the URL
    chrome.runtime.sendMessage({ 
      action: 'cleanUrl', 
      url: link.href 
    }, (result) => {
      if (result && result.cleaned) {
        showHoverTooltip(link, result);
      }
    });
  });
});

function showHoverTooltip(link, result) {
  // Remove existing tooltip
  if (hoverTooltip) {
    hoverTooltip.remove();
  }
  
  // Create tooltip
  hoverTooltip = document.createElement('div');
  hoverTooltip.className = 'url-cleaner-tooltip';
  hoverTooltip.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">🧹 Clean Link Available</div>
    <div style="font-size: 12px; opacity: 0.9;">
      ${result.removedCount} tracking parameter${result.removedCount > 1 ? 's' : ''} removed
    </div>
    <div style="font-size: 11px; margin-top: 6px; opacity: 0.8; word-break: break-all;">
      ${result.removedParams.slice(0, 3).join(', ')}${result.removedParams.length > 3 ? '...' : ''}
    </div>
  `;
  
  hoverTooltip.style.cssText = `
    position: absolute;
    background: #1a73e8;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    z-index: 2147483646;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    pointer-events: none;
    animation: fadeIn 0.2s ease-out;
  `;
  
  // Position near the link
  const rect = link.getBoundingClientRect();
  hoverTooltip.style.left = `${rect.left + window.scrollX}px`;
  hoverTooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
  
  document.body.appendChild(hoverTooltip);
  
  // Remove when mouse leaves
  const removeTooltip = () => {
    if (hoverTooltip) {
      hoverTooltip.remove();
      hoverTooltip = null;
    }
    link.removeEventListener('mouseleave', removeTooltip);
  };
  
  link.addEventListener('mouseleave', removeTooltip);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    showNotification(request.message);
  }
});