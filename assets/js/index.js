// Import Supabase client depuis CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuration Supabase
const supabaseUrl = 'https://immzstqtbkdiqxuggmcz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbXpzdHF0YmtkaXF4dWdnbWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzUzNDMsImV4cCI6MjA3Njg1MTM0M30.J2mZ9yfhuIbRSFfiPwRaNnAICSxU3JjWyP8be68MApo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Variables globales
let currentUser = null;
let currentLocation = { city: '', lat: 0, lon: 0 };

// Initialisation de l'application
async function init() {
    // Vérifier l'utilisateur connecté
    currentUser = await getCurrentUser();

    if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        if (profile) {
            document.getElementById('userName').textContent = profile.first_name || profile.email;
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('loginBtn').style.display = 'none';
            applyTheme(profile.theme_preference || 'light');
        }
    } else {
        document.getElementById('loginBtn').style.display = 'inline-block';
        applyTheme(getStoredTheme());
    }

    setupEventListeners();
    await loadDefaultWeather();
    displaySearchHistory();

    // Masquer le loader après 1 seconde
    setTimeout(() => {
        const loader = document.getElementById('site-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }
    }, 1000);
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('citySearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('geolocBtn').addEventListener('click', handleGeolocation);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const addFavoriteBtn = document.getElementById('addFavoriteBtn');
    if (addFavoriteBtn) {
        addFavoriteBtn.addEventListener('click', handleAddFavorite);
    }
}

// Gestion du menu mobile
function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

// Charger la météo par défaut
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

// Gérer la recherche
async function handleSearch() {
    const cityName = document.getElementById('citySearch').value.trim();
    if (!cityName) {
        showError('Veuillez entrer un nom de ville');
        return;
    }
    await loadWeatherByCity(cityName);
}

// Gérer la géolocalisation
async function handleGeolocation() {
    try {
        const position = await getCurrentPosition();
        await loadWeather(position.latitude, position.longitude, true);
    } catch (error) {
        showError('Impossible d\'obtenir votre position');
    }
}

// Charger la météo d'une ville
async function loadWeatherByCity(cityName) {
    try {
        const location = await geocodeCity(cityName);
        await loadWeather(location.latitude, location.longitude, false, location.name);
    } catch (error) {
        if (error.message === 'Ville introuvable') {
            showError('Ville introuvable');
        } else {
            showError('Erreur lors de la recherche');
        }
    }
}

// Charger la météo
async function loadWeather(latitude, longitude, isCurrentPosition = false, cityName = null) {
    try {
        const weatherData = await getWeatherData(latitude, longitude);

        if (!cityName && isCurrentPosition) {
            cityName = await getCityNameFromCoords(latitude, longitude);
        }

        currentLocation = { city: cityName || 'Position actuelle', lat: latitude, lon: longitude };

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

// Afficher la météo
function displayWeather(data, cityName) {
    const currentWeather = data.current_weather;
    const weatherInfo = getWeatherDescription(currentWeather.weathercode);

    document.getElementById('weatherLocation').textContent = cityName;
    document.getElementById('weatherDate').textContent = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById('weatherIcon').textContent = weatherInfo.icon;
    document.getElementById('weatherTemp').textContent = Math.round(currentWeather.temperature) + '°C';
    document.getElementById('weatherDescription').textContent = weatherInfo.description;

    const currentHourIndex = new Date().getHours();
    document.getElementById('weatherPrecip').textContent = (data.hourly.precipitation[currentHourIndex] || 0) + ' mm';
    document.getElementById('weatherWind').textContent = Math.round(currentWeather.windspeed) + ' km/h';

    displayForecast(data.daily);
}

// Afficher les prévisions
function displayForecast(dailyData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    for (let i = 1; i < Math.min(dailyData.time.length, 8); i++) {
        const date = new Date(dailyData.time[i]);
        const weatherInfo = getWeatherDescription(dailyData.weather_code[i]);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</div>
            <div class="forecast-icon">${weatherInfo.icon}</div>
            <div class="forecast-temp">${Math.round(dailyData.temperature_2m_max[i])}° / ${Math.round(dailyData.temperature_2m_min[i])}°</div>
            <div class="forecast-desc">${weatherInfo.description}</div>
        `;
        forecastContainer.appendChild(card);
    }

    document.getElementById('forecastSection').style.display = 'block';
}

// Afficher l'historique des recherches
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
        card.addEventListener('click', () => loadWeather(item.lat, item.lon, false, item.city));
        historyContainer.appendChild(card);
    });
}

// Ajouter aux favoris
async function handleAddFavorite() {
    if (!currentUser) {
        showError('Veuillez vous connecter pour ajouter des favoris');
        return;
    }

    try {
        await addFavorite(currentUser.id, currentLocation.city, currentLocation.lat, currentLocation.lon);
        showSuccess('Ville ajoutée aux favoris');
        document.getElementById('addFavoriteBtn').textContent = 'Déjà dans les favoris';
        document.getElementById('addFavoriteBtn').disabled = true;
    } catch (error) {
        showError('Erreur lors de l\'ajout aux favoris');
    }
}

// Déconnexion
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.reload();
    } catch (error) {
        showError('Erreur lors de la déconnexion');
    }
}

// Basculer le thème
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme(newTheme);
}

// Appliquer le thème
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

// Fonctions utilitaires Supabase
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getUserProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
}

async function isFavorite(userId, cityName) {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('city_name', cityName).maybeSingle();
    return !!data;
}

async function addFavorite(userId, cityName, latitude, longitude) {
    const { error } = await supabase.from('favorites').insert([{ user_id: userId, city_name: cityName, latitude, longitude }]);
    if (error) throw error;
}

// Fonctions API météo
async function geocodeCity(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`);
    const data = await response.json();
    if (!data || data.length === 0) throw new Error('Ville introuvable');
    return { name: data[0].display_name.split(',')[0], latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
}

async function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => reject(new Error('Erreur de géolocalisation'))
        );
    });
}

