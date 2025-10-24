const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

export async function geocodeCity(cityName) {
  try {
    const response = await fetch(`${NOMINATIM_API}?q=${encodeURIComponent(cityName)}&format=json&limit=1`);

    if (!response.ok) {
      throw new Error('Erreur de géocodage');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Ville introuvable');
    }

    return {
      name: data[0].display_name.split(',')[0],
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error('Erreur de géolocalisation'));
      }
    );
  });
}

export async function getWeatherData(latitude, longitude) {
  try {
    const url = `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur de récupération des données météo');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
}

export function getWeatherDescription(weatherCode) {
  const weatherDescriptions = {
    0: { description: 'Ciel dégagé', icon: '☀️' },
    1: { description: 'Principalement dégagé', icon: '🌤️' },
    2: { description: 'Partiellement nuageux', icon: '⛅' },
    3: { description: 'Couvert', icon: '☁️' },
    45: { description: 'Brouillard', icon: '🌫️' },
    48: { description: 'Brouillard givrant', icon: '🌫️' },
    51: { description: 'Bruine légère', icon: '🌦️' },
    53: { description: 'Bruine modérée', icon: '🌦️' },
    55: { description: 'Bruine dense', icon: '🌦️' },
    61: { description: 'Pluie légère', icon: '🌧️' },
    63: { description: 'Pluie modérée', icon: '🌧️' },
    65: { description: 'Pluie forte', icon: '🌧️' },
    71: { description: 'Chute de neige légère', icon: '🌨️' },
    73: { description: 'Chute de neige modérée', icon: '🌨️' },
    75: { description: 'Chute de neige forte', icon: '🌨️' },
    77: { description: 'Grains de neige', icon: '🌨️' },
    80: { description: 'Averses légères', icon: '🌦️' },
    81: { description: 'Averses modérées', icon: '🌦️' },
    82: { description: 'Averses violentes', icon: '⛈️' },
    85: { description: 'Averses de neige légères', icon: '🌨️' },
    86: { description: 'Averses de neige fortes', icon: '🌨️' },
    95: { description: 'Orage', icon: '⛈️' },
    96: { description: 'Orage avec grêle légère', icon: '⛈️' },
    99: { description: 'Orage avec grêle forte', icon: '⛈️' }
  };

  return weatherDescriptions[weatherCode] || { description: 'Inconnu', icon: '❓' };
}

export async function getCityNameFromCoords(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);

    if (!response.ok) {
      return 'Position actuelle';
    }

    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.village || 'Position actuelle';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Position actuelle';
  }
}
