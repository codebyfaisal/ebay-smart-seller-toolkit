function runPurchaseHistoryAnalyzer() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableAnalyticsSidebar === false) return;

  // Prevent duplicate insertion
  if (document.querySelector(".ebay-tools-history-dashboard")) return;

  const table = document.querySelector(".contentTable") || document.querySelector("table");
  if (!table) return;

  const headers = Array.from(table.querySelectorAll("th")).map(th => th.innerText.trim());

  const dateIdx = headers.findIndex(h => h.includes("Date"));
  const qtyIdx = headers.findIndex(h => h.includes("Quantity"));
  const varIdx = headers.findIndex(h => h.includes("Variation"));
  const priceIdx = headers.findIndex(h => h.includes("Price") || h.includes("Buy It Now"));

  if (dateIdx === -1 || qtyIdx === -1) return;

  const rows = Array.from(table.querySelectorAll("tr")).slice(1);
  const salesData = [];
  let totalSolds = 0;

  const allVariationKeys = new Set();

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length <= Math.max(dateIdx, qtyIdx, varIdx, priceIdx)) return;

    const dateText = cells[dateIdx].innerText.trim();
    const qtyText = cells[qtyIdx].innerText.trim();
    const variationText = varIdx !== -1 ? cells[varIdx].innerText.trim() : "Default / No Variation";
    const priceText = priceIdx !== -1 ? cells[priceIdx].innerText.trim() : "0";

    const qty = parseInt(qtyText, 10) || 0;
    if (qty <= 0) return;

    const datePart = parseEbayDate(dateText);
    if (!datePart) return;

    totalSolds += qty;

    const cleanVariation = variationText.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    const parsedAttrs = {};

    const lines = variationText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach(line => {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        if (key && val) {
          parsedAttrs[key] = val;
          allVariationKeys.add(key);
        }
      }
    });

    const price = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0;

    salesData.push({
      date: datePart,
      qty: qty,
      price: price,
      variation: variationText,
      cleanVariation: cleanVariation,
      parsedAttrs: parsedAttrs
    });
  });

  if (salesData.length === 0) return;

  // Find target header to insert before (e.g. Recent purchases header)
  const headings = Array.from(document.querySelectorAll("h2, h3, h1"));
  const recentPurchasesHeader = headings.find(h => h.innerText.includes("Recent purchases")) || table;

  // Generate daily sales velocity
  const dates = salesData.map(d => d.date);
  dates.sort();
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);

  const dailyCounts = {};
  const dailyRevenue = {};
  salesData.forEach(sale => {
    dailyCounts[sale.date] = (dailyCounts[sale.date] || 0) + sale.qty;
    dailyRevenue[sale.date] = (dailyRevenue[sale.date] || 0) + (sale.qty * sale.price);
  });

  const chartData = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const label = current.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    chartData.push({
      date: dateStr,
      label: label,
      qty: dailyCounts[dateStr] || 0,
      revenue: dailyRevenue[dateStr] || 0
    });

    current.setDate(current.getDate() + 1);
  }

  // Create Dashboard Container
  const dashboard = document.createElement("div");
  dashboard.className = "ebay-tools-history-dashboard";
  dashboard.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 48vw;
    height: 100vh;
    box-sizing: border-box;
    background: #f9fafb;
    border-left: 1px solid #e5e7eb;
    padding: 25px 20px 40px 20px;
    box-shadow: -4px 0 15px rgba(0,0,0,0.06);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow-y: auto;
    z-index: 999999;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(100%);
  `;

  // Create Close Button
  const closeBtn = document.createElement("div");
  closeBtn.style.cssText = `
    cursor: pointer;
    font-size: 16px;
    color: #9ca3af;
    transition: color 0.2s ease;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    line-height: 1;
  `;
  closeBtn.innerHTML = "✕";
  closeBtn.onmouseenter = () => closeBtn.style.color = "#1f2937";
  closeBtn.onmouseleave = () => closeBtn.style.color = "#9ca3af";

  // Create Open Trigger Floating Button
  const toggleBtn = document.createElement("div");
  toggleBtn.className = "ebay-tools-sidebar-toggle";
  toggleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000000;
    cursor: pointer;
    background: #5a5472ff;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    <span>View Analytics</span>
  `;
  toggleBtn.onmouseenter = () => {
    toggleBtn.style.background = "#453f5c";
    toggleBtn.style.transform = "scale(1.03)";
  };
  toggleBtn.onmouseleave = () => {
    toggleBtn.style.background = "#5a5472ff";
    toggleBtn.style.transform = "scale(1)";
  };

  // Toggle Action
  let isOpen = false;
  function toggleSidebar() {
    isOpen = !isOpen;
    if (isOpen) {
      dashboard.style.transform = "translateX(0)";
      toggleBtn.style.display = "none";
    } else {
      dashboard.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (!isOpen) toggleBtn.style.display = "flex";
      }, 150);
    }
  }

  closeBtn.onclick = toggleSidebar;
  toggleBtn.onclick = toggleSidebar;

  // Title section
  const titleSection = document.createElement("div");
  titleSection.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 12px;
    margin-bottom: 20px;
  `;
  titleSection.innerHTML = `
    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">📊 Purchase History Analytics</h3>
  `;

  const headerRight = document.createElement("div");
  headerRight.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  headerRight.innerHTML = `
    <span style="font-size: 12px; font-weight: 500; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px;">
      Total Sales: <strong>${totalSolds}</strong> units
    </span>
  `;
  headerRight.appendChild(closeBtn);
  titleSection.appendChild(headerRight);
  dashboard.appendChild(titleSection);

  // Body container (vertical stack)
  const bodyGrid = document.createElement("div");
  bodyGrid.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 25px;
  `;

  // SVG Line Chart for units
  const chartCol = document.createElement("div");
  chartCol.style.cssText = `
    width: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #f3f4f6;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    box-sizing: border-box;
  `;
  chartCol.innerHTML = `<h4 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">📈 <span>Daily Sales Velocity (Units)</span></h4>`;

  const svgWidth = 550;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 35;

  drawSalesVelocityLineChart(chartCol, chartData, svgWidth, svgHeight, paddingX, paddingY);

  // SVG Bar Chart for revenue
  const revenueCol = document.createElement("div");
  revenueCol.style.cssText = chartCol.style.cssText;
  revenueCol.innerHTML = `<h4 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">💰 <span>Daily Revenue (GBP)</span></h4>`;

  drawSalesRevenueBarChart(revenueCol, chartData, svgWidth, svgHeight, paddingX, paddingY);

  // Bottom section - Variations card
  createVariantsCard(bodyGrid, salesData, allVariationKeys);

  // Stack all elements in layout order (Line Chart first, Bar Chart second, Variants last)
  bodyGrid.insertBefore(revenueCol, bodyGrid.firstChild);
  bodyGrid.insertBefore(chartCol, bodyGrid.firstChild);

  dashboard.appendChild(bodyGrid);
  document.body.appendChild(dashboard);
  document.body.appendChild(toggleBtn);
}