async function getWeatherData(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur de récupération des données météo');
    return await response.json();
}

async function getCityNameFromCoords(latitude, longitude) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await response.json();
        return data.address?.city || data.address?.town || 'Position actuelle';
    } catch {
        return 'Position actuelle';
    }
}

function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: { description: 'Ciel dégagé', icon: '☀️' },
        1: { description: 'Principalement dégagé', icon: '🌤' },
        2: { description: 'Partiellement nuageux', icon: '⛅' },
        3: { description: 'Couvert', icon: '☁️' },
        45: { description: 'Brouillard', icon: '🌫' },
        61: { description: 'Pluie légère', icon: '🌧' },
        63: { description: 'Pluie modérée', icon: '🌧' },
        65: { description: 'Pluie forte', icon: '🌧' },
        71: { description: 'Neige légère', icon: '🌨' },
        95: { description: 'Orage', icon: '⛈' }
    };
    return descriptions[weatherCode] || { description: 'Inconnu', icon: '?' };
}

// Fonctions localStorage
function saveSearchHistory(city, lat, lon) {
    const history = getSearchHistory();
    const newEntry = { city, lat, lon, timestamp: new Date().toISOString() };
    const filtered = history.filter(h => h.city !== city);
    filtered.unshift(newEntry);
    localStorage.setItem('meteorite_history', JSON.stringify(filtered.slice(0, 10)));
}

function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem('meteorite_history') || '[]');
    } catch {
        return [];
    }
}

function saveLastLocation(city, lat, lon) {
    localStorage.setItem('meteorite_last_location', JSON.stringify({ city, lat, lon }));
}

function getLastLocation() {
    try {
        return JSON.parse(localStorage.getItem('meteorite_last_location'));
    } catch {
        return null;
    }
}

function saveTheme(theme) {
    localStorage.setItem('meteorite_theme', theme);
}

function getStoredTheme() {
    return localStorage.getItem('meteorite_theme') || 'light';
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

// Fonctions d'affichage des messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 5000);
}

// Initialiser l'application
init();
