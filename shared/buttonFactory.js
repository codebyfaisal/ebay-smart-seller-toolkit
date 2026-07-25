window.createBtn = function(text, onClick) {
  const btn = document.createElement("div");
  btn.className = "ebay-smart-seller-toolkit-btn ebaymenu-btn";
  btn.innerHTML = text;
  
  ["mousedown", "mouseup", "pointerdown", "pointerup"].forEach(evt => {
    btn.addEventListener(evt, e => e.stopPropagation());
  });
  
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  return btn;
};

window.createLinkBtn = function(text, href) {
  const btn = document.createElement("a");
  btn.className = "ebay-smart-seller-toolkit-btn ebay-smart-seller-toolkit-link-btn ebaymenu-btn";
  btn.innerHTML = text;
  btn.href = href;
  btn.target = "_blank";
  
  ["mousedown", "mouseup", "pointerdown", "pointerup"].forEach(evt => {
    btn.addEventListener(evt, e => e.stopPropagation());
  });
  return btn;
};
