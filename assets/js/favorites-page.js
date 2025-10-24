import { getCurrentUser, getUserProfile, signOut } from './supabase-client.js';
import { getFavorites, removeFavorite } from './favorites.js';
import { getWeatherData, getWeatherDescription } from './weather-api.js';
import { saveTheme, getTheme } from './storage.js';

let currentUser = null;
let currentProfile = null;

async function init() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    document.getElementById('loginRequired').style.display = 'block';
    document.getElementById('favoritesContainer').style.display = 'none';
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
    }, 500);
    return;
  }

  currentProfile = await getUserProfile(currentUser.id);

  if (currentProfile) {
    document.getElementById('userName').textContent = currentProfile.first_name || currentProfile.email;
    applyTheme(currentProfile.theme_preference || getTheme());
  }

  setupEventListeners();
  await loadFavorites();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 500);
}

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
  document.getElementById('navMenu').classList.toggle('active');
}

async function loadFavorites() {
  try {
    const favorites = await getFavorites(currentUser.id);
    await displayFavorites(favorites);
  } catch (error) {
    showError('Erreur lors du chargement des favoris');
  }
}

async function displayFavorites(favorites) {
  const container = document.getElementById('favoritesContainer');
  container.style.display = 'block';

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⭐</div>
        <div class="empty-state-title">Aucun favori enregistré</div>
        <div class="empty-state-text">Ajoutez des villes à vos favoris depuis la page météo</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '<div class="grid grid-3" id="favoritesGrid"></div>';
  const grid = document.getElementById('favoritesGrid');

  for (const favorite of favorites) {
    try {
      const weatherData = await getWeatherData(favorite.latitude, favorite.longitude);
      const currentWeather = weatherData.current_weather;
      const weatherInfo = getWeatherDescription(currentWeather.weathercode);

      const card = document.createElement('div');
      card.className = 'favorite-card';
      card.innerHTML = `
        <div class="favorite-card-header">
          <div class="favorite-city-name">${favorite.city_name}</div>
          <button class="favorite-remove" onclick="window.removeFavoriteConfirm('${favorite.id}')" title="Retirer">
            ✕
          </button>
        </div>
        <div class="favorite-card-body">
          <div class="favorite-icon">${weatherInfo.icon}</div>
          <div>
            <div class="favorite-temp">${Math.round(currentWeather.temperature)}°C</div>
            <div class="favorite-description">${weatherInfo.description}</div>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-remove')) {
          window.location.href = `/main.html?city=${encodeURIComponent(favorite.city_name)}`;
        }
      });

      grid.appendChild(card);
    } catch (error) {
      console.error(`Error loading weather for ${favorite.city_name}`);
    }
  }
}

window.removeFavoriteConfirm = async function(favoriteId) {
  event.stopPropagation();

  if (confirm('Retirer cette ville de vos favoris ?')) {
    try {
      await removeFavorite(favoriteId);
      showSuccess('Favori supprimé');
      await loadFavorites();
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  }
};

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/main.html';
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
  document.getElementById('themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.className = 'error-message';
  errorDiv.style.display = 'block';
  setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.className = 'success-message';
  successDiv.style.display = 'block';
  setTimeout(() => successDiv.style.display = 'none', 5000);
}

init();
