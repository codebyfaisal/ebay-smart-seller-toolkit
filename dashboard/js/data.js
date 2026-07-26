import { state } from './dashboardState.js';
import * as dom from './dom.js';

export function handleSingleFileImport(e, onSuccess) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedDb = JSON.parse(event.target.result);
      if (typeof importedDb !== 'object' || importedDb === null) {
        throw new Error('Database file must contain a JSON object structure.');
      }
      dom.importFile.value = ''; // Reset input safely
      mergeSessionDatabase(importedDb, true, onSuccess);
    } catch (err) {
      dom.importFile.value = ''; // Reset input safely
      alert('Failed to import database JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

export function handleMultipleFilesImport(e, onSuccess) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  let filesProcessed = 0;
  const combinedDb = {};

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedDb = JSON.parse(event.target.result);
        if (typeof importedDb === 'object' && importedDb !== null) {
          Object.entries(importedDb).forEach(([dateStr, importedOrders]) => {
            if (!Array.isArray(importedOrders)) return;
            if (!combinedDb[dateStr]) {
              combinedDb[dateStr] = [];
            }
            // Merge avoiding duplicate orderIds inside the imported file list
            importedOrders.forEach(io => {
              if (!combinedDb[dateStr].some(eo => eo.orderId === io.orderId)) {
                combinedDb[dateStr].push(io);
              }
            });
          });
        }
      } catch (err) {
        console.error('File import error:', err);
      }

      filesProcessed++;
      if (filesProcessed === files.length) {
        dom.importFile.value = ''; // Reset input safely after all reads
        mergeSessionDatabase(combinedDb, true, onSuccess);
      }
    };
    reader.readAsText(file);
  });
}

export function mergeSessionDatabase(importedDb, clearFirst, onSuccess) {
  StorageHelper.get(['ebay_session_orders'], (result) => {
    const currentDb = clearFirst ? {} : (result.ebay_session_orders || {});
    let updatedCount = 0;
    let firstDetectedDateVal = '';

    Object.entries(importedDb).forEach(([dateStr, importedOrders]) => {
      if (!Array.isArray(importedOrders) || importedOrders.length === 0) return;

      const currentOrders = currentDb[dateStr] || [];
      const mergedOrders = [...currentOrders];

      importedOrders.forEach(io => {
        if (!mergedOrders.some(co => co.orderId === io.orderId)) {
          mergedOrders.push(io);
          updatedCount++;
        }
      });

      currentDb[dateStr] = mergedOrders;
    });
    
    // Find the latest date among all data to use as the evaluation date
    let latestTs = 0;
    let latestDateVal = '';
    
    Object.values(currentDb).forEach(orders => {
      if (orders && orders.length > 0 && orders[0].timestamp) {
        if (orders[0].timestamp > latestTs) {
          latestTs = orders[0].timestamp;
          const dateObj = new Date(latestTs);
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getDate()).padStart(2, '0');
          latestDateVal = `${yyyy}-${mm}-${dd}`;
        }
      }
    });

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
    StorageHelper.set({
      ebay_session_orders: currentDb,
      lastScanned: timestamp,
      data_source: 0
    }, () => {
      alert(`Successfully imported database! Added ${updatedCount} new unique orders.`);
      
      // Auto-switch date if detected
      if (latestDateVal) {
        state.dateQueryVal = latestDateVal;
        state.activeTargetDateStr = formatEbayDateString(state.dateQueryVal);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('date', state.dateQueryVal);
        // Remove empty mode if date is imported
        newUrl.searchParams.delete('mode');
        window.history.pushState(null, '', newUrl.toString());
      }

      // Auto-activate multi-day tab if we now have 3+ dates
      const datesCount = Object.keys(currentDb).length;
      if (datesCount >= 3) {
        state.activeTab = 'multi';
        dom.tabDailyGrid.className = 'btn btn-secondary';
        dom.tabMultiDay.className = 'btn btn-primary';
      }

      if (onSuccess) onSuccess();
    });
  });
}

export function openExportModal() {
  StorageHelper.get(['ebay_session_orders'], (result) => {
    const allSessionOrders = result.ebay_session_orders || {};
    const dates = Object.keys(allSessionOrders);

    if (dates.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Sort dates descending (newest first)
    dates.sort((a, b) => window.parseEbayDateToTimestamp(b) - window.parseEbayDateToTimestamp(a));

    // Clear and populate list
    dom.exportDatesList.innerHTML = '';
    dates.forEach(dateStr => {
      const ts = window.parseEbayDateToTimestamp(dateStr);
      const d = new Date(ts);
      const display = `${dateStr} (${d.getFullYear()})`;
      
      const count = allSessionOrders[dateStr].length;

      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; user-select: none; transition: background 0.2s;';
      
      label.onmouseenter = () => label.style.background = 'rgba(255,255,255,0.06)';
      label.onmouseleave = () => label.style.background = 'rgba(255,255,255,0.03)';

      // Sanitize dateStr for safety (though it's derived from keys, it's good practice)
      const safeDate = window.escapeHTML(dateStr);
      const safeDisplay = window.escapeHTML(display);

      label.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <input type="checkbox" value="${safeDate}" checked style="width: 16px; height: 16px; accent-color: #3b82f6;">
          <span style="font-size: 14px; font-weight: 500; color: var(--text-main);">${safeDisplay}</span>
        </div>
        <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 12px;">${count} orders</span>
      `;

      dom.exportDatesList.appendChild(label);
    });

    dom.exportModal.style.display = 'flex';
  });
}

export function executeSelectiveExport() {
  const checkboxes = dom.exportDatesList.querySelectorAll('input[type="checkbox"]:checked');
  const selectedDates = Array.from(checkboxes).map(cb => cb.value);

  if (selectedDates.length === 0) {
    alert("Please select at least one date.");
    return;
  }

  StorageHelper.get(['ebay_session_orders'], (result) => {
    const allSessionOrders = result.ebay_session_orders || {};
    const filteredOrders = {};
    
    selectedDates.forEach(d => {
      if (allSessionOrders[d]) {
        filteredOrders[d] = allSessionOrders[d];
      }
    });

    const jsonString = JSON.stringify(filteredOrders, null, 2);
    
    let filename = 'ebay-sales-export.json';
    if (selectedDates.length === 1) {
      const ts = window.parseEbayDateToTimestamp(selectedDates[0]);
      const d = new Date(ts);
      filename = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}.json`;
    } else {
      const sortedTs = selectedDates.map(d => window.parseEbayDateToTimestamp(d)).sort((a, b) => a - b);
      const d1 = new Date(sortedTs[0]);
      const d2 = new Date(sortedTs[sortedTs.length - 1]);
      filename = `${d1.getDate()}-${d1.getMonth()+1}-${d1.getFullYear()}--${d2.getDate()}-${d2.getMonth()+1}-${d2.getFullYear()}.json`;
    }

    const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.downloads;

    if (isExtension) {
      chrome.storage.local.get({ downloadSubpath: 'ebay_orders' }, (config) => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        const subpath = config.downloadSubpath;
        const finalPath = subpath ? `${subpath}/${filename}` : filename;
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({ url: url, filename: finalPath, conflictAction: 'overwrite', saveAs: true });
        dom.exportModal.style.display = 'none';
      });
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.click();
      URL.revokeObjectURL(url);
      dom.exportModal.style.display = 'none';
    }
  });
}
