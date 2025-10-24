const STORAGE_KEYS = {
  SEARCH_HISTORY: 'meteorite_search_history',
  LAST_LOCATION: 'meteorite_last_location',
  THEME: 'meteorite_theme'
};

export function saveSearchHistory(cityName, latitude, longitude) {
  try {
    const history = getSearchHistory();
    const newEntry = {
      city: cityName,
      lat: latitude,
      lon: longitude,
      timestamp: new Date().toISOString()
    };

    const filtered = history.filter(h => h.city !== cityName);
    filtered.unshift(newEntry);

    const limited = filtered.slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

export function getSearchHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
}

export function saveLastLocation(cityName, latitude, longitude) {
  try {
    const location = { city: cityName, lat: latitude, lon: longitude };
    localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(location));
  } catch (error) {
    console.error('Error saving last location:', error);
  }
}

export function getLastLocation() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading last location:', error);
    return null;
  }
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}
