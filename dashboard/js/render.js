import { state } from './dashboardState.js';
import * as dom from './dom.js';
import { analyzeProducts } from './analyzer.js';
import { renderAnalyzerDashboard } from './render-analyzer.js';
import { updateDailyMetricsCards, resetDailyMetricsCards, updateAnalyzerMetaCards, resetAnalyzerMetaCards } from './components/cards.js';
import { renderDailyGridRows } from './components/tables.js';

export function loadAndRenderDashboard(targetDateStr) {
  const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  if (isExtension) {
    chrome.storage.local.get({
      ebaySite: 'ebay.co.uk'
    }, (config) => {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
      const ebaySiteDomain = config.ebaySite || 'ebay.co.uk';
      processDashboardRender(targetDateStr, ebaySiteDomain);
    });
  } else {
    const ebaySiteDomain = localStorage.getItem('ebaySite') || 'ebay.co.uk';
    processDashboardRender(targetDateStr, ebaySiteDomain);
  }
}

function processDashboardRender(targetDateStr, ebaySiteDomain) {
  const urlParams = new URLSearchParams(window.location.search);
  const forceEmpty = urlParams.get('mode') === 'empty';

  if (dom.ebayOrdersLink) {
    dom.ebayOrdersLink.href = `https://www.${ebaySiteDomain}/sh/ord`;
  }

  StorageHelper.get(['ebay_session_orders', 'data_source'], (result) => {
    const allSessionOrders = result.ebay_session_orders || {};
    const dates = Object.keys(allSessionOrders);

    // Check if session database is empty or if we force empty view mode
    if (dates.length === 0 || forceEmpty) {
      dom.emptyDashboardState.style.display = 'flex';
      dom.dashboardLayout.style.display = 'none';
      dom.fabViewJsonBtn.disabled = true;
      dom.fabSaveDbBtn.disabled = true;
      dom.clearDbBtn.disabled = true;
      dom.dateDropdown.style.display = 'none';
      return;
    }

    // Filled layout state
    dom.dateDropdown.style.display = 'inline-block';
    dom.dateDropdown.innerHTML = '';
    const sortedTs = dates.map(d => window.parseEbayDateToTimestamp(d)).sort((a, b) => b - a);

    // Auto-select max date and open Daily Sales tab by default
    if (!state.dateQueryVal && sortedTs.length > 0) {
      const maxDateObj = new Date(sortedTs[0]);
      state.dateQueryVal = `${maxDateObj.getFullYear()}-${String(maxDateObj.getMonth() + 1).padStart(2, '0')}-${String(maxDateObj.getDate()).padStart(2, '0')}`;
      state.activeTab = 'daily';

      if (dom.tabMultiDay) dom.tabMultiDay.className = 'btn btn-secondary';
      if (dom.tabDailyGrid) dom.tabDailyGrid.className = 'btn btn-primary';

      targetDateStr = window.formatEbayDateString(state.dateQueryVal);
      state.activeTargetDateStr = targetDateStr;
    }

    if (dates.length > 1) {
      const minDateObj = new Date(sortedTs[sortedTs.length - 1]);
      const maxDateObj = new Date(sortedTs[0]);
      const formatShort = (d) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;

      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = `All Dates (${formatShort(maxDateObj)} - ${formatShort(minDateObj)})`;
      dom.dateDropdown.appendChild(allOption);
    }



    sortedTs.forEach(ts => {
      const d = new Date(ts);
      const valStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const formatShort = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
      const opt = document.createElement('option');
      opt.value = valStr;
      opt.textContent = formatShort;
      dom.dateDropdown.appendChild(opt);
    });

    if (state.dateQueryVal) {
      dom.dateDropdown.value = state.dateQueryVal;
    } else {
      dom.dateDropdown.value = dom.dateDropdown.options[0].value;
    }

    dom.emptyDashboardState.style.display = 'none';
    dom.dashboardLayout.style.display = 'flex';
    dom.fabViewJsonBtn.disabled = false;
    dom.fabSaveDbBtn.disabled = false;
    dom.clearDbBtn.disabled = false;

    if (dom.dataSourceBadge) {
      dom.dataSourceBadge.style.display = 'inline-block';
      if (result.data_source === 0) {
        dom.dataSourceBadge.textContent = 'Imported Data';
        dom.dataSourceBadge.style.color = '#3b82f6';
        dom.dataSourceBadge.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        dom.dataSourceBadge.style.background = 'rgba(59, 130, 246, 0.1)';
      } else {
        dom.dataSourceBadge.textContent = 'Scraped Data';
        dom.dataSourceBadge.style.color = '#10b981';
        dom.dataSourceBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        dom.dataSourceBadge.style.background = 'rgba(16, 185, 129, 0.1)';
      }
    }

    dom.fabViewJsonBtn.style.display = 'flex';
    dom.fabSaveDbBtn.style.display = 'flex';

    // Always show Tab list
    if (dom.analyticsTabs) {
      dom.analyticsTabs.style.display = 'flex';
    }

    if (state.activeTab === 'daily') {
      dom.dailySalesView.style.display = 'flex';
      dom.multiDayPanel.style.display = 'none';
      renderDailySalesView(allSessionOrders, targetDateStr, ebaySiteDomain);
    } else {
      dom.dailySalesView.style.display = 'none';
      dom.multiDayPanel.style.display = 'flex';
      renderMultiDayPanel(allSessionOrders, ebaySiteDomain);
    }
  });
}

