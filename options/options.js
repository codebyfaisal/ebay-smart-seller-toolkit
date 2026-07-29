document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const downloadSubpath = document.getElementById('downloadSubpath');
  const defaultCurrency = document.getElementById('defaultCurrency');
  const ebaySite = document.getElementById('ebaySite');
  const autoOpenDashboard = document.getElementById('autoOpenDashboard');
  const enableImgDownload = document.getElementById('enableImgDownload');
  const enableSoldHistorySearch = document.getElementById('enableSoldHistorySearch');
  const enableSoldHistoryListing = document.getElementById('enableSoldHistoryListing');
  const enableSoldHistoryCarousel = document.getElementById('enableSoldHistoryCarousel');
  const enableSoldHistoryStore = document.getElementById('enableSoldHistoryStore');
  const enableActiveListingsIcon = document.getElementById('enableActiveListingsIcon');
  const enableAnalyticsSidebar = document.getElementById('enableAnalyticsSidebar');
  const enableSellerScraper = document.getElementById('enableSellerScraper');
  const saveBtn = document.getElementById('saveBtn');
  const closeBtn = document.getElementById('closeBtn');
  const statusAlert = document.getElementById('statusAlert');

  // Load Settings
  loadSettings();

  // --- Theme Sync ---
  window.ThemeManager.initTheme(null, true);

  // Attach Events
  saveBtn.addEventListener('click', saveSettings);
  closeBtn.addEventListener('click', () => {
    window.close();
  });

  const clearStorageBtn = document.getElementById('clearStorageBtn');
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear ALL extension storage?\n\nThis will permanently delete all saved sales orders, scanned history, and custom settings.")) {
        const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
        if (isExtension) {
          chrome.storage.local.clear(() => {
            if (chrome.storage.session) {
              chrome.storage.session.clear(() => {});
            }
            localStorage.clear();
            alert("All extension storage has been cleared successfully!");
            window.location.reload();
          });
        } else {
          localStorage.clear();
          alert("All local storage cleared!");
          window.location.reload();
        }
      }
    });
  }

  function loadSettings() {
    const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (isExtension) {
      chrome.storage.local.get({
        // Default configs
        downloadSubpath: 'ebay_orders',
        defaultCurrency: '£',
        ebaySite: 'ebay.co.uk',
        autoOpenDashboard: false,
        enableImgDownload: true,
        enableSoldHistorySearch: true,
        enableSoldHistoryListing: true,
        enableSoldHistoryCarousel: true,
        enableSoldHistoryStore: true,
        enableActiveListingsIcon: true,
        enableAnalyticsSidebar: true,
        enableSellerScraper: false
      }, (items) => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        downloadSubpath.value = items.downloadSubpath;
        defaultCurrency.value = items.defaultCurrency;
        ebaySite.value = items.ebaySite || 'ebay.co.uk';
        autoOpenDashboard.checked = items.autoOpenDashboard;
        
        if (enableImgDownload) enableImgDownload.checked = items.enableImgDownload;
        if (enableSoldHistorySearch) enableSoldHistorySearch.checked = items.enableSoldHistorySearch;
        if (enableSoldHistoryListing) enableSoldHistoryListing.checked = items.enableSoldHistoryListing;
        if (enableSoldHistoryCarousel) enableSoldHistoryCarousel.checked = items.enableSoldHistoryCarousel;
        if (enableSoldHistoryStore) enableSoldHistoryStore.checked = items.enableSoldHistoryStore;
        if (enableActiveListingsIcon) enableActiveListingsIcon.checked = items.enableActiveListingsIcon;
        if (enableAnalyticsSidebar) enableAnalyticsSidebar.checked = items.enableAnalyticsSidebar;
        if (enableSellerScraper) enableSellerScraper.checked = items.enableSellerScraper;
      });
    } else {
      // Mock mode
      downloadSubpath.value = localStorage.getItem('downloadSubpath') || 'ebay_orders';
      defaultCurrency.value = localStorage.getItem('defaultCurrency') || '£';
      ebaySite.value = localStorage.getItem('ebaySite') || 'ebay.co.uk';
      autoOpenDashboard.checked = localStorage.getItem('autoOpenDashboard') === 'true';
    }
  }

  function saveSettings() {
    // Basic sanitization
    let subpath = downloadSubpath.value.trim().replace(/\\/g, '/');
    if (subpath.startsWith('/')) subpath = subpath.substring(1);
    if (subpath.endsWith('/')) subpath = subpath.substring(0, subpath.length - 1);

    const config = {
      downloadSubpath: subpath,
      defaultCurrency: defaultCurrency.value,
      ebaySite: ebaySite.value,
      autoOpenDashboard: autoOpenDashboard.checked,
      enableImgDownload: enableImgDownload ? enableImgDownload.checked : true,
      enableSoldHistorySearch: enableSoldHistorySearch ? enableSoldHistorySearch.checked : true,
      enableSoldHistoryListing: enableSoldHistoryListing ? enableSoldHistoryListing.checked : true,
      enableSoldHistoryCarousel: enableSoldHistoryCarousel ? enableSoldHistoryCarousel.checked : true,
      enableSoldHistoryStore: enableSoldHistoryStore ? enableSoldHistoryStore.checked : true,
      enableActiveListingsIcon: enableActiveListingsIcon ? enableActiveListingsIcon.checked : true,
      enableAnalyticsSidebar: enableAnalyticsSidebar ? enableAnalyticsSidebar.checked : true,
      enableSellerScraper: enableSellerScraper ? enableSellerScraper.checked : false
    };

    const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (isExtension) {
      chrome.storage.local.set(config, () => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        showSuccessMessage();
      });
    } else {
      // Mock mode
      Object.entries(settings).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      showSuccessMessage();
    }
  }

  function showSuccessMessage() {
    statusAlert.style.display = 'block';
    setTimeout(() => {
      statusAlert.style.display = 'none';
    }, 2000);
  }
});
