// Météorite v1 — client only, API Open‑Meteo (pas de clé nécessaire)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://djpigduzgtzlktpyhhgf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcGlnZHV6Z3R6bGt0cHloaGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTMwMzQsImV4cCI6MjA3NjcyOTAzNH0.xqxv2LGs-dXSXDg_ccXzhAY02lP8KxOZ_TpXXZlmAUQ';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentPlace = null;

const els = {
  content: document.getElementById('content'),
  locName: document.getElementById('loc-name'),
  locExtra: document.getElementById('loc-extra'),
  currentTemp: document.getElementById('current-temp'),
  currentDesc: document.getElementById('current-desc'),
  currentIcon: document.getElementById('current-icon'),
  wind: document.getElementById('current-wind'),
  humidity: document.getElementById('current-humidity'),
  apparent: document.getElementById('current-apparent'),
  pressure: document.getElementById('current-pressure'),
  updated: document.getElementById('updated'),
  hourly: document.getElementById('hourly'),
  form: document.getElementById('search-form'),
  search: document.getElementById('search'),
  suggestions: document.getElementById('suggestions'),
  addFavoriteBtn: document.getElementById('addFavoriteBtn'),
  createAlertBtn: document.getElementById('createAlertBtn')
};

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  return user;
}

// Mapping code météo -> description + icône (très simplifié)
const weatherMap = [
  { codes: [0], desc: 'Ciel dégagé', icon:'☀️' },
  { codes: [1,2], desc: 'Peu nuageux', icon:'🌤️' },
  { codes: [3], desc: 'Couvert', icon:'☁️' },
  { codes: [45,48], desc: 'Brouillard', icon:'🌫️' },
  { codes: [51,53,55,56,57], desc: 'Bruine', icon:'🌦️' },
  { codes: [61,63,65], desc: 'Pluie', icon:'🌧️' },
  { codes: [66,67], desc: 'Pluie verglaçante', icon:'🌨️' },
  { codes: [71,73,75,77], desc: 'Neige', icon:'❄️' },
  { codes: [80,81,82], desc: 'Averses', icon:'🌧️' },
  { codes: [85,86], desc: 'Averses de neige', icon:'❄️' },
  { codes: [95,96,99], desc: 'Orage', icon:'⛈️' },
];
function codeToInfo(code){
  const m = weatherMap.find(x=>x.codes.includes(code));
  return m || {desc:'—', icon:'⛅'};
}

async function geocode(q){
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('format', 'json');
  const res = await fetch(url, {headers:{'accept':'application/json'}});
  if(!res.ok) throw new Error('Erreur géocodage');
  return res.json();
}

async function getWeather(lat, lon, timezone){
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('timezone', timezone || 'auto');
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,weathercode');
  url.searchParams.set('forecast_days', '2');
  const res = await fetch(url, {headers:{'accept':'application/json'}});
  if(!res.ok) throw new Error('Erreur météo');
  return res.json();
}

function renderSuggestions(list){
  const box = els.suggestions;
  box.innerHTML = '';
  if(!list?.length){ box.classList.remove('show'); return; }
  for(const c of list){
    const btn = document.createElement('button');
    btn.type='button';
    btn.setAttribute('role','option');
    btn.textContent = `${c.name}${c.admin1 ? ', ' + c.admin1 : ''} — ${c.country}`;
    btn.addEventListener('click', ()=>{
      selectPlace(c);
      box.classList.remove('show');
    });
    box.appendChild(btn);
  }
  box.classList.add('show');
}

function hideSuggestionsSoon(){
  // Laisse le temps au clic de se produire
  setTimeout(()=>els.suggestions.classList.remove('show'), 120);
}