function renderDailySalesView(allSessionOrders, targetDateStr, ebaySiteDomain) {
  let orders = [];
  if (!targetDateStr) {
    // "All Dates" selected, aggregate everything
    Object.values(allSessionOrders).forEach(dayOrders => {
      orders = orders.concat(dayOrders);
    });
  } else {
    orders = allSessionOrders[targetDateStr] || [];
  }
  state.activeOrdersList = orders;

  if (orders.length === 0) {
    dom.dailyGridContainer.style.display = 'none';
    dom.emptyState.style.display = 'flex';

    // Reset metrics
    resetDailyMetricsCards(dom);

    // Multi-day tab remains active
    if (dom.tabMultiDay) {
      dom.tabMultiDay.disabled = false;
      dom.tabMultiDay.style.opacity = '1';
      dom.tabMultiDay.style.cursor = 'pointer';
      dom.tabMultiDay.title = '';
    }
    return;
  }

  // Enable multi-day tab always
  if (dom.tabMultiDay) {
    dom.tabMultiDay.disabled = false;
    dom.tabMultiDay.style.opacity = '1';
    dom.tabMultiDay.style.cursor = 'pointer';
    dom.tabMultiDay.title = '';
  }

  dom.dailyGridContainer.style.display = 'grid';
  dom.emptyState.style.display = 'none';

  // Calculate Metrics
  const metrics = window.calculateMetrics(orders);
  updateDailyMetricsCards(metrics, dom);

  // Sort display data copy
  let sortedOrders = [...orders];
  if (state.currentSortCol) {
    sortedOrders.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (state.currentSortCol === 'qty') {
        valA = a.quantity || 0;
        valB = b.quantity || 0;
      } else if (state.currentSortCol === 'price') {
        valA = parseFloat((a.priceText || '0').replace(/[^\d.]/g, '')) || 0;
        valB = parseFloat((b.priceText || '0').replace(/[^\d.]/g, '')) || 0;
      } else if (state.currentSortCol === 'date') {
        const tsA = a.timestamp || 0;
        const tsB = b.timestamp || 0;
        if (tsA !== tsB) return state.currentSortDir === 'asc' ? tsA - tsB : tsB - tsA;
        valA = parseTimeToMinutes(a.timeStr);
        valB = parseTimeToMinutes(b.timeStr);
      }

      if (valA === valB) return 0;
      return state.currentSortDir === 'asc' ? valA - valB : valB - valA;
    });
  } else {
    // Default Sort: Newest First (By Date Timestamp, then by Time of Day)
    sortedOrders.sort((a, b) => {
      const tsA = a.timestamp || 0;
      const tsB = b.timestamp || 0;
      if (tsA !== tsB) {
        return tsB - tsA; // Descending dates (newest first)
      }
      const timeA = parseTimeToMinutes(a.timeStr);
      const timeB = parseTimeToMinutes(b.timeStr);
      return timeB - timeA; // Descending times (newest first)
    });
  }

  // Pagination logic
  const totalItemsCountGrid = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCountGrid / state.dailyItemsPerPage));

  if (state.dailyPage > totalPages) {
    state.dailyPage = totalPages;
  }

  const startIndex = (state.dailyPage - 1) * state.dailyItemsPerPage;
  const endIndex = Math.min(startIndex + state.dailyItemsPerPage, totalItemsCountGrid);

  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  if (dom.dailyPageIndicator) {
    dom.dailyPageIndicator.textContent = `Page ${state.dailyPage} of ${totalPages}`;
  }
  if (dom.dailyPrevPageBtn) {
    dom.dailyPrevPageBtn.disabled = state.dailyPage <= 1;
  }
  if (dom.dailyNextPageBtn) {
    dom.dailyNextPageBtn.disabled = state.dailyPage >= totalPages;
  }
  if (dom.dailyItemsPerPage) {
    dom.dailyItemsPerPage.value = state.dailyItemsPerPage;
  }

  // Render Sorted Grid Table Rows
  renderDailyGridRows(paginatedOrders, startIndex, dom.dailyGridContainer, ebaySiteDomain);
}

