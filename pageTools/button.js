function createBtn(text, onClick) {
  const btn = document.createElement("div");
  btn.classList.add("ebay-smart-seller-toolkit-btn");
  btn.classList.add("ebaymenu-btn");
  btn.innerHTML = text;

  const stopEvents = ["mousedown", "mouseup", "pointerdown", "pointerup"];
  stopEvents.forEach(evt => {
    btn.addEventListener(evt, (e) => {
      e.stopPropagation();
    });
  });

  btn.onclick = (e) => {
    console.log("Button clicked");
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return btn;
}

function createLinkBtn(text, href) {
  const btn = document.createElement("a");
  btn.classList.add("ebay-smart-seller-toolkit-btn");
  btn.classList.add("ebay-smart-seller-toolkit-link-btn");
  btn.classList.add("ebaymenu-btn");
  btn.innerHTML = text;
  
  btn.href = href;
  btn.target = "_blank";

  const stopEvents = ["mousedown", "mouseup", "pointerdown", "pointerup"];
  stopEvents.forEach(evt => {
    btn.addEventListener(evt, (e) => {
      e.stopPropagation();
    });
  });

  return btn;
}