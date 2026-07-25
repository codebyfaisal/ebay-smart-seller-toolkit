export function updateDailyMetricsCards(metrics, dom) {
  if (dom.totalOrders) dom.totalOrders.textContent = metrics.count;
  if (dom.totalRevenue) dom.totalRevenue.textContent = `${metrics.currencySymbol}${metrics.revenue.toFixed(2)}`;
  if (dom.totalItems) dom.totalItems.textContent = metrics.items;
  if (dom.avgOrderValue) dom.avgOrderValue.textContent = `${metrics.currencySymbol}${metrics.avgVal.toFixed(2)}`;
}

export function resetDailyMetricsCards(dom) {
  if (dom.totalOrders) dom.totalOrders.textContent = '0';
  if (dom.totalRevenue) dom.totalRevenue.textContent = '£0.00';
  if (dom.totalItems) dom.totalItems.textContent = '0';
  if (dom.avgOrderValue) dom.avgOrderValue.textContent = '£0.00';
}

export function updateAnalyzerMetaCards(analyzedProducts, dom) {
  let regularHot = 0;
  let dropped = 0;

  analyzedProducts.forEach(p => {
    if (p.status === 'Healthy') regularHot++;
    if (p.status.includes('Alert') || p.status.includes('Warning')) dropped++;
  });

  if (dom.metaTotalProducts) {
    dom.metaTotalProducts.textContent = analyzedProducts.length;
  }
  if (dom.metaRegularSellers) {
    dom.metaRegularSellers.textContent = regularHot;
  }
  if (dom.metaDroppedSellers) {
    dom.metaDroppedSellers.textContent = dropped;
  }
}

export function resetAnalyzerMetaCards(dom) {
  if (dom.metaTotalProducts) dom.metaTotalProducts.textContent = '0';
  if (dom.metaRegularSellers) dom.metaRegularSellers.textContent = '0';
  if (dom.metaIdentify) dom.metaIdentify.textContent = '0';
  if (dom.metaWarnings) dom.metaWarnings.textContent = '0';
}
