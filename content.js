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

// Load configurations from centralized storage module before running
window.getSettings((settings) => {
  window.ebayToolsSettings = settings;
  run();
});
