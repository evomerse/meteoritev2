// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuration Supabase
const supabaseUrl = 'https://djpigduzgtzlktpyhhgf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcGlnZHV6Z3R6bGt0cHloaGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTMwMzQsImV4cCI6MjA3NjcyOTAzNH0.xqxv2LGs-dXSXDg_ccXzhAY02lP8KxOZ_TpXXZlmAUQ';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentLocation = { city: '', lat: 0, lon: 0 };

async function init() {
    console.log('Init app');
    currentUser = await getCurrentUser();

    if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        if (profile) {
            document.getElementById('userName').textContent = profile.first_name || profile.email;
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('authButtons').style.display = 'none';
        }
    } else {
        document.getElementById('authButtons').style.display = 'flex';
    }

    setupEventListeners();
    await loadDefaultWeather();
    displaySearchHistory();

    setTimeout(() => {
        const loader = document.getElementById('site-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }
    }, 1000);
}

function setupEventListeners() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);

    const cityInput = document.getElementById('citySearch');
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        cityInput.addEventListener('input', handleAutocomplete);
        cityInput.addEventListener('focus', handleAutocomplete);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                hideAutocomplete();
            }
        });
    }

    document.getElementById('geolocBtn')?.addEventListener('click', handleGeolocation);
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('mobileMenuToggle')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('addFavoriteBtn')?.addEventListener('click', handleAddFavorite);
}

function toggleMobileMenu() {
    document.getElementById('navMenu')?.classList.toggle('active');
}

const popularCities = [
    { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'Marseille', country: 'France', lat: 43.2965, lon: 5.3698 },
    { name: 'Lyon', country: 'France', lat: 45.7640, lon: 4.8357 },
    { name: 'Toulouse', country: 'France', lat: 43.6047, lon: 1.4442 },
    { name: 'Nice', country: 'France', lat: 43.7102, lon: 7.2620 },
    { name: 'Nantes', country: 'France', lat: 47.2184, lon: -1.5536 },
    { name: 'Strasbourg', country: 'France', lat: 48.5734, lon: 7.7521 },
    { name: 'Bordeaux', country: 'France', lat: 44.8378, lon: -0.5792 },
    { name: 'Lille', country: 'France', lat: 50.6292, lon: 3.0573 },
    { name: 'Rennes', country: 'France', lat: 48.1173, lon: -1.6778 },
    { name: 'Montpellier', country: 'France', lat: 43.6108, lon: 3.8767 },
    { name: 'Reims', country: 'France', lat: 49.2583, lon: 4.0317 },
    { name: 'Le Havre', country: 'France', lat: 49.4944, lon: 0.1079 },
    { name: 'Dijon', country: 'France', lat: 47.3220, lon: 5.0415 },
    { name: 'Grenoble', country: 'France', lat: 45.1885, lon: 5.7245 },
    { name: 'Angers', country: 'France', lat: 47.4784, lon: -0.5632 },
    { name: 'Toulon', country: 'France', lat: 43.1242, lon: 5.9280 },
    { name: 'Brest', country: 'France', lat: 48.3904, lon: -4.4861 },
    { name: 'Clermont-Ferrand', country: 'France', lat: 45.7772, lon: 3.0870 },
    { name: 'Rouen', country: 'France', lat: 49.4432, lon: 1.0993 }
];

let autocompleteTimeout;

