window.getItemId = function(url) {
  if (!url) return null;
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/itm\/(?:[^\/]+\/)?(\d{9,15})/);
    return match ? match[1] : null;
  } catch (e) {
    const match = url.match(/\/itm\/(?:[^\/]+\/)?(\d{9,15})/);
    return match ? match[1] : null;
  }
};
