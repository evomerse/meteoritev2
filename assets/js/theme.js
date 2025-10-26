import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://djpigduzgtzlktpyhhgf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcGlnZHV6Z3R6bGt0cHloaGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTMwMzQsImV4cCI6MjA3NjcyOTAzNH0.xqxv2LGs-dXSXDg_ccXzhAY02lP8KxOZ_TpXXZlmAUQ';
const supabase = createClient(supabaseUrl, supabaseKey);

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';

  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('meteorite_theme', newTheme);
  });
}

function initAuth() {
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const authButtons = document.getElementById('authButtons');
  const userName = document.getElementById('userName');

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user && userInfo && authButtons) {
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          userName.textContent = data.first_name || user.email;
          userInfo.style.display = 'flex';
          authButtons.style.display = 'none';
        }
      });
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/index.html';
    });
  }
}

function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();
  initMobileMenu();
});

export { initTheme, initAuth, initMobileMenu };
