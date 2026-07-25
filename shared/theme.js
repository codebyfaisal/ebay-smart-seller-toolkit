window.ThemeManager = {
  isExtension: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,
  
  applyTheme: function(theme, iconElement = null, isBody = false) {
    if (isBody) {
      if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
      } else {
        document.body.removeAttribute('data-theme');
      }
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (iconElement) {
      if (theme === 'light') {
        iconElement.innerHTML = '<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />';
      } else {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
      }
    }
  },

  initTheme: function(iconElement = null, isBody = false) {
    if (this.isExtension) {
      chrome.storage.local.get(['themePreference'], (result) => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        this.applyTheme(result.themePreference || 'dark', iconElement, isBody);
      });

      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.themePreference) {
          this.applyTheme(changes.themePreference.newValue || 'dark', iconElement, isBody);
        }
      });
    } else {
      this.applyTheme(localStorage.getItem('themePreference') || 'dark', iconElement, isBody);
    }
  },

  toggleTheme: function(iconElement = null, isBody = false) {
    const target = isBody ? document.body : document.documentElement;
    const currentTheme = target.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.applyTheme(newTheme, iconElement, isBody);
    
    if (this.isExtension) {
      chrome.storage.local.set({ themePreference: newTheme }, () => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
      });
    } else {
      localStorage.setItem('themePreference', newTheme);
    }
  }
};
