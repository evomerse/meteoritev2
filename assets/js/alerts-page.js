import { getCurrentUser, getUserProfile, signOut } from './supabase-client.js';
import { getAlerts, createAlert, updateAlert, deleteAlert, getAlertTypeLabel, getAlertUnit } from './alerts.js';
import { geocodeCity } from './weather-api.js';

let currentUser = null;
let currentProfile = null;

async function init() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login-page.html';
    return;
  }

  currentProfile = await getUserProfile(currentUser.id);

  if (currentProfile) {
    document.getElementById('userName').textContent = currentProfile.first_name || currentProfile.email;
    applyTheme(currentProfile.theme_preference || 'light');
  }

  setupEventListeners();
  await loadAlerts();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 500);
}

function setupEventListeners() {
  document.getElementById('createAlertBtn').addEventListener('click', openModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelAlertBtn').addEventListener('click', closeModal);
  document.getElementById('saveAlertBtn').addEventListener('click', handleSaveAlert);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);

  document.getElementById('alertType').addEventListener('change', updateAlertUnit);

  document.getElementById('alertModal').addEventListener('click', (e) => {
    if (e.target.id === 'alertModal') closeModal();
  });
}

function toggleMobileMenu() {
  document.getElementById('navMenu').classList.toggle('active');
}

function updateAlertUnit() {
  const alertType = document.getElementById('alertType').value;
  const unitText = document.getElementById('alertUnit');

  if (alertType) {
    const unit = getAlertUnit(alertType);
    unitText.textContent = `Unité: ${unit}`;
  } else {
    unitText.textContent = '';
  }
}

async function loadAlerts() {
  try {
    const alerts = await getAlerts(currentUser.id);
    displayAlerts(alerts);
  } catch (error) {
    showError('Erreur lors du chargement des alertes');
  }
}

function displayAlerts(alerts) {
  const container = document.getElementById('alertsContainer');

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔔</div>
        <div class="empty-state-title">Aucune alerte configurée</div>
        <div class="empty-state-text">Créez des alertes pour être notifié des conditions météo importantes</div>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert-card ${alert.alert_type}">
      <div class="alert-card-header">
        <div class="alert-type">${getAlertTypeLabel(alert.alert_type)}</div>
        <span class="alert-status ${alert.is_active ? 'active' : 'inactive'}">
          ${alert.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="alert-card-body">
        <div class="alert-location">📍 ${alert.city_name}</div>
        <div class="alert-condition">
          Si ${getAlertTypeLabel(alert.alert_type).toLowerCase()} ${alert.condition_operator} ${alert.condition_value} ${getAlertUnit(alert.alert_type)}
        </div>
      </div>
      <div class="alert-card-footer">
        <button class="btn-secondary" onclick="window.toggleAlertStatus('${alert.id}', ${!alert.is_active})">
          ${alert.is_active ? 'Désactiver' : 'Activer'}
        </button>
        <button class="btn-danger" onclick="window.deleteAlertConfirm('${alert.id}')">
          Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleAlertStatus = async function(alertId, isActive) {
  try {
    await updateAlert(alertId, { is_active: isActive });
    showSuccess(`Alerte ${isActive ? 'activée' : 'désactivée'}`);
    await loadAlerts();
  } catch (error) {
    showError('Erreur lors de la modification de l\'alerte');
  }
};

window.deleteAlertConfirm = async function(alertId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
    try {
      await deleteAlert(alertId);
      showSuccess('Alerte supprimée');
      await loadAlerts();
    } catch (error) {
      showError('Erreur lors de la suppression de l\'alerte');
    }
  }
};

function openModal() {
  document.getElementById('alertModal').classList.add('active');
}

function closeModal() {
  document.getElementById('alertModal').classList.remove('active');
  document.getElementById('alertForm').reset();
  document.getElementById('alertUnit').textContent = '';
}

async function handleSaveAlert() {
  const cityName = document.getElementById('alertCity').value.trim();
  const alertType = document.getElementById('alertType').value;
  const alertOperator = document.getElementById('alertOperator').value;
  const alertValue = document.getElementById('alertValue').value;

  if (!cityName || !alertType || !alertOperator || !alertValue) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  try {
    const location = await geocodeCity(cityName);

    await createAlert(
      currentUser.id,
      location.name,
      location.latitude,
      location.longitude,
      alertType,
      alertOperator,
      alertValue
    );

    showSuccess('Alerte créée avec succès !');
    closeModal();
    await loadAlerts();
  } catch (error) {
    if (error.message === 'Ville introuvable') {
      showError('Ville introuvable. Veuillez vérifier l\'orthographe.');
    } else {
      showError('Erreur lors de la création de l\'alerte');
    }
  }
}

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/login-page.html';
  } catch (error) {
    showError('Erreur lors de la déconnexion');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
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
