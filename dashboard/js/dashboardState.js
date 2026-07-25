export const state = {
  activeOrdersList: [],
  dateQueryVal: '',
  activeTargetDateStr: '',
  activeTab: 'daily', // 'daily' or 'multi'
  currentSortCol: '', // 'qty', 'price', 'date'
  currentSortDir: 'desc', // 'asc', 'desc'
  dailyPage: 1,
  dailyItemsPerPage: 20,
  analyzerPage: 1,
  analyzerItemsPerPage: 20,
  lastAnalyzedProducts: [], // cache for analyzer pagination
  analyzerAllowedDates: null
};
