window.ebaySelectors = {
  searchListings: ".su-card-container__content, .s-item__info, .s-item__details, .s-item",
  searchLink: "a.s-item__link[href*='/itm/'], a[href*='/itm/']",
  listingContainer: "[data-listingid], .s-item, .s-item__wrapper",
  
  storeCards: ".s-item, .str-item-card, .grid-item, .str-grid-item",
  storeLink: "a[href*='/itm/']",
  
  carouselItems: "ul.carousel__list > li, ul[class*='carousel'] > li, li.carousel__snap-point, .carousel__item, .merch-item, .vi-merch-item, .m-item, .pvc-item, [class*='merch-'], [class*='carousel__cell'], [class*='carousel__item'], [class*='recommendation']",
  carouselLink: "a[href*='/itm/']",
  
  activeListingsQuantityCell: "td.shui-dt-column__soldQuantity, td[data-column='soldQuantity'], td.soldQuantity",
  activeListingsTextCol: ".shui-dt--text-column, div",
  activeListingsRow: "tr",
  activeListingsLink: "a[href*='/itm']"
};
