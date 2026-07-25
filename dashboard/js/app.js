import { state } from './dashboardState.js';
import * as dom from './dom.js';
import * as data from './data.js';
import * as render from './render.js';

  // --- Theme Management ---
  const themeIconDashboard = document.getElementById('themeIconDashboard');
  window.ThemeManager.initTheme(themeIconDashboard, false);
  // ------------------------

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtnDashboard = document.getElementById('themeToggleBtnDashboard');
  const themeIconDashboard = document.getElementById('themeIconDashboard');
  if (themeToggleBtnDashboard) {
    themeToggleBtnDashboard.addEventListener('click', () => window.ThemeManager.toggleTheme(themeIconDashboard, false));
  }
  dashboardInit();
});

function dashboardInit() {
  // 1. Get Date from URL Query Parameter
  const urlParams = new URLSearchParams(window.location.search);
  state.dateQueryVal = urlParams.get('date');

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (state.dateQueryVal) {
    if (state.dateQueryVal === 'all') {
      state.activeTab = 'multi';
      dom.tabDailyGrid.className = 'btn btn-secondary';
      dom.tabMultiDay.className = 'btn btn-primary';
      state.activeTargetDateStr = '';
    } else {
      state.activeTab = 'daily';
      dom.tabMultiDay.className = 'btn btn-secondary';
      dom.tabDailyGrid.className = 'btn btn-primary';
      state.activeTargetDateStr = window.formatEbayDateString(state.dateQueryVal);
    }
  } else {
    state.activeTab = '';
    state.activeTargetDateStr = '';
  }

  // 2. Fetch and render data
  render.loadAndRenderDashboard(state.activeTargetDateStr);
  // 3. Attach Events
  if (dom.dateDropdown) {
    dom.dateDropdown.addEventListener('change', (e) => {
      state.dateQueryVal = e.target.value;

      if (state.dateQueryVal === 'all') {
        state.activeTab = 'multi';
        dom.tabDailyGrid.className = 'btn btn-secondary';
        dom.tabMultiDay.className = 'btn btn-primary';
        state.activeTargetDateStr = '';
      } else {
        if (state.activeTab === 'multi') {
          state.activeTab = 'daily';
          dom.tabMultiDay.className = 'btn btn-secondary';
          dom.tabDailyGrid.className = 'btn btn-primary';
        }
        state.activeTargetDateStr = window.formatEbayDateString(state.dateQueryVal);
      }

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('date', state.dateQueryVal);
      window.history.pushState(null, '', newUrl.toString());

      render.loadAndRenderDashboard(state.activeTargetDateStr);
    });
  }
  dom.fabMainBtn.addEventListener('click', () => {
    dom.fabMenu.classList.toggle('active');
  });

  dom.fabImportBtn.addEventListener('click', () => {
    dom.fabMenu.classList.remove('active');
    dom.importFile.click();
  });
  dom.importBtnEmpty.addEventListener('click', () => dom.importFile.click());
  dom.importFile.addEventListener('change', (e) => {
    data.handleMultipleFilesImport(e, () => render.loadAndRenderDashboard(state.activeTargetDateStr));
  });

  dom.fabSaveDbBtn.addEventListener('click', () => {
    dom.fabMenu.classList.remove('active');
    data.openExportModal();
  });

  dom.clearDbBtn.addEventListener('click', () => {
    if (confirm('This will clear the entire session database. Proceed?')) {
      StorageHelper.set({ ebay_session_orders: {}, lastScanned: '' }, () => {
        // Remove query params from address bar
        const newUrl = new URL(window.location.href);
        newUrl.search = '';
        window.history.pushState(null, '', newUrl.toString());

        render.loadAndRenderDashboard(state.activeTargetDateStr);
      });
    }
  });

  // Tab Switching triggers
  dom.tabDailyGrid.addEventListener('click', () => {
    state.activeTab = 'daily';
    dom.tabDailyGrid.className = 'btn btn-primary';
    dom.tabMultiDay.className = 'btn btn-secondary';
    render.loadAndRenderDashboard(state.activeTargetDateStr);
  });

  dom.tabMultiDay.addEventListener('click', () => {
    state.activeTab = 'multi';
    dom.tabDailyGrid.className = 'btn btn-secondary';
    dom.tabMultiDay.className = 'btn btn-primary';

    // Force date selection to "All Dates" since Analytics is strictly for multi-day
    state.dateQueryVal = 'all';
    dom.dateDropdown.value = 'all';
    state.activeTargetDateStr = '';

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', 'all');
    window.history.pushState(null, '', newUrl.toString());

    render.loadAndRenderDashboard(state.activeTargetDateStr);
  });

  // Modal listeners
  dom.fabViewJsonBtn.addEventListener('click', () => {
    if (dom.fabViewJsonBtn.disabled) return;
    dom.fabMenu.classList.remove('active');
    StorageHelper.get(['ebay_session_orders'], (result) => {
      const allSessionOrders = result.ebay_session_orders || {};
      dom.jsonRawText.value = JSON.stringify(allSessionOrders, null, 2);
      dom.jsonModal.style.display = 'flex';
    });
  });

  const hideModal = () => {
    dom.jsonModal.style.display = 'none';
  };
  dom.closeJsonModalBtn.addEventListener('click', hideModal);
  dom.closeJsonModalFooterBtn.addEventListener('click', hideModal);

  const hideExportModal = () => {
    dom.exportModal.style.display = 'none';
  };
  dom.closeExportModalBtn.addEventListener('click', hideExportModal);
  dom.cancelExportBtn.addEventListener('click', hideExportModal);

  dom.selectAllExportBtn.addEventListener('click', () => {
    const checkboxes = dom.exportDatesList.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    dom.selectAllExportBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
  });

  dom.downloadExportBtn.addEventListener('click', () => {
    data.executeSelectiveExport();
  });

  dom.copyJsonModalBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(dom.jsonRawText.value)
      .then(() => {
        const originalText = dom.copyJsonModalBtn.textContent;
        dom.copyJsonModalBtn.textContent = 'Copied!';
        dom.copyJsonModalBtn.style.borderColor = '#10b981';
        dom.copyJsonModalBtn.style.color = '#10b981';
        setTimeout(() => {
          dom.copyJsonModalBtn.textContent = originalText;
          dom.copyJsonModalBtn.style.borderColor = '';
          dom.copyJsonModalBtn.style.color = '';
        }, 1500);
      });
  });

  // --- Pagination Event Listeners ---

  // Daily Sales Pagination
  if (dom.dailyPrevPageBtn) {
    dom.dailyPrevPageBtn.addEventListener('click', () => {
      if (state.dailyPage > 1) {
        state.dailyPage--;
        render.loadAndRenderDashboard(state.activeTargetDateStr);
      }
    });
  }
  if (dom.dailyNextPageBtn) {
    dom.dailyNextPageBtn.addEventListener('click', () => {
      state.dailyPage++;
      render.loadAndRenderDashboard(state.activeTargetDateStr);
    });
  }
  if (dom.dailyItemsPerPage) {
    dom.dailyItemsPerPage.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) {
        state.dailyItemsPerPage = val;
        state.dailyPage = 1;
        render.loadAndRenderDashboard(state.activeTargetDateStr);
      }
    });
  }

  // Analyzer Pagination
  if (dom.analyzerPrevPageBtn) {
    dom.analyzerPrevPageBtn.addEventListener('click', () => {
      if (state.analyzerPage > 1) {
        state.analyzerPage--;
        render.loadAndRenderDashboard(state.activeTargetDateStr);
      }
    });
  }
  if (dom.analyzerNextPageBtn) {
    dom.analyzerNextPageBtn.addEventListener('click', () => {
      state.analyzerPage++;
      render.loadAndRenderDashboard(state.activeTargetDateStr);
    });
  }
  if (dom.analyzerItemsPerPage) {
    dom.analyzerItemsPerPage.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) {
        state.analyzerItemsPerPage = val;
        state.analyzerPage = 1;
        render.loadAndRenderDashboard(state.activeTargetDateStr);
      }
    });
  }

  dom.jsonModal.addEventListener('click', (e) => {
    if (e.target === dom.jsonModal) {
      hideModal();
    }
  });
}

function handleHeaderClick(col) {
  if (state.currentSortCol === col) {
    state.currentSortDir = state.currentSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.currentSortCol = col;
    state.currentSortDir = 'desc'; // default desc first
  }
  render.loadAndRenderDashboard(state.activeTargetDateStr);
}