async function handleAutocomplete(e) {
    clearTimeout(autocompleteTimeout);
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
        hideAutocomplete();
        return;
    }

    autocompleteTimeout = setTimeout(async () => {
        const filtered = popularCities.filter(city =>
            city.name.toLowerCase().startsWith(query) ||
            city.name.toLowerCase().includes(query)
        ).slice(0, 8);

        if (query.length >= 3) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`
                );
                const data = await response.json();

                const apiCities = data
                    .filter(item => item.type === 'city' || item.type === 'town' || item.type === 'village')
                    .map(item => ({
                        name: item.name || item.display_name.split(',')[0],
                        country: item.display_name.split(',').pop().trim(),
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon)
                    }));

                const combined = [...filtered];
                apiCities.forEach(apiCity => {
                    if (!combined.some(c => c.name === apiCity.name)) {
                        combined.push(apiCity);
                    }
                });

                showAutocomplete(combined.slice(0, 10));
            } catch (error) {
                showAutocomplete(filtered);
            }
        } else {
            showAutocomplete(filtered);
        }
    }, 300);
}

function showAutocomplete(cities) {
    const list = document.getElementById('autocompleteList');
    if (!list || cities.length === 0) {
        hideAutocomplete();
        return;
    }

    list.innerHTML = cities.map(city => `
        <div class="autocomplete-item" data-city="${city.name}" data-lat="${city.lat}" data-lon="${city.lon}">
            <span class="autocomplete-city">${city.name}</span>
            <span class="autocomplete-country">${city.country}</span>
        </div>
    `).join('');

    list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const cityName = item.dataset.city;
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);

            document.getElementById('citySearch').value = cityName;
            loadWeather(lat, lon, false, cityName);
            hideAutocomplete();
        });
    });

    list.style.display = 'block';
}

function hideAutocomplete() {
    const list = document.getElementById('autocompleteList');
    if (list) {
        list.style.display = 'none';
    }
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
    } catch {
        await loadWeatherByCity('Paris');
    }
}

async function handleSearch() {
    const cityName = document.getElementById('citySearch')?.value.trim();
    if (!cityName) {
        showError('Veuillez entrer un nom de ville');
        return;
    }
    await loadWeatherByCity(cityName);
}

async function handleGeolocation() {
    try {
        const position = await getCurrentPosition();
        await loadWeather(position.latitude, position.longitude, true);
    } catch {
        showError('Impossible d\'obtenir votre position');
    }
}

async function loadWeatherByCity(cityName) {
    try {
        const location = await geocodeCity(cityName);
        await loadWeather(location.latitude, location.longitude, false, location.name);
    } catch (error) {
        showError(error.message === 'Ville introuvable' ? 'Ville introuvable' : 'Erreur de recherche');
    }
}

async function loadWeather(latitude, longitude, isCurrentPosition = false, cityName = null) {
    try {
        if (!cityName && isCurrentPosition) {
            cityName = await getCityNameFromCoords(latitude, longitude);
        }

        const weatherData = await getWeatherData(latitude, longitude);

        currentLocation = { city: cityName || 'Position actuelle', lat: latitude, lon: longitude };

        saveLastLocation(currentLocation.city, latitude, longitude);
        saveSearchHistory(currentLocation.city, latitude, longitude);
        displaySearchHistory();
        displayWeather(weatherData, cityName || 'Position actuelle');

        if (currentUser) {
            const favorite = await isFavorite(currentUser.id, currentLocation.city);
            const btn = document.getElementById('addFavoriteBtn');
            if (btn) {
                btn.style.display = 'block';
                btn.textContent = favorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris';
                btn.disabled = favorite;
            }
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
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById('weatherIcon').textContent = weatherInfo.icon;
    document.getElementById('weatherTemp').textContent = Math.round(currentWeather.temperature) + '°C';
    document.getElementById('weatherDescription').textContent = weatherInfo.description;

    const currentHourIndex = new Date().getHours();
    document.getElementById('weatherPrecip').textContent = (data.hourly.precipitation[currentHourIndex] || 0).toFixed(1) + ' mm';
    document.getElementById('weatherWind').textContent = Math.round(currentWeather.windspeed) + ' km/h';

    displayForecast(data.daily);
}

function displayForecast(dailyData) {
    const container = document.getElementById('forecastContainer');
    if (!container) return;

    container.innerHTML = '';

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
        container.appendChild(card);
    }

    document.getElementById('forecastSection').style.display = 'block';
}

function displaySearchHistory() {
    const history = getSearchHistory();
    const container = document.getElementById('historyContainer');
    const section = document.getElementById('historySection');

    if (!container || !section || !history || history.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-city">${item.city}</div>
            <div class="history-time">${getRelativeTime(item.timestamp)}</div>
        `;
        card.addEventListener('click', () => loadWeather(item.lat, item.lon, false, item.city));
        container.appendChild(card);
    });
}

async function handleAddFavorite() {
    if (!currentUser) {
        showError('Veuillez vous connecter');
        return;
    }

    try {
        await addFavorite(currentUser.id, currentLocation.city, currentLocation.lat, currentLocation.lon);
        showSuccess('Ajouté aux favoris');
        const btn = document.getElementById('addFavoriteBtn');
        if (btn) {
            btn.textContent = 'Déjà dans les favoris';
            btn.disabled = true;
        }
    } catch {
        showError('Erreur');
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('meteorite_theme', newTheme);
}

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
            () => reject(new Error('Erreur'))
        );
    });
}

async function getWeatherData(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur API');
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
        1: { description: 'Dégagé', icon: '🌤' },
        2: { description: 'Nuageux', icon: '⛅' },
        3: { description: 'Couvert', icon: '☁️' },
        45: { description: 'Brouillard', icon: '🌫' },
        61: { description: 'Pluie légère', icon: '🌧' },
        63: { description: 'Pluie modérée', icon: '🌧' },
        65: { description: 'Pluie forte', icon: '🌧' },
        71: { description: 'Neige légère', icon: '🌨' },
        95: { description: 'Orage', icon: '⛈' }
    };
    return descriptions[weatherCode] || { description: 'Inconnu', icon: '❓' };
}

function saveSearchHistory(city, lat, lon) {
    const history = getSearchHistory();
    const filtered = history.filter(h => h.city !== city);
    filtered.unshift({ city, lat, lon, timestamp: new Date().toISOString() });
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

function getRelativeTime(timestamp) {
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
}

function showError(message) {
    const el = document.getElementById('errorMessage');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 5000);
    }
}

function showSuccess(message) {
    const el = document.getElementById('successMessage');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 5000);
    }
}

init();
