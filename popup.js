const KEYS = [
  "enableImgDownload",
  "enableSoldHistory",
  "enableActiveListingsIcon",
  "enableAnalyticsSidebar"
];

document.addEventListener("DOMContentLoaded", () => {
  // Load saved settings (default to true if not set)
  chrome.storage.local.get({
    enableImgDownload: true,
    enableSoldHistory: true,
    enableActiveListingsIcon: true,
    enableAnalyticsSidebar: true
  }, (items) => {
    KEYS.forEach(key => {
      const el = document.getElementById(key);
      if (el) {
        el.checked = items[key];
        
        // Listen for user changes
        el.addEventListener("change", (e) => {
          chrome.storage.local.set({ [key]: e.target.checked });
        });
      }
    });
  });
});
