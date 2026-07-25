/**
 * eBay Utilities
 * Handles eBay date parsing, formatting, calculations, and storage.
 */

window.parseEbayDateToTimestamp = function(ebayDateStr) {
  if (!ebayDateStr) return null;
  let normalized = ebayDateStr.trim().toLowerCase();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  if (normalized.includes('today')) {
    return todayDate.getTime();
  }
  if (normalized.includes('yesterday')) {
    const yesterday = new Date(todayDate);
    yesterday.setDate(todayDate.getDate() - 1);
    return yesterday.getTime();
  }

  const parts = ebayDateStr.split(/\s+/);
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  let year = todayDate.getFullYear();
  if (parts.length > 2) {
    year = parseInt(parts[2], 10) || year;
  }

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[monthStr.toLowerCase().substring(0, 3)];
  if (isNaN(day) || month === undefined) {
    return null;
  }
  
  let parsedTime = new Date(year, month, day).getTime();
  if (parsedTime > todayDate.getTime()) {
    year -= 1;
    parsedTime = new Date(year, month, day).getTime();
  }
  
  return parsedTime;
};

window.getLocalMidnightTimestamp = function(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day).getTime();
};

window.formatEbayDateString = function(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[date.getMonth()]}`;
};

window.calculateMetrics = function(orders) {
  const count = orders.length;
  let revenue = 0;
  let items = 0; 
  let currencySymbol = '£';

  if (count > 0) {
    const firstPriceText = orders[0].orderTotalText || orders[0].priceText || '£0.00';
    currencySymbol = firstPriceText.replace(/[\d.,\s-]/g, '').charAt(0) || '£';
    
    const processedOrderIds = new Set();
    let uniqueOrdersCount = 0;

    orders.forEach(order => {
      const baseOrderId = (order.orderNumber || order.orderId || '').toString().split('---')[0];
      const isNewOrder = !baseOrderId || !processedOrderIds.has(baseOrderId);
      
      if (isNewOrder) {
        if (baseOrderId) processedOrderIds.add(baseOrderId);
        uniqueOrdersCount++;
        
        const pText = order.orderTotalText || order.priceText || '0';
        let cleanText = pText.replace(/[^\d.,]/g, '');
        const lastComma = cleanText.lastIndexOf(',');
        const lastDot = cleanText.lastIndexOf('.');
        
        if (lastComma > lastDot) {
          cleanText = cleanText.replace(/\./g, '').replace(',', '.');
        } else {
          cleanText = cleanText.replace(/,/g, '');
        }
        
        const cleanPrice = parseFloat(cleanText) || 0;
        revenue += cleanPrice;
      }
      
      items += order.quantity || 1;
    });

    const avgValObj = uniqueOrdersCount > 0 ? (revenue / uniqueOrdersCount) : 0;
    
    return {
      count: uniqueOrdersCount,
      revenue,
      items,
      avgVal: avgValObj,
      currencySymbol
    };
  }

  return {
    count: 0,
    revenue: 0,
    items: 0,
    avgVal: 0,
    currencySymbol: '£'
  };
};

window.StorageHelper = {
  get: function(keys, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      let storageArea;
      if (chrome.storage.session) {
        storageArea = chrome.storage.session;
      } else {
        storageArea = chrome.storage.local;
      }
      storageArea.get(keys, (res) => {
        if (chrome.runtime.lastError) console.error('Storage Get Error:', chrome.runtime.lastError);
        if (callback) callback(res);
      });
    } else {
      const result = {};
      keys.forEach(k => {
        const val = localStorage.getItem(k);
        result[k] = val ? JSON.parse(val) : null;
      });
      callback(result);
    }
  },
  set: function(items, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      let storageArea;
      if (chrome.storage.session) {
        storageArea = chrome.storage.session;
      } else {
        storageArea = chrome.storage.local;
      }
      storageArea.set(items, () => {
        if (chrome.runtime.lastError) console.error('Storage Set Error:', chrome.runtime.lastError);
        if (callback) callback();
      });
    } else {
      Object.entries(items).forEach(([k, v]) => {
        localStorage.setItem(k, JSON.stringify(v));
      });
      if (callback) callback();
    }
  },
  clear: function(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      let storageArea;
      if (chrome.storage.session) {
        storageArea = chrome.storage.session;
      } else {
        storageArea = chrome.storage.local;
      }
      storageArea.clear(() => {
        if (chrome.runtime.lastError) console.error('Storage Clear Error:', chrome.runtime.lastError);
        if (callback) callback();
      });
    } else {
      localStorage.clear();
      if (callback) callback();
    }
  }
};
