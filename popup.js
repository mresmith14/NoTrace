document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const elements = {
    enabledToggle: document.getElementById('enabled-toggle'),
    lastCleaned: document.getElementById('last-cleaned'),
    removedCount: document.getElementById('removed-count'),
    paramList: document.getElementById('param-list'),
    copyCleaned: document.getElementById('copy-cleaned'),
    currentUrl: document.getElementById('current-url'),
    cleanCurrent: document.getElementById('clean-current'),
    totalCleaned: document.getElementById('total-cleaned'),
    totalParams: document.getElementById('total-params'),
    cleanNavigate: document.getElementById('clean-navigate'),
    cleanCopy: document.getElementById('clean-copy'),
    aggressiveMode: document.getElementById('aggressive-mode'),
    showNotifications: document.getElementById('show-notifications'),
    customParam: document.getElementById('custom-param'),
    addParam: document.getElementById('add-param'),
    customParamsList: document.getElementById('custom-params-list'),
    viewLog: document.getElementById('view-log'),
    resetStats: document.getElementById('reset-stats'),
    logModal: document.getElementById('log-modal'),
    closeLog: document.getElementById('close-log'),
    logContent: document.getElementById('log-content')
  };

  // Load settings
  const settings = await chrome.storage.sync.get([
    'enabled', 'cleanOnNavigate', 'cleanOnCopy', 
    'aggressiveMode', 'showNotifications', 'customParams'
  ]);
  
  elements.enabledToggle.checked = settings.enabled !== false;
  elements.cleanNavigate.checked = settings.cleanOnNavigate !== false;
  elements.cleanCopy.checked = settings.cleanOnCopy !== false;
  elements.aggressiveMode.checked = settings.aggressiveMode || false;
  elements.showNotifications.checked = settings.showNotifications !== false;

  // Load stats
  const stats = await chrome.storage.local.get(['totalCleaned', 'totalParamsRemoved', 'activityLog']);
  elements.totalCleaned.textContent = stats.totalCleaned || 0;
  elements.totalParams.textContent = stats.totalParamsRemoved || 0;

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    elements.currentUrl.textContent = new URL(tab.url).hostname;
  }

  // Check for last cleaned
  const { lastCleaned } = await chrome.storage.local.get('lastCleaned');
  if (lastCleaned && Date.now() - lastCleaned.time < 300000) { // 5 minutes
    showLastCleaned(lastCleaned);
  }

  // Event listeners
  elements.enabledToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enabled: e.target.checked });
  });

  elements.cleanNavigate.addEventListener('change', (e) => {
    chrome.storage.sync.set({ cleanOnNavigate: e.target.checked });
  });

  elements.cleanCopy.addEventListener('change', (e) => {
    chrome.storage.sync.set({ cleanOnCopy: e.target.checked });
  });

  elements.aggressiveMode.addEventListener('change', (e) => {
    chrome.storage.sync.set({ aggressiveMode: e.target.checked });
  });

  elements.showNotifications.addEventListener('change', (e) => {
    chrome.storage.sync.set({ showNotifications: e.target.checked });
  });

  // Clean current page
  elements.cleanCurrent.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.runtime.sendMessage({ action: 'cleanUrl', url: tab.url }, (result) => {
      if (result.cleaned) {
        chrome.tabs.update(tab.id, { url: result.url });
        showLastCleaned(result);
        updateStats(result.removedCount);
      } else {
        alert('No tracking parameters found on this page!');
      }
    });
  });

  // Copy cleaned URL
  elements.copyCleaned.addEventListener('click', () => {
    chrome.storage.local.get('lastCleaned', (data) => {
      if (data.lastCleaned) {
        navigator.clipboard.writeText(data.lastCleaned.cleaned);
        elements.copyCleaned.textContent = 'Copied!';
        setTimeout(() => {
          elements.copyCleaned.textContent = 'Copy Clean URL';
        }, 1500);
      }
    });
  });

  // Custom params
  renderCustomParams(settings.customParams || []);

  elements.addParam.addEventListener('click', addCustomParam);
  elements.customParam.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCustomParam();
  });

  function addCustomParam() {
    const param = elements.customParam.value.trim().toLowerCase();
    if (!param) return;

    const customParams = settings.customParams || [];
    if (!customParams.includes(param)) {
      customParams.push(param);
      chrome.storage.sync.set({ customParams });
      renderCustomParams(customParams);
      elements.customParam.value = '';
    }
  }

  function renderCustomParams(params) {
    elements.customParamsList.innerHTML = params.map(param => `
      <span class="tag">
        ${param}
        <button class="tag-remove" data-param="${param}">×</button>
      </span>
    `).join('');

    elements.customParamsList.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const param = btn.dataset.param;
        const newParams = params.filter(p => p !== param);
        chrome.storage.sync.set({ customParams: newParams });
        renderCustomParams(newParams);
      });
    });
  }

  // Activity log
  elements.viewLog.addEventListener('click', () => {
    const log = stats.activityLog || [];
    if (log.length === 0) {
      elements.logContent.innerHTML = '<div class="empty">No activity yet</div>';
    } else {
      elements.logContent.innerHTML = log.slice(-50).reverse().map(entry => `
        <div class="log-entry">
          <div class="log-time">${new Date(entry.time).toLocaleTimeString()}</div>
          <div class="log-url">${new URL(entry.original).hostname}</div>
          <div class="log-cleaned">-${entry.count} params</div>
        </div>
      `).join('');
    }
    elements.logModal.classList.remove('hidden');
  });

  elements.closeLog.addEventListener('click', () => {
    elements.logModal.classList.add('hidden');
  });

  // Reset stats
  elements.resetStats.addEventListener('click', () => {
    if (confirm('Reset all statistics?')) {
      chrome.storage.local.set({ totalCleaned: 0, totalParamsRemoved: 0, activityLog: [] });
      elements.totalCleaned.textContent = '0';
      elements.totalParams.textContent = '0';
    }
  });

  // Helper functions
  function showLastCleaned(data) {
    elements.lastCleaned.classList.remove('hidden');
    elements.removedCount.textContent = data.removedCount || data.count;
    elements.paramList.innerHTML = (data.removedParams || data.params || [])
      .slice(0, 5)
      .map(p => `<span class="param-tag">${p}</span>`)
      .join('');
  }

  function updateStats(removedCount) {
    const newTotal = (parseInt(elements.totalCleaned.textContent) || 0) + 1;
    const newParams = (parseInt(elements.totalParams.textContent) || 0) + removedCount;
    
    elements.totalCleaned.textContent = newTotal;
    elements.totalParams.textContent = newParams;
    
    chrome.storage.local.set({ 
      totalCleaned: newTotal, 
      totalParamsRemoved: newParams 
    });

    // Add to activity log
    const log = stats.activityLog || [];
    log.push({
      time: Date.now(),
      original: tab.url,
      count: removedCount
    });
    chrome.storage.local.set({ activityLog: log.slice(-100) }); // Keep last 100
  }
});