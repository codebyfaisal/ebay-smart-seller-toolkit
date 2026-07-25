function injectSellerHubActiveListings() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableActiveListingsIcon === false) return;
  const cells = document.querySelectorAll(window.ebaySelectors.activeListingsQuantityCell);

  cells.forEach((cell) => {
    const textCol = cell.querySelector(window.ebaySelectors.activeListingsTextCol);
    if (!textCol) return;

    // Check if we already injected the icon to prevent duplicates
    if (textCol.querySelector(".ebay-smart-seller-toolkit-link-icon")) return;

    // Find the parent row to get the item ID
    const row = cell.closest(window.ebaySelectors.activeListingsRow);
    if (!row) return;

    const link = row.querySelector(window.ebaySelectors.activeListingsLink);
    if (!link) return;

    const itemId = getItemId(link.href);
    if (!itemId) return;

    textCol.style.position = "relative";
    
    const iconSpan = document.createElement("a");
    iconSpan.href = getSoldHistoryUrl(itemId);
    iconSpan.target = "_blank";
    iconSpan.classList.add("ebay-smart-seller-toolkit-link-icon");
    iconSpan.style.cursor = "pointer";
    iconSpan.style.marginRight = "6px";
    iconSpan.style.display = "inline-flex";
    iconSpan.style.alignItems = "center";
    iconSpan.style.verticalAlign = "middle";
    iconSpan.style.position = "absolute";
    iconSpan.style.top = 0;
    iconSpan.style.left = 0;
    
    iconSpan.innerHTML = `
      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWV4dGVybmFsLWxpbmstaWNvbiBsdWNpZGUtZXh0ZXJuYWwtbGluayI+PHBhdGggZD0iTTE1IDNoNnY2Ii8+PHBhdGggZD0iTTEwIDE0IDIxIDMiLz48cGF0aCBkPSJNMTggMTN2NmEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMlY4YTIgMiAwIDAgMSAyLTJoNiIvPjwvc3ZnPg==" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; stroke: #5a5472ff;" />
    `;

    iconSpan.onclick = (e) => {
      e.stopPropagation();
    };

    textCol.insertBefore(iconSpan, textCol.firstChild);
  });
}
