const KEYS = [
  "enableImgDownload",
  "enableSoldHistorySearch",
  "enableSoldHistoryListing",
  "enableSoldHistoryCarousel",
  "enableSoldHistoryStore",
  "enableActiveListingsIcon"
];

document.addEventListener("DOMContentLoaded", () => {
  // Theme Sync Logic
  chrome.storage.local.get(['themePreference'], (result) => {
    if (result.themePreference === 'light') {
      document.body.setAttribute('data-theme', 'light');
    }
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.themePreference) {
      if (changes.themePreference.newValue === 'light') {
        document.body.setAttribute('data-theme', 'light');
      } else {
        document.body.removeAttribute('data-theme');
      }
    }
  });

  // Load saved settings (default to true if not set)
  chrome.storage.local.get({
    enableImgDownload: true,
    enableSoldHistorySearch: true,
    enableSoldHistoryListing: true,
    enableSoldHistoryCarousel: true,
    enableSoldHistoryStore: true,
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

  const clearStorageBtn = document.getElementById('clearStorageBtn');
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear ALL extension storage?\n\nThis will permanently delete all saved sales orders, scanned history, and custom settings.")) {
        const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
        if (isExtension) {
          chrome.storage.local.clear(() => {
            if (chrome.storage.session) {
              chrome.storage.session.clear(() => {});
            }
            localStorage.clear();
            alert("All extension storage cleared successfully!");
            window.location.reload();
          });
        } else {
          localStorage.clear();
          alert("All local storage cleared!");
          window.location.reload();
        }
      }
    });
  }

  // --- Action Buttons Logic ---
  const btnScrapeSearch = document.getElementById('btnScrapeSearch');

  if (btnScrapeSearch) {
    btnScrapeSearch.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        const tab = tabs[0];
        
        if (!tab.url.includes('/sch/')) {
          alert('This action is only available on eBay search pages.');
          return;
        }

        btnScrapeSearch.textContent = "Scraping...";
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapeSearchToJson
        }, (results) => {
          btnScrapeSearch.innerHTML = `<span style="font-size:16px;">📋</span> Scrape Search to Clipboard (JSON)`;
          if (chrome.runtime.lastError) {
            alert('Error: ' + chrome.runtime.lastError.message);
            return;
          }
          
          if (results && results[0] && results[0].result) {
            const jsonStr = results[0].result;
            // Copy to clipboard inside the popup where focus is active
            navigator.clipboard.writeText(jsonStr).then(() => {
              // Inject the notification back into the page
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  const notif = document.createElement("div");
                  notif.innerText = "Data Copy to Clipboard Successfully!";
                  notif.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    font-size: 15px;
                    z-index: 2147483647;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transition: opacity 0.5s;
                  `;
                  document.body.appendChild(notif);
                  
                  setTimeout(() => {
                    notif.style.opacity = '0';
                    setTimeout(() => notif.remove(), 500);
                  }, 3000);
                }
              });
            }).catch(err => {
              alert("Failed to copy data from popup: " + err);
            });
          }
        });
      });
    });
  }
});

// The scraper function injected directly into the active eBay page
function scrapeSearchToJson() {
  const items = document.querySelectorAll('li.s-card, li.s-item');
  if (items.length === 0) {
    alert("No search results found to scrape!");
    return null;
  }

  const data = [];

  items.forEach(card => {
    const titleEl = card.querySelector('.s-card__title, .s-item__title');
    if (!titleEl) return;
    
    let titleText = titleEl.textContent.replace('Opens in a new window or tab', '').trim();
    if (!titleText || titleText.includes('Shop on eBay')) return;

    const priceEl = card.querySelector('.s-card__price, .s-item__price');
    const priceText = priceEl ? priceEl.textContent.trim() : '';

    let solds = '0';
    const soldMatches = card.textContent.match(/([\d,]+)\+?\s*sold/i);
    if (soldMatches) {
      solds = soldMatches[1].replace(/,/g, '');
    }

    const isSponsored = card.innerHTML.includes('derosnopS') || card.innerHTML.includes('Sponsored') || card.querySelector('.s-item__sponsored') ? 'Yes' : 'No';

    data.push({
      title: titleText,
      price: priceText,
      solds: parseInt(solds, 10),
      sponsored: isSponsored
    });
  });

  if (data.length === 0) {
    alert("Could not extract data from the search results.");
    return null;
  }

  // Return the JSON string back to the popup script
  return JSON.stringify(data, null, 2);
}
