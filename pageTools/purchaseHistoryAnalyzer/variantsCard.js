function createVariantsCard(container, salesData, allVariationKeys) {
  const varCol = document.createElement("div");
  varCol.style.cssText = `
    width: 100%;
    background: #ffffff;
    border: 1px solid #f3f4f6;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    box-sizing: border-box;
  `;

  const varHeader = document.createElement("div");
  varHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `;
  varHeader.innerHTML = `
    <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">🔥 <span>Popular Variants</span></h4>
  `;

  const groupSelect = document.createElement("select");
  groupSelect.id = "ebay-smart-seller-toolkit-variant-dropdown";
  groupSelect.style.cssText = `
    font-size: 11px;
    font-weight: 600;
    color: #4b5563;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px 8px;
    background: #ffffff;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s ease-in-out;
  `;
  groupSelect.onmouseenter = () => groupSelect.style.borderColor = "#9ca3af";
  groupSelect.onmouseleave = () => groupSelect.style.borderColor = "#d1d5db";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "Default";
  defaultOpt.innerText = "Default (All)";
  groupSelect.appendChild(defaultOpt);

  allVariationKeys.forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.innerText = key;
    groupSelect.appendChild(opt);
  });

  varHeader.appendChild(groupSelect);
  varCol.appendChild(varHeader);

  const listContainer = document.createElement("div");
  listContainer.id = "ebay-smart-seller-toolkit-variants-list";
  varCol.appendChild(listContainer);

  // Dynamic variants rendering function
  function updateVariantsList(groupBy) {
    listContainer.innerHTML = "";

    const variantCounts = {};
    salesData.forEach(sale => {
      let groupVal = "Default";
      if (groupBy === "Default") {
        groupVal = sale.cleanVariation;
      } else {
        groupVal = sale.parsedAttrs[groupBy] || "Default / No Attribute";
      }
      variantCounts[groupVal] = (variantCounts[groupVal] || 0) + sale.qty;
    });

    const sortedVariants = Object.entries(variantCounts).sort((a, b) => b[1] - a[1]);
    const maxVal = sortedVariants.length > 0 ? sortedVariants[0][1] : 1;

    sortedVariants.forEach(([name, count]) => {
      const percent = Math.round((count / maxVal) * 100);
      const varRow = document.createElement("div");
      varRow.style.cssText = `
        margin-bottom: 16px;
      `;
      varRow.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151; margin-bottom: 6px;">
          <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;" title="${name}">${name}</span>
          <span style="font-weight: 600; color: #4f46e5;">${count} sold</span>
        </div>
        <div style="background: #f3f4f6; height: 8px; border-radius: 9999px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #8b5cf6, #4f46e5); width: ${percent}%; height: 100%; border-radius: 9999px; transition: width 0.5s ease-out-in;"></div>
        </div>
      `;
      listContainer.appendChild(varRow);
    });
  }

  groupSelect.addEventListener("change", (e) => {
    updateVariantsList(e.target.value);
  });

  updateVariantsList("Default");

  container.appendChild(varCol);
}
