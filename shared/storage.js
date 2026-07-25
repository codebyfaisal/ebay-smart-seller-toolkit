window.getSettings = function(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({
      enableImgDownload: true,
      enableSoldHistorySearch: true,
      enableSoldHistoryListing: true,
      enableSoldHistoryCarousel: true,
      enableSoldHistoryStore: true,
      enableActiveListingsIcon: true,
      enableAnalyticsSidebar: true,
      enableSellerScraper: false
    }, (res) => {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
      if (callback) callback(res);
    });
  } else {
    if (callback) callback({});
  }
};