async function selectPlace(place){
  currentPlace = place;
  els.locName.textContent = `${place.name}`;
  els.locExtra.textContent = [place.admin1, place.country].filter(Boolean).join(' · ');
  els.content.hidden = false;
  try{
    const meteo = await getWeather(place.latitude, place.longitude, place.timezone);
    const cw = meteo.current_weather;
    const hourly = meteo.hourly;
    const idxNow = hourly.time.indexOf(cw.time);
    const hum = hourly.relative_humidity_2m[idxNow];
    const app = hourly.apparent_temperature[idxNow];
    const press = hourly.pressure_msl[idxNow];
    const info = codeToInfo(cw.weathercode);
    els.currentTemp.textContent = `${Math.round(cw.temperature)}°C`;
    els.currentDesc.textContent = info.desc;
    els.currentIcon.textContent = info.icon;
    els.wind.textContent = `${Math.round(cw.windspeed)} km/h`;
    els.humidity.textContent = `${Math.round(hum)}%`;
    els.apparent.textContent = `${Math.round(app)}°C`;
    els.pressure.textContent = `${Math.round(press)} hPa`;
    const dt = new Date(cw.time);
    els.updated.textContent = `Mis à jour : ${dt.toLocaleString([], {dateStyle:'medium', timeStyle:'short'})}`;
    renderHourly(hourly, idxNow);
    localStorage.setItem('meteorite:last', JSON.stringify(place));

    updateActionButtons();
  }catch(err){
    console.error(err);
    alert('Impossible de récupérer la météo. Réessayez plus tard.');
  }
}

async function updateActionButtons() {
  if (currentUser && currentPlace) {
    els.addFavoriteBtn.style.display = 'block';
    els.createAlertBtn.style.display = 'block';

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('city_name', currentPlace.name)
      .maybeSingle();

    if (data) {
      els.addFavoriteBtn.textContent = '⭐ Déjà en favori';
      els.addFavoriteBtn.disabled = true;
    } else {
      els.addFavoriteBtn.textContent = '⭐ Ajouter aux favoris';
      els.addFavoriteBtn.disabled = false;
    }
  } else {
    els.addFavoriteBtn.style.display = 'none';
    els.createAlertBtn.style.display = 'none';
  }
}

async function addToFavorites() {
  if (!currentUser) {
    alert('Vous devez être connecté pour ajouter des favoris');
    window.location.href = '/julien/login.html';
    return;
  }

  if (!currentPlace) return;

  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert([{
        user_id: currentUser.id,
        city_name: currentPlace.name,
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude
      }]);

    if (error) throw error;

    alert(`${currentPlace.name} ajouté aux favoris !`);
    updateActionButtons();
  } catch (err) {
    console.error(err);
    alert('Erreur lors de l\'ajout aux favoris');
  }
}

async function createAlert() {
  if (!currentUser) {
    alert('Vous devez être connecté pour créer des alertes');
    window.location.href = '/julien/login.html';
    return;
  }

  if (!currentPlace) return;

  window.location.href = `/alerts-page.html?city=${encodeURIComponent(currentPlace.name)}`;
}

if (els.addFavoriteBtn) {
  els.addFavoriteBtn.addEventListener('click', addToFavorites);
}

if (els.createAlertBtn) {
  els.createAlertBtn.addEventListener('click', createAlert);
}

function renderHourly(hourly, startIndex){
  els.hourly.innerHTML = '';
  const end = Math.min(hourly.time.length, (startIndex||0)+24);
  for(let i=startIndex;i<end;i++){
    const t = new Date(hourly.time[i]);
    const temp = Math.round(hourly.temperature_2m[i]);
    const wc = hourly.weathercode[i];
    const info = codeToInfo(wc);
    const div = document.createElement('div');
    div.className='hour';
    div.innerHTML = `<span>${t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                     <div class="icon" aria-hidden="true">${info.icon}</div>
                     <strong>${temp}°C</strong>`;
    els.hourly.appendChild(div);
  }
}

// recherche progressive
let debounce;
els.search.addEventListener('input', (e)=>{
  const q = e.target.value.trim();
  if(debounce) clearTimeout(debounce);
  if(!q){ els.suggestions.classList.remove('show'); return; }
  debounce = setTimeout(async ()=>{
    try{
      const data = await geocode(q);
      renderSuggestions(data.results?.slice(0,6));
    }catch(err){
      console.error(err);
    }
  }, 250);
});
els.search.addEventListener('blur', hideSuggestionsSoon);

// soumission (touche entrée)
els.form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const q = els.search.value.trim();
  if(!q) return;
  try{
    const data = await geocode(q);
    if(data.results?.length){
      selectPlace(data.results[0]);
    }else{
      alert('Aucun résultat 😕');
    }
  }catch(err){
    console.error(err);
    alert('Erreur de recherche.');
  }
});

// Initialisation
(async () => {
  await checkAuth();

  try{
    const last = JSON.parse(localStorage.getItem('meteorite:last')||'null');
    if(last?.latitude && last?.longitude){
      await selectPlace(last);
    }
  }catch{}
})();