function renderMultiDayPanel(allSessionOrders, ebaySiteDomain) {

  const distinctDays = Object.keys(allSessionOrders).length;
  const analyzerFilters = document.getElementById('analyzerFilters');

  if (distinctDays < 2) {
    if (analyzerFilters) analyzerFilters.style.display = 'none';
    dom.analyzerGridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted); font-size: 14px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
        <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: none; stroke: var(--text-muted); stroke-width: 1.5; margin-bottom: 16px; opacity: 0.5;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 style="color: var(--text-main); margin-bottom: 8px; font-size: 16px;">Insufficient Data for Analysis</h3>
        <p>Sales Analytics requires at least 2 distinct days of data to analyze trends.<br>Please import historical JSON data or scan more days.</p>
      </div>
    `;
    resetAnalyzerMetaCards(dom);
    return;
  }

  if (analyzerFilters) analyzerFilters.style.display = 'flex';

  // --- Date Filters Generation ---
  if (dom.analyzerDateFilters) {
    dom.analyzerDateFilters.innerHTML = '';
    
    // Get original keys and sort them by timestamp
    const sortedDateKeys = Object.keys(allSessionOrders)
      .map(k => ({ str: k, ts: window.parseEbayDateToTimestamp(k) }))
      .sort((a, b) => b.ts - a.ts);
    
    // If state.analyzerAllowedDates is null, default it to all available dates
    if (!state.analyzerAllowedDates) {
      state.analyzerAllowedDates = sortedDateKeys.map(d => d.str);
    }

    sortedDateKeys.forEach(dateObj => {
      const dateStr = dateObj.str;
      
      const isChecked = state.analyzerAllowedDates.includes(dateStr);
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-block';
      
      const cbId = `date-chip-${dateStr.replace(/\s+/g, '-')}`;
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = cbId;
      cb.value = dateStr;
      cb.className = 'analyzer-date-cb';
      if (isChecked) cb.checked = true;
      
      const lbl = document.createElement('label');
      lbl.htmlFor = cbId;
      lbl.className = 'date-chip-label';
      lbl.textContent = dateStr;
      
      wrapper.appendChild(cb);
      wrapper.appendChild(lbl);
      
      dom.analyzerDateFilters.appendChild(wrapper);
    });
  }
  // --------------------------------

  // Auto-adjust the min streak filter based on available data
  if (dom.filterMinStreak) {
    let currentVal = parseInt(dom.filterMinStreak.value, 10);
    if (isNaN(currentVal) || currentVal > distinctDays || currentVal === 5) {
      dom.filterMinStreak.value = distinctDays;
    }
    // Set HTML max attribute so user knows the limit
    dom.filterMinStreak.max = distinctDays;
  }

  // Run the new Business Intelligence Analyzer Engine
  const fGrouping = dom.filterGrouping ? dom.filterGrouping.value : 'sku';
  const fMinStreak = dom.filterMinStreak && dom.filterMinStreak.value ? parseInt(dom.filterMinStreak.value, 10) : distinctDays;
  let analyzedProducts = analyzeProducts(allSessionOrders, state.activeTargetDateStr, fMinStreak, fGrouping, state.analyzerAllowedDates);

  // Apply UI Filters
  const fStatus = dom.filterStatus ? dom.filterStatus.value : 'all';
  const fConf = dom.filterConfidence ? dom.filterConfidence.value : 'all';
  const fMinPri = dom.filterMinPriority && dom.filterMinPriority.value ? parseInt(dom.filterMinPriority.value, 10) : 0;
  const fMinRev = dom.filterMinRevenue && dom.filterMinRevenue.value ? parseFloat(dom.filterMinRevenue.value) : 0;

  analyzedProducts = analyzedProducts.filter(p => {
    if (fStatus !== 'all' && !p.status.includes(fStatus)) return false;
    if (fConf !== 'all' && !p.confidence.includes(fConf)) return false;
    if (p.priorityScore < fMinPri) return false;
    if (p.revenue < fMinRev) return false;
    return true;
  });

   updateAnalyzerMetaCards(analyzedProducts, dom);

  // Render the BI Dashboard Data Grid
  renderAnalyzerDashboard(analyzedProducts, ebaySiteDomain);

  // Bind Filter Apply Button (ensure it only binds once or replace it)
  if (dom.applyFiltersBtn && !dom.applyFiltersBtn.dataset.bound) {
    dom.applyFiltersBtn.dataset.bound = 'true';
    dom.applyFiltersBtn.addEventListener('click', () => {
      // Capture selected dates
      if (dom.analyzerDateFilters) {
        const checkedBoxes = dom.analyzerDateFilters.querySelectorAll('.analyzer-date-cb:checked');
        state.analyzerAllowedDates = Array.from(checkedBoxes).map(cb => cb.value);
      }
      renderMultiDayPanel(allSessionOrders, ebaySiteDomain);
    });
  }

  // Bind Collapsible Toggle for Filters
  if (dom.filtersToggleHeader && !dom.filtersToggleHeader.dataset.bound) {
    dom.filtersToggleHeader.dataset.bound = 'true';
    dom.filtersToggleHeader.addEventListener('click', () => {
      if (dom.analyzerFilters) {
        dom.analyzerFilters.classList.toggle('collapsed');
      }
    });
  }
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const cleaned = timeStr.toLowerCase().replace(/\s+/g, '');
  const isPm = cleaned.includes('pm');
  const isAm = cleaned.includes('am');

  const timeMatch = cleaned.match(/(\d+)[.:](\d+)/);
  if (!timeMatch) {
    const hourMatch = cleaned.match(/(\d+)/);
    if (!hourMatch) return 0;
    let hour = parseInt(hourMatch[1], 10);
    if (isPm && hour < 12) hour += 12;
    if (isAm && hour === 12) hour = 0;
    return hour * 60;
  }

  let hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  return hour * 60 + minute;
}
