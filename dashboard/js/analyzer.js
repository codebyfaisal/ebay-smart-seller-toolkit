import { state } from './state.js';

export function analyzeProducts(allSessionOrders, evaluationDateStr, streakThreshold = 5, groupingMode = 'sku', allowedDates = null) {
  const dates = Object.keys(allSessionOrders);
  if (dates.length === 0) return [];

  // 1. Map available dates to timestamps
  const parsedDates = dates.map(d => ({
    str: d,
    ts: window.parseEbayDateToTimestamp(d)
  })).filter(d => d.ts !== null).sort((a, b) => a.ts - b.ts);

  let evalTs;
  if (!evaluationDateStr) {
    evalTs = parsedDates[parsedDates.length - 1].ts;
  } else {
    evalTs = window.parseEbayDateToTimestamp(evaluationDateStr);
  }
  let relevantDates = parsedDates.filter(d => d.ts <= evalTs);

  if (allowedDates && Array.isArray(allowedDates)) {
    relevantDates = relevantDates.filter(d => allowedDates.includes(d.str));
  }

  if (relevantDates.length === 0) return [];

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // 2. Aggregate raw product history
  const productsMap = {};

  function getProductKey(order) {
    if (groupingMode === 'itemid') {
      return order.itemId || 'unknown';
    }
    // Default: group by Base SKU
    if (order.sku) return order.sku.split('-')[0].trim().toLowerCase();
    return order.itemId || 'unknown';
  }

  relevantDates.forEach(dateObj => {
    const orders = allSessionOrders[dateObj.str] || [];
    orders.forEach(order => {
      const key = getProductKey(order);
      if (!productsMap[key]) {
        productsMap[key] = {
          key,
          sku: order.sku || '',
          itemId: order.itemId || '',
          title: order.title || 'Unknown Product',
          imageUrl: order.imageUrl || '',
          currencySymbol: order.currencySymbol || '£',
          salesByDate: {},
          ordersList: []
        };
      }
      if (!productsMap[key].salesByDate[dateObj.str]) {
        productsMap[key].salesByDate[dateObj.str] = [];
      }
      productsMap[key].salesByDate[dateObj.str].push(order);
      productsMap[key].ordersList.push(order);
    });
  });

  // 3. Calculate BI metrics
  const results = [];
  const dateMap = new Map(relevantDates.map(d => [d.ts, d.str]));

  for (const p of Object.values(productsMap)) {
    let totalQty = 0;
    let totalRevenue = 0;
    let todaySalesQty = 0;
    let yesterdaySalesQty = 0;
    let lastSaleDateTs = 0;
    let lastSaleDateStr = '';

    const productDatesTs = Object.keys(p.salesByDate)
      .map(d => window.parseEbayDateToTimestamp(d))
      .sort((a, b) => a - b);

    if (productDatesTs.length > 0) {
      lastSaleDateTs = productDatesTs[productDatesTs.length - 1];
      lastSaleDateStr = dateMap.get(lastSaleDateTs) || '';
    }

    let maxHistoricalStreak = 0;
    let consecutiveMissedDays = 0;
    let currentSellingStreak = 0;

    if (productDatesTs.length > 0) {
      const firstSaleTs = productDatesTs[0];
      const saleDays = new Set(productDatesTs.map(ts => Math.round(ts / ONE_DAY_MS)));

      let missed = 0;
      let countingStreak = true;
      let countingMisses = true;

      // Calculate missing days and current streak (backwards from evalTs)
      for (let t = evalTs; t >= firstSaleTs; t -= ONE_DAY_MS) {
        const dayIndex = Math.round(t / ONE_DAY_MS);
        const hasSale = saleDays.has(dayIndex);

        if (hasSale) {
          countingMisses = false; // Stop counting misses once we see a sale
          if (countingStreak) currentSellingStreak++;
        } else {
          countingStreak = false; // Stop counting streak once we see a miss
          if (countingMisses) missed++;
        }
      }

      // Calculate max historical streak (forward)
      let tempStreak = 0;
      for (let t = firstSaleTs; t <= evalTs; t += ONE_DAY_MS) {
        const dayIndex = Math.round(t / ONE_DAY_MS);
        const hasSale = saleDays.has(dayIndex);
        
        if (hasSale) {
          tempStreak++;
          if (tempStreak > maxHistoricalStreak) maxHistoricalStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      consecutiveMissedDays = missed;
    }

    const qualifiesAsRegular = maxHistoricalStreak >= streakThreshold;

    // Requirement: Ignore items that aren't regular sellers
    if (!qualifiesAsRegular) continue;

    let sales7d = 0;
    let rev7d = 0;
    let salesTotal = 0;
    let revTotal = 0;

    p.ordersList.forEach(order => {
      const orderTs = window.parseEbayDateToTimestamp(order.dateStr);
      const diffDays = Math.round((evalTs - orderTs) / ONE_DAY_MS);

      if (diffDays === 0) todaySalesQty += order.quantity;
      if (diffDays === 1) yesterdaySalesQty += order.quantity;

      if (diffDays < 7) {
        sales7d += order.quantity;
        rev7d += order.priceValue;
      }

      salesTotal += order.quantity;
      revTotal += order.priceValue;

      totalQty += order.quantity;
      totalRevenue += order.priceValue;
    });

    // Alert System
    let status = 'Healthy';
    let statusColor = '#10b981'; // Green
    let action = 'No action required.';

    if (consecutiveMissedDays === 1) {
      status = 'Identify';
      statusColor = '#f59e0b'; // Yellow
      action = 'Monitor tomorrow.';
    } else if (consecutiveMissedDays === 2) {
      status = 'Warning';
      statusColor = '#ea580c'; // Orange
      action = 'Check listing traffic, price and competitors.';
    } else if (consecutiveMissedDays === 3) {
      status = 'Serious Warning';
      statusColor = '#ef4444'; // Red
      action = 'Review title, images, promoted ads and recent changes.';
    } else if (consecutiveMissedDays === 4) {
      status = 'Red Alert';
      statusColor = '#dc2626'; // Dark Red
      action = 'Immediate investigation recommended.';
    } else if (consecutiveMissedDays >= 5) {
      status = 'Critical Red Alert';
      statusColor = '#7f1d1d'; // Crimson
      action = 'High-performing listing has stopped selling. Perform full listing audit.';
    }

    // Priority Score (0-100)
    let priorityScore = 0;
    if (consecutiveMissedDays >= 1) {
      priorityScore += Math.min(consecutiveMissedDays, 5) * 12; // up to 60
    }

    // Dynamic Scope Average Revenue
    const daysScope = Math.max(1, relevantDates.length);
    const avgDailyRev = revTotal / daysScope;

    if (avgDailyRev > 100) priorityScore += 20;
    else if (avgDailyRev > 50) priorityScore += 15;
    else if (avgDailyRev > 20) priorityScore += 10;

    if (maxHistoricalStreak >= 10) priorityScore += 20;
    else if (maxHistoricalStreak >= 5) priorityScore += 10;

    priorityScore = Math.min(100, Math.round(priorityScore));

    // Confidence Level
    let confidence = '⭐ Low';
    let availableDaysScope = relevantDates.length || 1;
    let saleDaysInScope = productDatesTs.length;

    const confidenceRatio = saleDaysInScope / availableDaysScope;
    if (confidenceRatio > 0.85) confidence = '⭐⭐⭐ High';
    else if (confidenceRatio > 0.5) confidence = '⭐⭐ Medium';

    // Category is excluded as requested
    const category = 'N/A';

    results.push({
      key: p.key,
      sku: p.sku,
      itemId: p.itemId,
      title: p.title,
      imageUrl: p.imageUrl,
      category,
      currencySymbol: p.currencySymbol,
      todaySalesQty,
      yesterdaySalesQty,
      sales7d,
      salesTotal,
      avgSales7d: (sales7d / Math.min(7, daysScope)).toFixed(1),
      avgSalesTotal: (salesTotal / daysScope).toFixed(1),
      revenue: totalRevenue,
      lastSaleDateStr,
      currentSellingStreak,
      consecutiveMissedDays,
      status,
      statusColor,
      action,
      priorityScore,
      confidence
    });
  }

  // Default sort by Priority Score descending
  results.sort((a, b) => b.priorityScore - a.priorityScore);

  return results;
}
