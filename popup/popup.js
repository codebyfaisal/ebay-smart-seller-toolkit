document.addEventListener('DOMContentLoaded', () => {
  const isExtension = typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query;

  // DOM Elements
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const openActiveDashboardBtn = document.getElementById('openActiveDashboardBtn');
  const settingsLink = document.getElementById('settingsLink');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const progressLog = document.getElementById('progressLog');
  const totalSalesMetric = document.getElementById('totalSalesMetric');
  const lastScannedText = document.getElementById('lastScannedText');
  const themeToggleBtn = document.getElementById('themeToggleBtnPopup');
  const themeIcon = document.getElementById('themeIconPopup');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => window.ThemeManager.toggleTheme(themeIcon, false));
  }
  
  window.ThemeManager.initTheme(themeIcon, false);
  // ------------------------

  // Initialize Date Input to Today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  
  // Initialize
  popupInit();

  function popupInit() {
    if (isExtension) {
      checkActiveTab();
      updateLastScanned();
    } else {
      setStatus('Mock Mode (Local Preview)', 'active');
      analyzeBtn.disabled = false;
      updateLastScanned();
    }

    // Attach Event Listeners
    analyzeBtn.addEventListener('click', () => {
      if (isExtension) {
        scanCurrentPage();
      } else {
        runMockScan();
      }
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all scraped order data from the current session database?')) {
        clearSession();
      }
    });

    openActiveDashboardBtn.addEventListener('click', () => {
      if (isExtension) {
        chrome.tabs.create({
          url: chrome.runtime.getURL(`dashboard/dashboard.html`)
        });
      } else {
        alert(`Opening simulation: dashboard/dashboard.html\n(In browser, open dashboard.html manually)`);
      }
    });

    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (isExtension) {
        chrome.runtime.openOptionsPage();
      } else {
        alert('Opening settings: options.html\n(In browser, open options.html manually)');
      }
    });
  }

  // --- Connection Status ---

  function checkActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];
      const url = tab.url || '';

      const isOrdersPage = url.includes('ebay.com/sh/ord') || 
                           url.includes('ebay.co.uk/sh/ord') ||
                           url.includes('ebay.com.au/sh/ord') ||
                           url.includes('ebay.ca/sh/ord') ||
                           url.includes('ebay.de/sh/ord') ||
                           url.includes('ebay.fr/sh/ord') ||
                           url.includes('ebay.it/sh/ord') ||
                           url.includes('ebay.es/sh/ord');

      if (isOrdersPage) {
        setStatus('Ready to scan', 'active');
        analyzeBtn.disabled = false;
      } else {
        setStatus('Not on eBay Orders', 'inactive');
        analyzeBtn.disabled = true;

        const isExtensionLocal = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
        if (isExtensionLocal) {
          chrome.storage.local.get({ ebaySite: 'ebay.co.uk' }, (config) => {
            if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
            const domain = window.escapeHTML(config.ebaySite || 'ebay.co.uk');
            progressLog.innerHTML = `Please open your <a href="https://www.${domain}/sh/ord" target="_blank" style="color: var(--text-accent); text-decoration: underline;">eBay Seller Hub</a> page to scan.`;
          });
        } else {
          const domain = window.escapeHTML(localStorage.getItem('ebaySite') || 'ebay.co.uk');
          progressLog.innerHTML = `Please open your <a href="https://www.${domain}/sh/ord" target="_blank" style="color: var(--text-accent); text-decoration: underline;">eBay Seller Hub</a> page to scan.`;
        }
      }
    });
  }

  function setStatus(text, type) {
    statusText.textContent = text;
    statusBadge.className = 'status-badge';
    if (type === 'active') {
      statusBadge.classList.add('active');
    }
  }

  // --- Storage & Rendering Updates ---

  function updateLastScanned() {
    StorageHelper.get(['ebay_session_orders', 'lastScanned'], (result) => {
      // Calculate total sales count
      const allSessionOrders = result.ebay_session_orders || {};
      let totalCount = 0;
      Object.values(allSessionOrders).forEach(ordersArray => {
        totalCount += ordersArray.length;
      });
      totalSalesMetric.textContent = totalCount;

      if (result.lastScanned) {
        lastScannedText.textContent = `Scanned: ${result.lastScanned}`;
      } else {
        lastScannedText.textContent = 'Not scanned recently';
      }
    });
  }

  function clearSession() {
    StorageHelper.set({ ebay_session_orders: {}, lastScanned: '' }, () => {
      updateLastScanned();
      progressLog.textContent = 'Session cleared successfully.';
    });
  }

  // --- Single Page Scanner ---

  function scanCurrentPage() {
    analyzeBtn.disabled = true;
    progressLog.textContent = `Scanning current page...`;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapePageOrders // Injected scraper function below
      }, (results) => {
        analyzeBtn.disabled = false;

        if (chrome.runtime.lastError) {
          progressLog.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }

        if (results && results[0] && results[0].result) {
          const pageData = results[0].result;
          processPageScan(pageData.orders || []);
        } else {
          progressLog.textContent = 'Failed to extract data from current page.';
        }
      });
    });
  }

  function processPageScan(pageOrders) {
    // 1. Convert scanned dates to timestamps & filter matching target date
    const parsedPageOrders = pageOrders.map(o => {
      const ts = parseEbayDateToTimestamp(o.dateStr);
      return {
        orderId: o.orderNumber,
        sku: o.sku || '',
        title: o.title || '',
        imageUrl: o.imageUrl || '',
        itemId: o.itemId || '',
        dateStr: o.dateStr || '',
        timeStr: o.timeStr || '',
        timestamp: ts,
        priceText: o.priceText || '',
        quantity: o.quantity || 1
      };
    });

    if (parsedPageOrders.length === 0) {
      progressLog.textContent = `Scanned current page. Found 0 orders.`;
      return;
    }

    // 2. Fetch existing session database, merge new orders
    StorageHelper.get(['ebay_session_orders', 'data_source'], (result) => {
      let allSessionOrders = result.ebay_session_orders || {};
      
      // If previous data was imported (0), clear it so scrape starts fresh
      if (result.data_source === 0) {
        allSessionOrders = {};
      }
      
      let addedCount = 0;
      let updatedCount = 0;

      parsedPageOrders.forEach(mo => {
        if (!allSessionOrders[mo.dateStr]) {
          allSessionOrders[mo.dateStr] = [];
        }
        
        const mergedOrders = allSessionOrders[mo.dateStr];
        
        // Cleanup old unsplit versions of this order if they exist
        if (mo.orderId.includes('---')) {
          const baseOrderId = mo.orderId.split('---')[0];
          const unsplitIdx = mergedOrders.findIndex(eo => eo.orderId === baseOrderId);
          if (unsplitIdx !== -1) {
            mergedOrders.splice(unsplitIdx, 1);
          }
        }

        const existingIdx = mergedOrders.findIndex(eo => eo.orderId === mo.orderId);
        if (existingIdx !== -1) {
          mergedOrders[existingIdx] = mo;
          updatedCount++;
        } else {
          mergedOrders.push(mo);
          addedCount++;
        }
      });

      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();

      // 3. Save back to session storage
      StorageHelper.set({
        ebay_session_orders: allSessionOrders,
        lastScanned: timestampStr,
        data_source: 1
      }, () => {
        updateLastScanned();
        progressLog.textContent = `Scanned current page. Added ${addedCount}, updated ${updatedCount} orders across multiple dates.`;
      });
    });
  }

  // --- Content Scraper Script ---
  // Injected directly in page context
  function scrapePageOrders() {
    const rows = document.querySelectorAll('tr.order-info');
    const ordersList = [];

    rows.forEach(row => {
      try {
        const checkbox = row.querySelector('input.checkbox__control');
        const baseOrderNumber = checkbox ? checkbox.getAttribute('data-ordernumber') : null;
        if (!baseOrderNumber) return;

        const buyerId = checkbox ? checkbox.getAttribute('data-buyer-id') : '';

        // Collect all item detail elements from this row and subsequent sibling rows belonging to this order
        let itemElements = Array.from(row.querySelectorAll('.purchase-details'));
        let nextRow = row.nextElementSibling;
        while (nextRow && !nextRow.classList.contains('order-info')) {
          const siblingItems = nextRow.querySelectorAll('.purchase-details');
          if (siblingItems.length > 0) {
            itemElements = itemElements.concat(Array.from(siblingItems));
          }
          nextRow = nextRow.nextElementSibling;
        }

        if (itemElements.length > 1) {
          // Multi-item order: split into separate items
          let qtyEls = Array.from(row.querySelectorAll('.quantity strong') || []);
          let priceEls = Array.from(row.querySelectorAll('.price-column-item')).filter(el => /[\d]/.test(el.textContent));

          // Also collect quantities and prices from sibling rows
          let siblingRow = row.nextElementSibling;
          while (siblingRow && !siblingRow.classList.contains('order-info')) {
            const siblingQties = siblingRow.querySelectorAll('.quantity strong');
            if (siblingQties.length > 0) {
              qtyEls = qtyEls.concat(Array.from(siblingQties));
            }
            const siblingPrices = Array.from(siblingRow.querySelectorAll('.price-column-item')).filter(el => /[\d]/.test(el.textContent));
            if (siblingPrices.length > 0) {
              priceEls = priceEls.concat(siblingPrices);
            }
            siblingRow = siblingRow.nextElementSibling;
          }

          // Extract the aggregate order total from the main row for accurate revenue grouping
          const totalOrderPriceEl = row.querySelector('.total-price');
          const orderTotalText = totalOrderPriceEl ? totalOrderPriceEl.textContent.trim() : '£0.00';

          itemElements.forEach((itemEl, idx) => {

            const orderNumber = `${baseOrderNumber}---item${idx + 1}`;
            
            // Quantity for this specific item
            let quantity = 1;
            if (qtyEls[idx]) {
              quantity = parseInt(qtyEls[idx].textContent.trim(), 10) || 1;
            }

            // Price for this specific item
            let priceText = '£0.00';
            if (priceEls[idx]) {
              priceText = priceEls[idx].textContent.trim();
            } else {
              // Fallback to row total if item-level price is missing
              const totalEl = row.querySelector('.total-price');
              if (totalEl) priceText = totalEl.textContent.trim();
            }

            const currencySymbol = priceText.replace(/[\d.,\s-]/g, '').charAt(0) || '£';
            let cleanText = priceText.replace(/[^\d.,]/g, '');
            const lastComma = cleanText.lastIndexOf(',');
            const lastDot = cleanText.lastIndexOf('.');
            if (lastComma > lastDot) {
              cleanText = cleanText.replace(/\./g, '').replace(',', '.');
            } else {
              cleanText = cleanText.replace(/,/g, '');
            }
            const priceValue = parseFloat(cleanText) || 0;

            // Date & Time
            const dateCells = row.querySelectorAll('td.date-column');
            let dateStr = '';
            let timeStr = '';
            if (dateCells.length > 0) {
              const spans = dateCells[0].querySelectorAll('span.sh-default');
              if (spans.length >= 1) {
                dateStr = spans[0].textContent.trim();
                if (spans.length >= 2) {
                  timeStr = spans[1].textContent.trim();
                }
              } else {
                dateStr = dateCells[0].textContent.trim();
              }
            }

            // Title
            const titleEl = itemEl.querySelector('.item-title a') || itemEl.querySelector('.item-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            // Item ID
            const itemIdEl = itemEl.querySelector('.item-itemID');
            const itemId = itemIdEl ? itemIdEl.textContent.trim() : '';

            // SKU
            const skuEl = itemEl.querySelector('.item-custom-sku .sh-bold');
            const sku = skuEl ? skuEl.textContent.trim() : '';

            // Image
            let imageUrl = '';
            const parentDetails = itemEl.closest('.order-purchase-details');
            if (parentDetails) {
              const imgEl = parentDetails.querySelector('img');
              if (imgEl) imageUrl = imgEl.src;
            } else if (itemEl.previousElementSibling && itemEl.previousElementSibling.querySelector('img')) {
              imageUrl = itemEl.previousElementSibling.querySelector('img').src;
            }

            ordersList.push({
              orderNumber,
              buyerId,
              quantity,
              priceText,
              priceValue,
              currencySymbol,
              dateStr,
              timeStr,
              title,
              itemId,
              sku,
              imageUrl,
              orderTotalText
            });
          });
        } else {
          // Single item order (standard flow)

          const orderNumber = baseOrderNumber;

          // Quantity
          const qtyEl = row.querySelector('.quantity strong') || row.querySelector('.quantity span strong');
          let quantity = 1;
          if (checkbox && checkbox.getAttribute('data-quantity')) {
            quantity = parseInt(checkbox.getAttribute('data-quantity'), 10) || 1;
          } else if (qtyEl) {
            quantity = parseInt(qtyEl.textContent.trim(), 10) || 1;
          }

          // Price
          const priceEl = row.querySelector('.total-price') || row.querySelector('.price-column-item');
          const priceText = priceEl ? priceEl.textContent.trim() : '£0.00';
          const orderTotalText = priceText; // For single items, the total is just the price

          const currencySymbol = priceText.replace(/[\d.,\s-]/g, '').charAt(0) || '£';
          let cleanText = priceText.replace(/[^\d.,]/g, '');
          const lastComma = cleanText.lastIndexOf(',');
          const lastDot = cleanText.lastIndexOf('.');
          if (lastComma > lastDot) {
            cleanText = cleanText.replace(/\./g, '').replace(',', '.');
          } else {
            cleanText = cleanText.replace(/,/g, '');
          }
          const priceValue = parseFloat(cleanText) || 0;

          // Date & Time
          const dateCells = row.querySelectorAll('td.date-column');
          let dateStr = '';
          let timeStr = '';
          if (dateCells.length > 0) {
            const spans = dateCells[0].querySelectorAll('span.sh-default');
            if (spans.length >= 1) {
              dateStr = spans[0].textContent.trim();
              if (spans.length >= 2) {
                timeStr = spans[1].textContent.trim();
              }
            } else {
              dateStr = dateCells[0].textContent.trim();
            }
          }

          // Item Details
          const titleEl = row.querySelector('.purchase-details .item-title a') || row.querySelector('.purchase-details .item-title');
          const title = titleEl ? titleEl.textContent.trim() : '';

          const itemIdEl = row.querySelector('.purchase-details .item-itemID');
          const itemId = itemIdEl ? itemIdEl.textContent.trim() : '';

          const skuEl = row.querySelector('.purchase-details .item-custom-sku .sh-bold');
          const sku = skuEl ? skuEl.textContent.trim() : '';

          // Image
          const imgEl = row.querySelector('.order-purchase-details img') || row.querySelector('.orders-image-control img') || row.querySelector('img');
          const imageUrl = imgEl ? imgEl.src : '';

          ordersList.push({
            orderNumber,
            buyerId,
            quantity,
            priceText,
            priceValue,
            currencySymbol,
            dateStr,
            timeStr,
            title,
            itemId,
            sku,
            imageUrl,
            orderTotalText
          });
        }
      } catch (e) {
        console.error('Row parse error:', e);
      }
    });

    return {
      orders: ordersList
    };
  }

  // --- Mock Mode Scanning ---

  function runMockScan() {
    analyzeBtn.disabled = true;
    progressLog.textContent = `Scanning current page (Mock)...`;

    setTimeout(() => {
      analyzeBtn.disabled = false;
      processMockPageScan(MOCK_ORDERS_POOL);
    }, 800);
  }

  function processMockPageScan(mockPageOrders) {
    const parsedMockOrders = mockPageOrders.map(mo => {
      return {
        orderId: mo.orderNumber,
        sku: mo.sku || '',
        title: mo.title || '',
        imageUrl: mo.imageUrl || '',
        itemId: mo.itemId || '',
        dateStr: mo.dateStr || '',
        timeStr: mo.timeStr || '',
        timestamp: parseEbayDateToTimestamp(mo.dateStr),
        priceText: mo.priceText || `${mo.currencySymbol}${mo.priceValue.toFixed(2)}`,
        quantity: mo.quantity || 1
      };
    });

    StorageHelper.get(['ebay_session_orders', 'data_source'], (result) => {
      let allSessionOrders = result.ebay_session_orders || {};
      
      // If previous data was imported (0), clear it so scrape starts fresh
      if (result.data_source === 0) {
        allSessionOrders = {};
      }
      
      let addedCount = 0;
      let updatedCount = 0;

      parsedMockOrders.forEach(mo => {
        if (!allSessionOrders[mo.dateStr]) {
          allSessionOrders[mo.dateStr] = [];
        }
        
        const mergedOrders = allSessionOrders[mo.dateStr];
        
        // Cleanup old unsplit versions of this order if they exist
        if (mo.orderId.includes('---')) {
          const baseOrderId = mo.orderId.split('---')[0];
          const unsplitIdx = mergedOrders.findIndex(eo => eo.orderId === baseOrderId);
          if (unsplitIdx !== -1) {
            mergedOrders.splice(unsplitIdx, 1);
          }
        }

        const existingIdx = mergedOrders.findIndex(eo => eo.orderId === mo.orderId);
        
        if (existingIdx !== -1) {
          mergedOrders[existingIdx] = mo; // OVERWRITE / UPDATE
          updatedCount++;
        } else {
          mergedOrders.push(mo); // APPEND NEW
          addedCount++;
        }
      });

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();

      StorageHelper.set({
        ebay_session_orders: allSessionOrders,
        lastScanned: timestamp,
        data_source: 1
      }, () => {
        updateLastScanned();
        progressLog.textContent = `Scanned current page (Mock). Added ${addedCount}, updated ${updatedCount} orders across multiple dates.`;
      });
    });
  }

  // --- Tab Switching Logic ---
  const tabScraperBtn = document.getElementById('tabScraperBtn');
  const tabToolsBtn = document.getElementById('tabToolsBtn');
  const scraperView = document.getElementById('scraperView');
  const toolsView = document.getElementById('toolsView');

  if (tabScraperBtn && tabToolsBtn) {
    tabScraperBtn.addEventListener('click', () => {
      scraperView.style.display = 'block';
      toolsView.style.display = 'none';
      tabScraperBtn.style.borderBottomColor = '#3b82f6';
      tabScraperBtn.style.color = 'var(--text-main)';
      tabToolsBtn.style.borderBottomColor = 'transparent';
      tabToolsBtn.style.color = 'var(--text-muted)';
    });

    tabToolsBtn.addEventListener('click', () => {
      scraperView.style.display = 'none';
      toolsView.style.display = 'block';
      tabToolsBtn.style.borderBottomColor = '#3b82f6';
      tabToolsBtn.style.color = 'var(--text-main)';
      tabScraperBtn.style.borderBottomColor = 'transparent';
      tabScraperBtn.style.color = 'var(--text-muted)';
    });

    if (isExtension) {
      chrome.storage.local.get({ enableSellerScraper: false }, (items) => {
        if (items.enableSellerScraper === false) {
          tabScraperBtn.style.display = 'none';
          tabToolsBtn.click();
        } else {
          tabScraperBtn.style.display = 'block';
        }
      });
    }
  }

});
