function injectCarouselButtons() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistoryCarousel === false) return;
  const items = document.querySelectorAll(window.ebaySelectors.carouselItems);

  items.forEach((li) => {
    if (li.querySelector(".ebay-smart-seller-toolkit-btn")) return;

    const link = li.querySelector(window.ebaySelectors.carouselLink);
    if (!link) return;

    const itemId = getItemId(link.href);
    if (!itemId) return;

    const btn = createLinkBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline></svg> Sold history`, getSoldHistoryUrl(itemId));
    btn.style.position = "relative";
    btn.style.zIndex = "9999";

    const section = li.querySelector("section") || li;
    section.appendChild(btn);
  });
}
