import * as dom from './dom.js';
import { state } from './dashboardState.js';

export function renderAnalyzerDashboard(analyzedProducts, ebaySiteDomain) {
  dom.analyzerGridContainer.innerHTML = '';
  
  if (analyzedProducts.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted); font-size: 14px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);';
    emptyMsg.innerHTML = `No Regular Sellers detected in the imported data.<br><span style="font-size: 12px;">(Requires at least one item to meet your minimum consecutive days threshold)</span>`;
    dom.analyzerGridContainer.appendChild(emptyMsg);
    
    // Disable pagination
    if (dom.analyzerPageIndicator) dom.analyzerPageIndicator.textContent = 'Page 1 of 1';
    if (dom.analyzerPrevPageBtn) dom.analyzerPrevPageBtn.disabled = true;
    if (dom.analyzerNextPageBtn) dom.analyzerNextPageBtn.disabled = true;
    return;
  }
  
  // Pagination logic
  state.lastAnalyzedProducts = analyzedProducts; // Store for pagination clicks
  
  const totalItems = analyzedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.analyzerItemsPerPage));
  
  if (state.analyzerPage > totalPages) {
    state.analyzerPage = totalPages;
  }
  
  const renderAnalyzerIndex = (state.analyzerPage - 1) * state.analyzerItemsPerPage;
  const endIndex = Math.min(renderAnalyzerIndex + state.analyzerItemsPerPage, totalItems);
  
  const paginatedProducts = analyzedProducts.slice(renderAnalyzerIndex, endIndex);
  
  // Update Pagination UI
  if (dom.analyzerPageIndicator) {
    dom.analyzerPageIndicator.textContent = `Page ${state.analyzerPage} of ${totalPages}`;
  }
  if (dom.analyzerPrevPageBtn) {
    dom.analyzerPrevPageBtn.disabled = state.analyzerPage <= 1;
  }
  if (dom.analyzerNextPageBtn) {
    dom.analyzerNextPageBtn.disabled = state.analyzerPage >= totalPages;
  }
  if (dom.analyzerItemsPerPage) {
    dom.analyzerItemsPerPage.value = state.analyzerItemsPerPage;
  }

  paginatedProducts.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'grid-table-row';
    row.style.cssText = `
      display: grid;
      grid-template-columns: 30px minmax(200px, 2.5fr) 80px 80px minmax(120px, 1fr) repeat(5, 85px);
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      align-items: center;
      transition: background 0.2s;
    `;
    
    const safeItemId = window.escapeHTML(p.itemId);
    const safeTitle = window.escapeHTML(p.title);
    const safeSku = window.escapeHTML(p.sku);
    const safeStatus = window.escapeHTML(p.status);
    const safeSite = window.escapeHTML(ebaySiteDomain);
    const safeImg = window.escapeHTML(p.imageUrl);

    const itemLink = safeItemId ? `https://www.${safeSite}/itm/${safeItemId}` : '#';
    const imgHtml = p.imageUrl 
      ? `<img src="${safeImg}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); flex-shrink: 0;">`
      : `<div style="width: 44px; height: 44px; background: var(--bg-card-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-muted); border: 1px solid var(--border-color); flex-shrink: 0;">No Img</div>`;
      
    let pColor = '#10b981'; // Green
    if (p.priorityScore >= 70) pColor = '#ef4444'; // Red
    else if (p.priorityScore >= 40) pColor = '#f59e0b'; // Yellow

    row.innerHTML = `
      <div style="text-align: left;">${renderAnalyzerIndex + i + 1}</div>

      <!-- Product Details -->
      <div style="display: flex; gap: 12px; align-items: center; overflow: hidden;">
        ${imgHtml}
        <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
          <a href="${itemLink}" class="hover-underline" target="_blank" style="font-size: 13px; font-weight: 600; color: var(--text-main); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;" title="${safeTitle}">${safeTitle}</a>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${safeSku ? `<span style="color: #10b981; font-size: 10px;">SKU: ${safeSku}</span>` : ''}
            <span style="font-size: 10px; color: var(--text-muted);">ID: ${safeItemId}</span>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div>
        <span style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: ${p.statusColor}15; border: 1px solid ${p.statusColor}50; color: ${p.statusColor}; white-space: nowrap;">${safeStatus}</span>
      </div>

      <!-- Priority -->
      <div style="text-align: center;">
        <span style="font-weight: 800; font-size: 14px; color: ${pColor};">${p.priorityScore}</span>
      </div>

      <!-- Action Required -->
      <div style="font-size: 12px; color: var(--text-main); line-height: 1.3;">
        ${p.action}
      </div>

      <!-- Confidence -->
      <div>
        <span style="font-size: 11px; font-weight: 600; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 4px 8px; border-radius: 4px; text-align: center; display: block;">${p.confidence}</span>
      </div>

      <!-- Streak / Miss -->
      <div style="text-align: center; font-size: 13px; font-weight: 600;">
        <span style="color: var(--text-main);">${p.currentSellingStreak}</span>
        <span style="color: var(--text-muted); opacity: 0.5;">/</span>
        <span style="color: ${p.consecutiveMissedDays > 0 ? '#ef4444' : '#10b981'};">${p.consecutiveMissedDays}</span>
      </div>

      <!-- Today / Yesterday -->
      <div style="text-align: center; font-size: 13px; font-weight: 600;">
        <span style="color: var(--text-main);">${p.todaySalesQty}</span>
        <span style="color: var(--text-muted); opacity: 0.5;">/</span>
        <span style="color: var(--text-muted);">${p.yesterdaySalesQty}</span>
      </div>

      <!-- 7d / Total Avg -->
      <div style="text-align: center; font-size: 13px; font-weight: 600;">
        <span style="color: var(--text-main);">${p.avgSales7d}</span>
        <span style="color: var(--text-muted); opacity: 0.5;">/</span>
        <span style="color: var(--text-muted);">${p.avgSalesTotal}</span>
      </div>

      <!-- Last Sale -->
      <div style="text-align: right; font-size: 12px; color: var(--text-muted);">
        ${p.lastSaleDateStr || 'N/A'}
      </div>
    `;
    
    dom.analyzerGridContainer.appendChild(row);
  });
}
