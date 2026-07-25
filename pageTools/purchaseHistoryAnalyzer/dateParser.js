function parseEbayDate(dateText) {
  let cleanDate = dateText.replace(/\s+/g, " ");
  const parts = cleanDate.split(/ at |\b\d{1,2}:\d{2}/);
  if (parts.length > 0) {
    cleanDate = parts[0].trim().replace(/,$/, "");
  }

  const parsed = Date.parse(cleanDate);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}
