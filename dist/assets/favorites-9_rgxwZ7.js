import"./components-BVSRcDa7.js";import{g,a as f,s as y}from"./supabase-client-DwhNdNLI.js";import{r as h,g as p}from"./favorites-CsT8pkBu.js";import{a as E,d as w}from"./weather-api-C0BSZ2bx.js";import{g as T,s as I}from"./storage-xgazSgyw.js";import"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm";let r=null,n=null;async function B(){if(r=await g(),!r){document.getElementById("loginRequired").style.display="block",document.getElementById("favoritesContainer").style.display="none",setTimeout(()=>{document.getElementById("loader").classList.add("hidden")},500);return}n=await f(r.id),n&&(document.getElementById("userName").textContent=n.first_name||n.email,l(n.theme_preference||T())),L(),await d(),setTimeout(()=>{document.getElementById("loader").classList.add("hidden")},500)}function L(){document.getElementById("logoutBtn").addEventListener("click",k),document.getElementById("themeToggle").addEventListener("click",M),document.getElementById("mobileMenuToggle").addEventListener("click",C)}function C(){document.getElementById("navMenu").classList.toggle("active")}async function d(){try{const e=await p(r.id);await b(e)}catch{a("Erreur lors du chargement des favoris")}}async function b(e){const t=document.getElementById("favoritesContainer");if(t.style.display="block",!e||e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">⭐</div>
        <div class="empty-state-title">Aucun favori enregistré</div>
        <div class="empty-state-text">Ajoutez des villes à vos favoris depuis la page météo</div>
      </div>
    `;return}t.innerHTML='<div class="grid grid-3" id="favoritesGrid"></div>';const m=document.getElementById("favoritesGrid");for(const i of e)try{const s=(await E(i.latitude,i.longitude)).current_weather,c=w(s.weathercode),o=document.createElement("div");o.className="favorite-card",o.innerHTML=`
        <div class="favorite-card-header">
          <div class="favorite-city-name">${i.city_name}</div>
          <button class="favorite-remove" onclick="window.removeFavoriteConfirm('${i.id}')" title="Retirer">
            ✕
          </button>
        </div>
        <div class="favorite-card-body">
          <div class="favorite-icon">${c.icon}</div>
          <div>
            <div class="favorite-temp">${Math.round(s.temperature)}°C</div>
            <div class="favorite-description">${c.description}</div>
          </div>
        </div>
      `,o.addEventListener("click",v=>{v.target.classList.contains("favorite-remove")||(window.location.href=`/main.html?city=${encodeURIComponent(i.city_name)}`)}),m.appendChild(o)}catch{console.error(`Error loading weather for ${i.city_name}`)}}window.removeFavoriteConfirm=async function(e){if(event.stopPropagation(),confirm("Retirer cette ville de vos favoris ?"))try{await h(e),F("Favori supprimé"),await d()}catch{a("Erreur lors de la suppression")}};async function k(){try{await y(),window.location.href="/main.html"}catch{a("Erreur lors de la déconnexion")}}function M(){const t=(document.documentElement.getAttribute("data-theme")||"light")==="light"?"dark":"light";l(t),I(t)}function l(e){document.documentElement.setAttribute("data-theme",e),document.getElementById("themeToggle").textContent=e==="light"?"🌙":"☀️"}function a(e){const t=document.getElementById("errorMessage");t.textContent=e,t.className="error-message",t.style.display="block",setTimeout(()=>t.style.display="none",5e3)}function F(e){const t=document.getElementById("successMessage");t.textContent=e,t.className="success-message",t.style.display="block",setTimeout(()=>t.style.display="none",5e3)}B();
