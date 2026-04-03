chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ebayPurchaseHistory",
    title: "Open eBay Purchase History",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "ebayPurchaseHistory") return;

  const url = info.linkUrl;

  const match = url.match(/\/itm(?:\/[^/]+)?\/(\d+)/);
  if (!match) return;

  const itemId = match[1];

  chrome.tabs.create({
    url: `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`
  });
});