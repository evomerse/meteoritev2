import { getCurrentUser, getUserProfile, signOut } from './supabase-client.js';
import { geocodeCity, getCurrentPosition, getWeatherData, getWeatherDescription, getCityNameFromCoords } from './weather-api.js';
import { addFavorite, isFavorite } from './favorites.js';
import { saveSearchHistory, getSearchHistory, saveLastLocation, getLastLocation, saveTheme, getTheme } from './storage.js';

let currentUser = null;
let currentProfile = null;
let currentLocation = { city: '', latitude: 0, longitude: 0 };

async function init() {
  currentUser = await getCurrentUser();

  if (currentUser) {
    currentProfile = await getUserProfile(currentUser.id);
    if (currentProfile) {
      document.getElementById('userName').textContent = currentProfile.first_name || currentProfile.email;
      document.getElementById('logoutBtn').style.display = 'inline-block';
      document.getElementById('loginBtn').style.display = 'none';
      applyTheme(currentProfile.theme_preference || 'light');
    }
  } else {
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    applyTheme(getTheme());
  }

  setupEventListeners();
  await loadDefaultWeather();
  displaySearchHistory();

  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
  }, 1000);
}

function setupEventListeners() {
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('citySearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  document.getElementById('geolocBtn').addEventListener('click', handleGeolocation);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('addFavoriteBtn').addEventListener('click', handleAddFavorite);
  document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
}

async function loadDefaultWeather() {
  try {
    const lastLocation = getLastLocation();
    if (lastLocation) {
      await loadWeather(lastLocation.lat, lastLocation.lon, false, lastLocation.city);
      return;
    }

    const position = await getCurrentPosition();
    await loadWeather(position.latitude, position.longitude, true);
  } catch (error) {
    await loadWeatherByCity('Paris');
  }
}

async function handleSearch() {
  const cityName = document.getElementById('citySearch').value.trim();

  if (!cityName) {
    showError('Veuillez entrer un nom de ville');
    return;
  }

  await loadWeatherByCity(cityName);
}

async function handleGeolocation() {
  try {
    showLoader();
    const position = await getCurrentPosition();
    await loadWeather(position.latitude, position.longitude, true);
    hideLoader();
  } catch (error) {
    hideLoader();
    showError('Impossible d\'obtenir votre position. Veuillez activer la géolocalisation.');
  }
}

async function loadWeatherByCity(cityName) {
  try {
    showLoader();
    const location = await geocodeCity(cityName);
    await loadWeather(location.latitude, location.longitude, false, location.name);
    hideLoader();
  } catch (error) {
    hideLoader();
    if (error.message === 'Ville introuvable') {
      showError('Ville introuvable. Veuillez vérifier l\'orthographe.');
    } else {
      showError('Erreur lors de la recherche de la ville');
    }
  }
}

async function loadWeather(latitude, longitude, isCurrentPosition = false, cityName = null) {
  try {
    const weatherData = await getWeatherData(latitude, longitude);

    if (!cityName && isCurrentPosition) {
      cityName = await getCityNameFromCoords(latitude, longitude);
    }

    currentLocation = {
      city: cityName || 'Position actuelle',
      latitude,
      longitude
    };

    saveLastLocation(currentLocation.city, latitude, longitude);
    saveSearchHistory(currentLocation.city, latitude, longitude);
    displaySearchHistory();

    displayWeather(weatherData, cityName || 'Position actuelle');

    if (currentUser) {
      const favorite = await isFavorite(currentUser.id, currentLocation.city);
      const addFavoriteBtn = document.getElementById('addFavoriteBtn');
      addFavoriteBtn.style.display = 'block';
      addFavoriteBtn.textContent = favorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris';
      addFavoriteBtn.disabled = favorite;
    }
  } catch (error) {
    showError('Erreur de récupération des données météo');
  }
}

function displayWeather(data, cityName) {
  const currentWeather = data.current_weather;
  const weatherInfo = getWeatherDescription(currentWeather.weathercode);

  document.getElementById('weatherLocation').textContent = cityName;
  document.getElementById('weatherDate').textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  document.getElementById('weatherIcon').textContent = weatherInfo.icon;
  document.getElementById('weatherTemp').textContent = Math.round(currentWeather.temperature) + '°C';
  document.getElementById('weatherDescription').textContent = weatherInfo.description;

  const currentHourIndex = new Date().getHours();
  document.getElementById('weatherPrecip').textContent = (data.hourly.precipitation[currentHourIndex] || 0) + ' mm';
  document.getElementById('weatherWind').textContent = Math.round(currentWeather.windspeed) + ' km/h';
  document.getElementById('weatherHumidity').textContent = '65%';

  displayForecast(data.daily);
}

function displayForecast(dailyData) {
  const forecastContainer = document.getElementById('forecastContainer');
  forecastContainer.innerHTML = '';

  for (let i = 1; i < Math.min(dailyData.time.length, 8); i++) {
    const date = new Date(dailyData.time[i]);
    const weatherInfo = getWeatherDescription(dailyData.weather_code[i]);

    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.style.textAlign = 'center';
    card.innerHTML = `
      <div style="font-weight: 600; color: var(--dark-blue); margin-bottom: 10px;">
        ${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
      <div style="font-size: 48px; margin: 10px 0;">${weatherInfo.icon}</div>
      <div style="font-size: 20px; font-weight: 600; color: var(--text-dark);">
        ${Math.round(dailyData.temperature_2m_max[i])}° / ${Math.round(dailyData.temperature_2m_min[i])}°
      </div>
      <div style="font-size: 12px; color: var(--text-light); margin-top: 5px;">
        ${weatherInfo.description}
      </div>
    `;
    forecastContainer.appendChild(card);
  }

  document.getElementById('forecastSection').style.display = 'block';
}

function displaySearchHistory() {
  const history = getSearchHistory();
  const historyContainer = document.getElementById('historyContainer');
  const historySection = document.getElementById('historySection');

  if (!history || history.length === 0) {
    historySection.style.display = 'none';
    return;
  }

  historySection.style.display = 'block';
  historyContainer.innerHTML = '';

  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-city">${item.city}</div>
      <div class="history-time">${getRelativeTime(item.timestamp)}</div>
    `;
    card.addEventListener('click', () => {
      loadWeather(item.lat, item.lon, false, item.city);
    });
    historyContainer.appendChild(card);
  });
}

function getRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

async function handleAddFavorite() {
  if (!currentUser || !currentLocation.city) {
    showError('Veuillez vous connecter pour ajouter des favoris');
    return;
  }

  try {
    await addFavorite(currentUser.id, currentLocation.city, currentLocation.latitude, currentLocation.longitude);
    showSuccess('Ville ajoutée aux favoris');
    document.getElementById('addFavoriteBtn').textContent = 'Déjà dans les favoris';
    document.getElementById('addFavoriteBtn').disabled = true;
  } catch (error) {
    showError('Erreur lors de l\'ajout aux favoris');
  }
}

async function handleLogout() {
  try {
    await signOut();
    window.location.reload();
  } catch (error) {
    showError('Erreur lors de la déconnexion');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  saveTheme(newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}

function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.className = 'error-message';
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.className = 'success-message';
  successDiv.style.display = 'block';
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 5000);
}

init();
