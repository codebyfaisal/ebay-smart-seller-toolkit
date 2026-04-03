# eBay Sales Insights & Downloader

A modern, developer-friendly Google Chrome extension designed to provide sellers and researchers with bulk asset downloading capabilities, inline sale history shortcuts, and detailed transactional analytics directly on eBay listings and purchase history pages.

---

## 🌟 Key Features

### 📥 1. High-Resolution Image Downloader
* Automatically scans listing carousels and pulls original images.
* Upscales image endpoints automatically to full **`1600px`** resolution.
* Downloads all listing images in bulk, packaging them into a clean, renamed `.zip` archive on a single click.

### 📊 2. Inline Sold History Injection
* Injects quick-access **`📊 Sold history`** buttons onto eBay search lists, store pages, and product carousel cards.
* Resolves carousel event capturing conflicts by suppressing parent anchor redirects while preserving click events.
* Adds context-menu actions (right-click on listing URLs) to open purchase history listings instantly.

### 📈 3. SaaS-Style Analytics Sidebar
Renders an elegant, slide-out overlay panel on eBay Purchase History pages (`/bin/purchaseHistory`) loaded with premium visualization dashboards:
* **Daily Sales Velocity (Units)**: A smooth, Cubic Bezier trendline chart detailing units sold count over time (purple theme).
* **Daily Revenue (GBP)**: An emerald-green vertical bar chart showcasing daily financial income in GBP.
* **Interactive SVG Controls**: Hovering over points/bars triggers alignment guides, scaling animations, and floating tooltips revealing specific numbers and dates.

### 🔥 4. Popular Variants Leaderboard
* Renders a real-time list of most popular transaction variations.
* Includes a **dynamic select dropdown** next to the leaderboard title.
* Choose **`Default (All)`** to group by the full variation string, or choose any individual attribute (like *Choose Colour* or *Choose Quantity*) to filter and redraw the progress meters in real-time.

### 🛠️ 5. Persistent Feature Toggles UI
* Click the extension icon in the browser toolbar to open a minimalist control panel.
* Toggle the sidebar analytics, image downloader, search card buttons, or active listings seller icons independently.
* Configurations sync automatically and are stored persistently across sessions using `chrome.storage.local`.

---

## 📁 Repository Structure

```yaml
├── manifest.json              # Extension metadata and script injection configuration
├── background.js              # Service worker handling context-menu shortcuts
├── popup.html / popup.js      # Minimalist options panel for toggling features
├── content.js                 # Global entry point loading configurations
├── content/
│   ├── jszip.min.js           # JSZip dependency for building image archives
│   ├── helpers.js             # Utility functions for URLs and image upscaling
│   ├── button.js              # Base button template with click propagation blocker
│   ├── observer.js            # MutationObserver tracking item page changes
│   ├── state.js / zip.js      # State guards and asynchronous JSZip loading helper
│   ├── saleHistoryButton.js   # Button injector for Search, Store, and Carousels
│   ├── downloadImagesButton.js# Image scraping and ZIP archiving logic
│   └── purchaseHistoryAnalyzer.js # Dashboard skeleton & layout orchestrator
│   └── purchaseHistoryAnalyzer/  # Modular analytics panel sub-components:
│       ├── dateParser.js      # Normalizes eBay transaction dates
│       ├── lineChart.js       # Draws daily units sold Bezier line chart
│       ├── barChart.js        # Draws daily revenue GBP bar chart
│       └── variantsCard.js    # Draws variants leaderboard card with attribute filter
```

---

## 🚀 How to Install & Load

1. **Download the Code**: Clone or download this repository onto your local system.
2. **Open Extensions Page**: Open Google Chrome and navigate to `chrome://extensions/`.
3. **Enable Developer Mode**: Toggle the **Developer mode** switch in the top-right corner of the Extensions dashboard.
4. **Load the Directory**: Click the **Load unpacked** button in the top-left corner, select the repository folder containing the `manifest.json`, and click open.
5. **Pin the Icon**: Click the extensions puzzle icon in your browser toolbar and pin **eBay Sales Insights** for easy access.

---

## 🛠️ Technology Stack
* **Runtime**: Google Chrome Extension MV3 Content Scripts
* **Libraries**: JSZip (v3.10.1) for client-side archive packaging
* **Styling**: Pure CSS (using custom variables and fluid layout models)
* **Visualization**: Pure SVG (Scalable Vector Graphics) with CSS-transition animations

---

## 📄 License
This project is open-source. Feel free to modify and customize it for your workflows.