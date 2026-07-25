chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ebayPurchaseHistory",
    title: "Open eBay Purchase History",
    contexts: ["link"]
  });
  
  chrome.contextMenus.create({
    id: "ebayReviseListing",
    title: "Revise eBay Listing",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  const url = info.linkUrl;
  if (!url) return;
  
  // Extract item ID (handles /itm/1234, /itm/title/1234, item=1234)
  const match = url.match(/\/itm\/(?:[^\/]+\/)?(\d+)/) || url.match(/item=(\d+)/);
  if (!match) return;
  
  const itemId = match[1];

  if (info.menuItemId === "ebayPurchaseHistory") {
    chrome.tabs.create({
      url: `https://www.ebay.co.uk/bin/purchaseHistory?item=${itemId}`
    });
  } else if (info.menuItemId === "ebayReviseListing") {
    try {
      const urlObj = new URL(url);
      chrome.tabs.create({
        url: `https://${urlObj.hostname}/sl/list?itemId=${itemId}&mode=ReviseItem`
      });
    } catch (e) {
      chrome.tabs.create({
        url: `https://www.ebay.co.uk/sl/list?itemId=${itemId}&mode=ReviseItem`
      });
    }
  }
});
