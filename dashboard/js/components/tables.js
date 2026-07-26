function bstToPkt(str, year = new Date().getFullYear()) {
  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const m = str.match(
    /^(\d{1,2})\s([A-Za-z]{3})\s\((\d{1,2})\.(\d{2})(am|pm)\sBST\)$/i
  );

  if (!m) throw new Error("Invalid format");

  let [, day, month, hour, minute, ampm] = m;

  day = Number(day);
  hour = Number(hour);
  minute = Number(minute);

  if (ampm.toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

  // Create BST time as UTC (BST = UTC+1)
  const utc = new Date(Date.UTC(year, months[month], day, hour - 1, minute));

  // Convert to PKT (+5)
  const pkt = new Date(utc.getTime() + 5 * 60 * 60 * 1000);

  const pktDay = pkt.getUTCDate();
  const pktMonth = Object.keys(months)[pkt.getUTCMonth()];

  let pktHour = pkt.getUTCHours();
  const pktMinute = String(pkt.getUTCMinutes()).padStart(2, "0");

  const suffix = pktHour >= 12 ? "pm" : "am";
  pktHour = pktHour % 12 || 12;

  return `${pktDay} ${pktMonth} (${pktHour}.${pktMinute}${suffix} PKT)`;
}

export function renderDailyGridRows(paginatedOrders, startIndex, container, ebaySiteDomain) {
  container.innerHTML = '';

  paginatedOrders.forEach((order, i) => {
    const row = document.createElement('div');
    row.className = 'grid-table-row';
    row.style.cssText = `
      display: grid; 
      grid-template-columns: 40px 100px minmax(200px, 1fr) 60px 90px 120px; 
      gap: 12px; 
      padding: 12px 16px; 
      border-bottom: 1px solid var(--border-color); 
      align-items: center;
      transition: background 0.2s;
    `;
    row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.03)';
    row.onmouseleave = () => row.style.background = 'transparent';

    const safeItemId = window.escapeHTML(order.itemId || '');
    const safeTitle = window.escapeHTML(order.title || '');
    const safeSku = window.escapeHTML(order.sku || '');
    const safeImg = window.escapeHTML(order.imageUrl || '');
    const safeOrderId = window.escapeHTML(order.orderId || '');
    const safeSite = window.escapeHTML(ebaySiteDomain || '');

    const itemLink = safeItemId ? `https://www.${safeSite}/itm/${safeItemId}` : '#';
    const skuBadge = safeSku ? `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
    <span style="user-select: none;">SKU: </span>${safeSku}</span>` : '';
    const displayTimeText = order.timeStr ? `${order.dateStr} (${order.timeStr})` : order.dateStr;
    const imgHtml = safeImg ? `<img src="${safeImg}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); flex-shrink: 0;">` : `<div style="width: 44px; height: 44px; background: rgba(255,255,255,0.03); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-muted); border: 1px solid var(--border-color); flex-shrink: 0;">No Img</div>`;

    row.innerHTML = `
      <div style="text-align: center;">${startIndex + i + 1}</div>
      
      <!-- Order ID & Image vertically stacked -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 11px; font-weight: 700; color: var(--text-main); word-break: break-all; letter-spacing: 0.5px; opacity: 0.8;">#${safeOrderId}</span>
        ${imgHtml}
      </div>
      
      <!-- Title & SKUs -->
      <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
        <a href="${itemLink}" class="hover-underline" target="_blank" style="font-size: 13px; font-weight: 600; color: var(--text-main); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;" title="${safeTitle}">${safeTitle || '(No Title)'}</a>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${skuBadge}
          <span style="font-size: 10px; color: var(--text-muted); padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid var(--border-color);">Listing ID: ${safeItemId || 'N/A'}</span>
        </div>
      </div>
      
      <div>
        <span style="font-size: 12.5px; font-weight: 600; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 6px;">${order.quantity || 1}</span>
      </div>
      
      <div style="font-size: 14px; font-weight: 700; color: #10b981;">${order.priceText}</div>
      
      <div style="font-size: 12px; color: var(--text-muted);" title="${bstToPkt(displayTimeText)}  ">
        ${displayTimeText.replaceAll("(", "<br>").replaceAll(")", "")}
      </div>
    `;

    container.appendChild(row);
  });
}
