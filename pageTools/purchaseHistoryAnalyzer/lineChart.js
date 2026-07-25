function drawSalesVelocityLineChart(container, chartData, svgWidth, svgHeight, paddingX, paddingY) {
  const maxQty = Math.max(...chartData.map(d => d.qty), 1);
  const totalDays = chartData.length;

  const getX = (index) => {
    if (totalDays <= 1) return svgWidth / 2;
    return paddingX + (index / (totalDays - 1)) * (svgWidth - paddingX * 2);
  };
  const getY_line = (qty) => {
    return svgHeight - paddingY - (qty / maxQty) * (svgHeight - paddingY * 2);
  };

  const points_line = chartData.map((d, i) => ({ x: getX(i), y: getY_line(d.qty) }));

  // Generate paths (Smooth Cubic Bezier Curves)
  let linePath = "";
  let areaPath = "";
  if (points_line.length > 0) {
    if (points_line.length === 1) {
      linePath = `M ${points_line[0].x} ${points_line[0].y}`;
      areaPath = "";
    } else {
      linePath = `M ${points_line[0].x} ${points_line[0].y}`;
      for (let i = 0; i < points_line.length - 1; i++) {
        const cpX1 = points_line[i].x + (points_line[i + 1].x - points_line[i].x) / 3;
        const cpY1 = points_line[i].y;
        const cpX2 = points_line[i].x + 2 * (points_line[i + 1].x - points_line[i].x) / 3;
        const cpY2 = points_line[i + 1].y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points_line[i + 1].x} ${points_line[i + 1].y}`;
      }
      areaPath = `${linePath} L ${points_line[points_line.length - 1].x} ${svgHeight - paddingY} L ${points_line[0].x} ${svgHeight - paddingY} Z`;
    }
  }

  let lineSvg = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; display: block; overflow: visible;">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4f46e5"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#4f46e5" flood-opacity="0.2" />
        </filter>
      </defs>
      
      <style>
        .line-group {
          cursor: pointer;
        }
        .line-group:hover .line-guide {
          opacity: 0.4;
        }
        .line-group:hover .line-node {
          r: 6;
          fill: #8b5cf6;
          stroke: #ffffff;
          stroke-width: 2.5;
        }
        .line-label {
          opacity: 0;
        }
        .line-group:hover .line-label {
          fill: #312e81;
          font-weight: 800;
          opacity: 1;
        }
        .line-group:hover .line-tooltip {
          opacity: 1;
        }
        .line-node, .line-guide, .line-label, .line-tooltip {
          transition: all 0.15s ease-in-out;
        }
      </style>
      
      <line x1="${paddingX}" y1="${getY_line(0)}" x2="${svgWidth - paddingX}" y2="${getY_line(0)}" stroke="#f3f4f6" stroke-width="1.5" />
      <line x1="${paddingX}" y1="${getY_line(maxQty / 2)}" x2="${svgWidth - paddingX}" y2="${getY_line(maxQty / 2)}" stroke="#f3f4f6" stroke-width="1" stroke-dasharray="4,4" />
      <line x1="${paddingX}" y1="${getY_line(maxQty)}" x2="${svgWidth - paddingX}" y2="${getY_line(maxQty)}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4" />
      
      ${areaPath ? `<path d="${areaPath}" fill="url(#chartGrad)" />` : ""}
      
      ${linePath ? `<path d="${linePath}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />` : ""}
  `;

  points_line.forEach((p, i) => {
    const qty = chartData[i].qty;
    const dateLabel = chartData[i].label;
    
    lineSvg += `
      <g class="line-group">
        <!-- Interactive vertical guide line -->
        <line class="line-guide" x1="${p.x}" y1="${paddingY}" x2="${p.x}" y2="${svgHeight - paddingY}" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,3" opacity="0" pointer-events="none" />
        
        <!-- Node circle -->
        <circle class="line-node" cx="${p.x}" cy="${p.y}" r="4.5" fill="#ffffff" stroke="#4f46e5" stroke-width="2" />
        
        <!-- Value Label -->
        ${qty > 0 ? `<text class="line-label" x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" font-weight="700" fill="#4f46e5">${qty}</text>` : ""}
        
        <!-- Hover Tooltip Container -->
        <g class="line-tooltip" opacity="0" pointer-events="none">
          <rect x="${p.x - 50}" y="${p.y - 36}" width="100" height="20" rx="4" fill="#1f2937" />
          <text x="${p.x}" y="${p.y - 23}" text-anchor="middle" font-size="9" font-weight="600" fill="#ffffff">${dateLabel}: ${qty} sold</text>
        </g>
      </g>
    `;
  });

  // X-Axis Labels (Start, Mid, End)
  if (totalDays > 0) {
    lineSvg += `<text x="${points_line[0].x}" y="${svgHeight - 10}" text-anchor="start" font-size="9" font-weight="600" fill="#9ca3af">${chartData[0].label}</text>`;
    if (totalDays > 2) {
      const mid = Math.floor(totalDays / 2);
      lineSvg += `<text x="${points_line[mid].x}" y="${svgHeight - 10}" text-anchor="middle" font-size="9" font-weight="600" fill="#9ca3af">${chartData[mid].label}</text>`;
    }
    if (totalDays > 1) {
      lineSvg += `<text x="${points_line[points_line.length - 1].x}" y="${svgHeight - 10}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${chartData[chartData.length - 1].label}</text>`;
    }
  }

  // Y-Axis Labels
  lineSvg += `
    <text x="${paddingX - 8}" y="${getY_line(0) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">0</text>
    <text x="${paddingX - 8}" y="${getY_line(maxQty / 2) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${Math.round(maxQty / 2)}</text>
    <text x="${paddingX - 8}" y="${getY_line(maxQty) + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#9ca3af">${maxQty}</text>
  `;

  lineSvg += `</svg>`;
  container.innerHTML += lineSvg;
}
