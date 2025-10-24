import { signUp } from './supabase-client.js';

document.getElementById('registerForm').addEventListener('submit', handleRegister);

async function handleRegister(e) {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showError('Les mots de passe ne correspondent pas');
    return;
  }

  if (password.length < 6) {
    showError('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  try {
    await signUp(email, password, firstName);
    window.location.href = '/main.html';
  } catch (error) {
    if (error.message.includes('already registered')) {
      showError('Cet email est déjà utilisé');
    } else {
      showError('Erreur lors de l\'inscription. Veuillez réessayer.');
    }
  }
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.className = 'error-message';
  errorDiv.style.display = 'block';
}
