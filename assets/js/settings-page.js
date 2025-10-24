import { getCurrentUser, getUserProfile, signOut, supabase } from './supabase-client.js';
import { saveTheme, getTheme } from './storage.js';

let currentUser = null;
let currentProfile = null;

async function init() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    document.getElementById('loginRequired').style.display = 'block';
    document.getElementById('settingsContent').style.display = 'none';
    setTimeout(() => document.getElementById('loader').classList.add('hidden'), 500);
    return;
  }

  currentProfile = await getUserProfile(currentUser.id);

  if (currentProfile) {
    document.getElementById('userName').textContent = currentProfile.first_name || currentProfile.email;
    document.getElementById('userEmail').value = currentProfile.email;
    document.getElementById('firstName').value = currentProfile.first_name || '';

    const isDarkMode = currentProfile.theme_preference === 'dark';
    document.getElementById('darkModeToggle').checked = isDarkMode;
    applyTheme(currentProfile.theme_preference || getTheme());
  }

  document.getElementById('settingsContent').style.display = 'block';

  setupEventListeners();

  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 500);
}

function setupEventListeners() {
  document.getElementById('updateProfileBtn').addEventListener('click', handleUpdateProfile);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('darkModeToggle').addEventListener('change', handleThemeChange);
  document.getElementById('mobileMenuToggle').addEventListener('click', () => document.getElementById('navMenu').classList.toggle('active'));
}

async function handleUpdateProfile() {
  const firstName = document.getElementById('firstName').value.trim();

  if (!firstName) {
    showError('Le prénom ne peut pas être vide');
    return;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName })
      .eq('id', currentUser.id);

    if (error) throw error;

    showSuccess('Profil mis à jour');
    currentProfile.first_name = firstName;
    document.getElementById('userName').textContent = firstName;
  } catch (error) {
    showError('Erreur lors de la mise à jour');
  }
}

async function handleThemeChange(e) {
  const isDarkMode = e.target.checked;
  const newTheme = isDarkMode ? 'dark' : 'light';

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ theme_preference: newTheme })
      .eq('id', currentUser.id);

    if (error) throw error;

    applyTheme(newTheme);
    saveTheme(newTheme);
  } catch (error) {
    showError('Erreur lors de la sauvegarde du thème');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.getElementById('darkModeToggle').checked = newTheme === 'dark';
  applyTheme(newTheme);
  saveTheme(newTheme);

  if (currentUser) {
    supabase.from('profiles').update({ theme_preference: newTheme }).eq('id', currentUser.id);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/main.html';
  } catch (error) {
    showError('Erreur lors de la déconnexion');
  }
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
