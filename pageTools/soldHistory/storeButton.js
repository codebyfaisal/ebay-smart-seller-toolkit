function injectStorePages() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistoryStore === false) return;

  const items = document.querySelectorAll(
    window.ebaySelectors.storeCards
  );

  items.forEach((card) => {
    if (card.querySelector(".ebay-smart-seller-toolkit-btn")) return;

    const link = card.querySelector(window.ebaySelectors.storeLink);
    if (!link) return;

    const itemId = getItemId(link.href);
    if (!itemId) return;

    card.appendChild(
      createLinkBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline></svg> Sold history`, getSoldHistoryUrl(itemId))
    );
  });
}
