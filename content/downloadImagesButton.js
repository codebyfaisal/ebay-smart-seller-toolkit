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

  const title = document.querySelector("h1");
  if (!title) return;

  const itemId = extractItemId(location.href);
  if (!itemId) return;

  const existingContainer = document.querySelector(".ebay-tools-extension");
  if (existingContainer && lastItemId === itemId) return;

  if (existingContainer) {
    existingContainer.remove();
  }

  lastItemId = itemId;

  // Determine which buttons to show based on user settings
  const showSold = !window.ebayToolsSettings || window.ebayToolsSettings.enableSoldHistory !== false;
  const showImg = !window.ebayToolsSettings || window.ebayToolsSettings.enableImgDownload !== false;

  if (!showSold && !showImg) return;

  // Create a flex-row container for all eBay Tools buttons
  const container = document.createElement("div");
  container.classList.add("ebay-tools-extension");
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.gap = "8px";
  container.style.marginTop = "8px";

  if (showSold) {
    const soldBtn = createBtn("📊 Sold history", () => {
      window.open(
        `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`,
        "_blank"
      );
    });
    soldBtn.style.marginTop = "0px";
    container.appendChild(soldBtn);
  }

  if (showImg) {
    const imgBtn = createBtn("📥 Download Images", async () => {
      const titleText = title.innerText || "ebay_listing_images";
      const sanitizedTitle = titleText.replace(/[\/\\:*?"<>|\n\r\t]/g, "").trim();
      await downloadImages(sanitizedTitle);
    });
    imgBtn.style.marginTop = "0px";
    container.appendChild(imgBtn);
  }

  title.insertAdjacentElement("afterend", container);
}