function drawSalesRevenueBarChart(container, chartData, svgWidth, svgHeight, paddingX, paddingY) {
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const totalDays = chartData.length;
  const spacingX = (svgWidth - paddingX * 2) / Math.max(totalDays, 1);
  const barWidth = Math.min(Math.max(spacingX * 0.7, 4), 32);

  const getX_bar = (index) => {
    if (totalDays <= 1) return svgWidth / 2;
    return paddingX + index * spacingX + spacingX / 2;
  };
  const getY_revenue = (val) => {
    return svgHeight - paddingY - (val / maxRevenue) * (svgHeight - paddingY * 2);
  };

  const points_revenue = chartData.map((d, i) => ({ x: getX_bar(i), y: getY_revenue(d.revenue) }));

  function formatGBP(val) {
    if (val === 0) return "£0";
    return "£" + Number(val.toFixed(2));
  }

  let barSvg = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; display: block; overflow: visible;">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#10b981" flood-opacity="0.35" />
        </filter>
      </defs>
      
      <style>
        .bar-group {
          cursor: pointer;
        }
        .bar-group:hover .bar-guide {
          opacity: 0.2;
        }
        .bar-group:hover .chart-bar {
          fill: url(#barHoverGrad);
          filter: url(#barShadow);
        }
        .bar-label {
          opacity: 0;
        }
        .bar-group:hover .bar-label {
          fill: #064e3b;
          font-weight: 800;
          opacity: 1;
        }
        .bar-group:hover .bar-tooltip {
          opacity: 1;
        }
        .chart-bar, .bar-guide, .bar-label, .bar-tooltip {
          transition: all 0.15s ease-in-out;
        }
      </style>
      
      <!-- Grid lines -->
      <line x1="${paddingX}" y1="${getY_revenue(0)}" x2="${svgWidth - paddingX}" y2="${getY_revenue(0)}" stroke="#f3f4f6" stroke-width="1.5" />
      <line x1="${paddingX}" y1="${getY_revenue(maxRevenue / 2)}" x2="${svgWidth - paddingX}" y2="${getY_revenue(maxRevenue / 2)}" stroke="#f3f4f6" stroke-width="1" stroke-dasharray="4,4" />
      <line x1="${paddingX}" y1="${getY_revenue(maxRevenue)}" x2="${svgWidth - paddingX}" y2="${getY_revenue(maxRevenue)}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4" />
      
      <!-- Bars & Labels & Guide Lines -->
  `;

  points_revenue.forEach((p, i) => {
    const rev = chartData[i].revenue;
    const dateLabel = chartData[i].label;
    const barHeight = (svgHeight - paddingY) - p.y;
    const radius = Math.min(barWidth / 2, 4);
    
    barSvg += `
      <g class="bar-group">
        <!-- Interactive vertical guide line -->
        <line class="bar-guide" x1="${p.x}" y1="${paddingY}" x2="${p.x}" y2="${svgHeight - paddingY}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" opacity="0" pointer-events="none" />
        
        <!-- Daily sales bar -->
        ${rev > 0 ? `
          <rect class="chart-bar" x="${p.x - barWidth / 2}" y="${p.y}" width="${barWidth}" height="${barHeight}" rx="${radius}" ry="${radius}" fill="url(#barGrad)" />
        ` : `
          <rect class="chart-bar" x="${p.x - barWidth / 2}" y="${svgHeight - paddingY - 2}" width="${barWidth}" height="2" rx="1" fill="#e5e7eb" opacity="0.5" />
        `}

        <!-- Value Label -->
        ${rev > 0 ? `<text class="bar-label" x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="9" font-weight="700" fill="#059669">${formatGBP(rev)}</text>` : ""}
        
        <!-- Hover Tooltip Container -->
        <g class="bar-tooltip" opacity="0" pointer-events="none">
          <rect x="${p.x - 55}" y="${p.y - 34}" width="110" height="20" rx="4" fill="#1f2937" />
          <text x="${p.x}" y="${p.y - 21}" text-anchor="middle" font-size="9" font-weight="600" fill="#ffffff">${dateLabel}: ${formatGBP(rev)}</text>
        </g>
      </g>
    `;
  });

  // X-Axis Labels (Start, Mid, End)
  if (totalDays > 0) {
    barSvg += `<text x="${points_revenue[0].x}" y="${svgHeight - 10}" text-anchor="start" font-size="9" font-weight="600" fill="#9ca3af">${chartData[0].label}</text>`;
    if (totalDays > 2) {
      const mid = Math.floor(totalDays / 2);
      barSvg += `<text x="${points_revenue[mid].x}" y="${svgHeight - 10}" text-anchor="middle" font-size="9" font-weight="600" fill="#9ca3af">${chartData[mid].label}</text>`;
    }
    if (totalDays > 1) {
      barSvg += `<text x="${points_revenue[points_revenue.length - 1].x}" y="${svgHeight - 10}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${chartData[chartData.length - 1].label}</text>`;
    }
  }

  // Y-Axis Labels
  barSvg += `
    <text x="${paddingX - 8}" y="${getY_revenue(0) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">£0</text>
    <text x="${paddingX - 8}" y="${getY_revenue(maxRevenue / 2) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${formatGBP(maxRevenue / 2)}</text>
    <text x="${paddingX - 8}" y="${getY_revenue(maxRevenue) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${formatGBP(maxRevenue)}</text>
  `;

  barSvg += `</svg>`;
  container.innerHTML += barSvg;
}
