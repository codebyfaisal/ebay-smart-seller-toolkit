function extractItemId(url) {
  if (!url) return null;
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/itm(?:\/[^/]+)?\/(\d+)/);
    return match?.[1];
  } catch (e) {
    const match = url.match(/\/itm(?:\/[^/]+)?\/(\d+)/);
    return match?.[1];
  }
}

function cleanEbayImage(src) {
  if (!src) return "";
  return src.replace(/s-l\d+/, "s-l1600").split("?")[0];
}