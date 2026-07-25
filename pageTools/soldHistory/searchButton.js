function injectSearchPages() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistorySearch === false) return;

  const containers = document.querySelectorAll(window.ebaySelectors.searchListings);

  containers.forEach((container) => {
    if (container.querySelector(".ebay-smart-seller-toolkit-btn")) return;

    const listing = container.closest(window.ebaySelectors.listingContainer);
    if (!listing) return;

    const link = listing.querySelector(window.ebaySelectors.searchLink);
    if (!link) return;

    const itemId = getItemId(link.href);
    if (!itemId) return;

    container.appendChild(
      createLinkBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline></svg> Sold history`, getSoldHistoryUrl(itemId))
    );
  });
}
