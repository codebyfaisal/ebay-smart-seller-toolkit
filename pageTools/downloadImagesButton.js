function getListingImagesOnly() {
  const images = new Set();
  const seenImageIds = new Set();

  document
    .querySelectorAll(
      ".ux-image-carousel-item img, #icImg, #mainImgHldr img, .main_img"
    )
    .forEach((img) => {
      const src = img.src || img.getAttribute("data-src");
      if (!src) return;

      // Skip spacer GIFs, tracking pixels, or other static resources
      if (
        src.includes(".gif") ||
        src.includes("ebaystatic.com") ||
        src.startsWith("data:")
      ) {
        return;
      }

      const cleanedUrl = cleanEbayImage(src);
      if (!cleanedUrl) return;

      // Extract unique eBay image ID to prevent duplicates
      const imageIdMatch = cleanedUrl.match(/\/g\/([^\/]+)/);
      if (imageIdMatch) {
        const imageId = imageIdMatch[1];
        if (seenImageIds.has(imageId)) return;
        seenImageIds.add(imageId);
      }

      images.add(cleanedUrl);
    });

  return [...images];
}

async function downloadImages(filename = "ebay_listing_images") {
  await loadJSZip();

  const urls = getListingImagesOnly();

  console.log("listing images:", urls);

  if (!urls.length) {
    alert("No listing images found");
    return;
  }

  const zip = new JSZip();

  await Promise.all(
    urls.map(async (url, i) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        zip.file(`image_${i + 1}.jpg`, blob);
      } catch (e) {}
    })
  );

  const content = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = `${filename}.zip`;
  a.click();
}

let lastItemId = null;

function injectItemPage() {
  if (!location.href.includes("/itm/")) return;

  const title = document.querySelector("[data-testid='x-item-title'], h1.x-item-title__mainTitle, .x-item-title, h1");
  if (!title) return;

  const itemId = getItemId(location.href);
  if (!itemId) return;

  const existingContainer = document.querySelector(".ebay-smart-seller-toolkit");
  if (existingContainer && lastItemId === itemId) return;

  if (existingContainer) {
    existingContainer.remove();
  }

  lastItemId = itemId;

  const showSold = !window.ebayToolsSettings || window.ebayToolsSettings.enableSoldHistoryListing !== false;
  const showImg = !window.ebayToolsSettings || window.ebayToolsSettings.enableImgDownload !== false;

  if (!showSold && !showImg) return;

  const container = document.createElement("div");
  container.classList.add("ebay-smart-seller-toolkit");
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.gap = "8px";
  container.style.marginTop = "8px";

  if (showSold) {
    const soldBtn = createLinkBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline></svg> Sold history`, getSoldHistoryUrl(itemId));
    container.appendChild(soldBtn);
  }

  if (showImg) {
    const imgBtn = createBtn(`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Images`, async () => {
      const titleText = title.innerText || "ebay_listing_images";
      const sanitizedTitle = titleText.replace(/[\/\\:*?"<>|\n\r\t]/g, "").trim();
      await downloadImages(sanitizedTitle);
    });
    container.appendChild(imgBtn);
  }

  title.insertAdjacentElement("afterend", container);
}