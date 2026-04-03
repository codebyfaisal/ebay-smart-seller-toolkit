function run() {
  if (location.href.includes("/sch/")) {
    injectSearchPages();
    startObserver();
  }

  if (location.href.includes("/str/")) {
    injectStorePages();
    startObserver();
  }

  if (location.href.includes("/itm/")) {
    injectItemPage();
    injectCarouselButtons();
    startObserver();
  }

  if (location.href.includes("/sh/lst/active")) {
    injectSellerHubActiveListings();
    startObserver();
  }

  if (location.href.includes("/bin/purchaseHistory")) {
    runPurchaseHistoryAnalyzer();
  }
}

// Load configurations from storage before running
chrome.storage.local.get({
  enableImgDownload: true,
  enableSoldHistory: true,
  enableActiveListingsIcon: true,
  enableAnalyticsSidebar: true
}, (settings) => {
  window.ebayToolsSettings = settings;
  run();
});