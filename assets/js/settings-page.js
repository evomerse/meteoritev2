import { getCurrentUser, getUserProfile, signOut, supabase } from './supabase-client.js';

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
    document.getElementById('userEmail').value = currentProfile.email;
    document.getElementById('firstName').value = currentProfile.first_name || '';

    const isDarkMode = currentProfile.theme_preference === 'dark';
    document.getElementById('darkModeToggle').checked = isDarkMode;
    applyTheme(currentProfile.theme_preference || 'light');
  }

  setupEventListeners();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 500);
}

function setupEventListeners() {
  document.getElementById('updateProfileBtn').addEventListener('click', handleUpdateProfile);
  document.getElementById('passwordForm').addEventListener('submit', handleChangePassword);
  document.getElementById('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('darkModeToggle').addEventListener('change', handleThemeChange);
  document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
  document.getElementById('navMenu').classList.toggle('active');
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

    showSuccess('Profil mis à jour avec succès');
    currentProfile.first_name = firstName;
    document.getElementById('userName').textContent = firstName;
  } catch (error) {
    showError('Erreur lors de la mise à jour du profil');
  }
}

async function handleChangePassword(e) {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmNewPassword) {
    showError('Les mots de passe ne correspondent pas');
    return;
  }

  if (newPassword.length < 6) {
    showError('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    showSuccess('Mot de passe modifié avec succès');
    document.getElementById('passwordForm').reset();
  } catch (error) {
    showError('Erreur lors de la modification du mot de passe');
  }
}

async function handleDeleteAccount() {
  const confirmed = confirm(
    'Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données, favoris et alertes.'
  );

  if (!confirmed) return;

  const doubleConfirm = confirm(
    'Dernière confirmation : Voulez-vous vraiment supprimer définitivement votre compte ?'
  );

  if (!doubleConfirm) return;

  try {
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', currentUser.id);

    if (deleteError) throw deleteError;

    await signOut();
    window.location.href = '/login-page.html';
  } catch (error) {
    showError('Erreur lors de la suppression du compte');
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
  } catch (error) {
    showError('Erreur lors de la sauvegarde du thème');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.getElementById('darkModeToggle').checked = newTheme === 'dark';
  applyTheme(newTheme);

  supabase
    .from('profiles')
    .update({ theme_preference: newTheme })
    .eq('id', currentUser.id)
    .then(({ error }) => {
      if (error) console.error('Error saving theme:', error);
    });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';

  const toggle = document.querySelector('#darkModeToggle + span');
  const toggleDot = document.querySelector('#darkModeToggle + span + span');

  if (theme === 'dark') {
    toggle.style.backgroundColor = '#70b7ff';
    toggleDot.style.transform = 'translateX(30px)';
  } else {
    toggle.style.backgroundColor = '#ccc';
    toggleDot.style.transform = 'translateX(0)';
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
