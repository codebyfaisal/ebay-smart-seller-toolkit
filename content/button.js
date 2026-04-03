function createBtn(text, onClick) {
  const btn = document.createElement("div");
  btn.classList.add("ebay-tools-extension-btn");
  btn.classList.add("ebaymenu-btn");
  btn.innerText = text;

  btn.style.cursor = "pointer";
  btn.style.marginTop = "8px";
  btn.style.padding = "6px 10px";
  btn.style.background = "#5a5472ff";
  btn.style.color = "#ffffffff";
  btn.style.width = "max-content";
  btn.style.borderRadius = "6px";
  btn.style.fontSize = "14px";
  btn.style.position = "relative";
  btn.style.zIndex = "9999";

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