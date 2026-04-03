let observer = null;

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    if (location.href.includes("/itm/")) {
      injectItemPage();
      injectCarouselButtons();
    }
    if (location.href.includes("/sh/lst/active")) {
      injectSellerHubActiveListings();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: false
  });
}
