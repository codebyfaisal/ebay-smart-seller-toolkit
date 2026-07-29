function injectCarouselButtons() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistoryCarousel === false) return;

  // 1. Query all ul.carousel__list > li and other carousel / merchandise card elements
  let items = Array.from(document.querySelectorAll("ul.carousel__list > li, ul[class*='carousel'] > li, " + window.ebaySelectors.carouselItems));

  // 2. Fallback: Find cards inside recommendation or merchandise modules
  if (items.length === 0) {
    const merchModules = document.querySelectorAll(".merch-module, [class*='merch'], [class*='carousel'], [class*='recommendation']");
    merchModules.forEach(mod => {
      const cards = mod.querySelectorAll("li, div[class*='item'], div[class*='card']");
      items.push(...Array.from(cards));
    });
  }

  items.forEach((li) => {
    if (li.querySelector(".ebay-smart-seller-toolkit-btn")) return;

    const link = li.querySelector(window.ebaySelectors.carouselLink) || li.querySelector("a[href*='/itm/']");
    if (!link) return;

    const itemId = getItemId(link.href);
    if (!itemId) return;

    // Prevent injecting on page-level body or main content wrappers
    if (li.tagName === "BODY" || li.id === "mainContent" || li.classList.contains("main-content")) return;

    const btn = createLinkBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline></svg> Sold history`, getSoldHistoryUrl(itemId));
    btn.style.position = "relative";
    btn.style.zIndex = "9999";
    btn.style.marginTop = "6px";
    btn.style.marginBottom = "6px";

    const section = li.querySelector("section");
    if (section) {
      section.insertAdjacentElement("afterend", btn);
    } else {
      const fallbackTarget = li.querySelector(".s-item__info") || li;
      fallbackTarget.appendChild(btn);
    }
  });
}
