window.getCurrentMarketplace = function() {
  return window.location.hostname || "www.ebay.com";
};

window.getSoldHistoryUrl = function(itemId) {
  const domain = window.getCurrentMarketplace();
  return `https://${domain}/bin/purchaseHistory?item=${itemId}`;
};

window.getReviseItemUrl = function(itemId) {
  const domain = window.getCurrentMarketplace();
  return `https://${domain}/sl/list?itemId=${itemId}&mode=ReviseItem`;
};
