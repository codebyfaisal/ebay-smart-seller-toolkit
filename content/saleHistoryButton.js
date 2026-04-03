function injectSearchPages() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistory === false) return;
  if (searchDone) return;
  searchDone = true;

  const containers = document.querySelectorAll(".su-card-container__content");

  containers.forEach((container) => {
    if (container.querySelector(".ebay-tools-extension-btn")) return;

    const listing = container.closest("[data-listingid]");
    if (!listing) return;

    const link = listing.querySelector("a[href*='/itm']");
    if (!link) return;

    const itemId = extractItemId(link.href);
    if (!itemId) return;

    container.appendChild(
      createBtn("📊 Sold history", () => {
        window.open(
          `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`,
          "_blank"
        );
      })
    );
  });
}

function injectStorePages() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistory === false) return;
  if (storeDone) return;
  storeDone = true;

  const items = document.querySelectorAll(
    "section.str-items-grid__container article.str-item-card"
  );

  items.forEach((card) => {
    if (card.querySelector(".ebay-tools-extension-btn")) return;

    const link = card.querySelector("a[href*='/itm']");
    if (!link) return;

    const itemId = extractItemId(link.href);
    if (!itemId) return;

    card.appendChild(
      createBtn("📊 Sold history", () => {
        window.open(
          `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`,
          "_blank"
        );
      })
    );
  });
}

function injectCarouselButtons() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableSoldHistory === false) return;
  const items = document.querySelectorAll(
    "ul.carousel__list li, .carousel__list li, .carousel__snap-point, [class*='carousel__list'] li"
  );

  items.forEach((li) => {
    if (li.querySelector(".ebay-tools-extension-btn")) return;

    const link = li.querySelector("a[href*='/itm']");
    if (!link) return;

    const itemId = extractItemId(link.href);
    if (!itemId) return;

    const btn = createBtn("📊 Sold history", () => {
      window.open(
        `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`,
        "_blank"
      );
    });
    btn.style.position = "relative";
    btn.style.zIndex = "9999";

    const section = li.querySelector("section") || li;
    section.appendChild(btn);
  });
}

function injectSellerHubActiveListings() {
  if (window.ebayToolsSettings && window.ebayToolsSettings.enableActiveListingsIcon === false) return;
  const cells = document.querySelectorAll("td.shui-dt-column__soldQuantity");

  cells.forEach((cell) => {
    const textCol = cell.querySelector(".shui-dt--text-column");
    if (!textCol) return;

    // Check if we already injected the icon to prevent duplicates
    if (textCol.querySelector(".ebay-tools-extension-link-icon")) return;

    // Find the parent row to get the item ID
    const row = cell.closest("tr");
    if (!row) return;

    const link = row.querySelector("a[href*='/itm']");
    if (!link) return;

    const itemId = extractItemId(link.href);
    if (!itemId) return;

    textCol.style.position = "relative";

    // Create the icon element
    const iconSpan = document.createElement("span");
    iconSpan.classList.add("ebay-tools-extension-link-icon");
    iconSpan.style.cursor = "pointer";
    iconSpan.style.marginRight = "6px";
    iconSpan.style.display = "inline-flex";
    iconSpan.style.alignItems = "center";
    iconSpan.style.verticalAlign = "middle";
    iconSpan.style.position = "absolute";
    iconSpan.style.top = 0;
    iconSpan.style.left = 0;

    // Set the SVG content using the base64 string provided
    iconSpan.innerHTML = `
      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWV4dGVybmFsLWxpbmstaWNvbiBsdWNpZGUtZXh0ZXJuYWwtbGluayI+PHBhdGggZD0iTTE1IDNoNnY2Ii8+PHBhdGggZD0iTTEwIDE0IDIxIDMiLz48cGF0aCBkPSJNMTggMTN2NmEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMlY4YTIgMiAwIDAgMSAyLTJoNiIvPjwvc3ZnPg==" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; stroke: #5a5472ff;" />
    `;

    // Click handler to open purchase history
    iconSpan.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(
        `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`,
        "_blank"
      );
    };

    // Insert inside the .shui-dt--text-column afterstart (afterbegin)
    textCol.insertBefore(iconSpan, textCol.firstChild);
  });
}