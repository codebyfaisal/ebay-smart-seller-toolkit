let observer = null;
let debounceTimer = null;

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    // Clear the previous timer if eBay fires another change quickly
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Wait for the page to settle down (250ms) before doing the heavy work
    debounceTimer = setTimeout(() => {
      const url = location.href;
      
      if (url.includes("/itm/")) {
        if (typeof injectItemPage === 'function') injectItemPage();
        if (typeof injectCarouselButtons === 'function') injectCarouselButtons();
      }
      if (url.includes("/sh/lst/active")) {
        if (typeof injectSellerHubActiveListings === 'function') injectSellerHubActiveListings();
      }
      if (url.includes("/sch/")) {
        if (typeof injectSearchPages === 'function') injectSearchPages();
      }
      if (url.includes("/str/")) {
        if (typeof injectStorePages === 'function') injectStorePages();
      }
    }, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
