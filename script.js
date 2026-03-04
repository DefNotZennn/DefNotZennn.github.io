const config = window.PORTFOLIO_CONFIG || {};

const state = {
  activeTab: "home",
  currentStatus: null,
  currentAvatar: null
};

let clickAudio;

function playClickSound() {
  const soundPath = "assets/sounds/click.mp3"; 
  if (!clickAudio) {
    clickAudio = new Audio(soundPath);
    clickAudio.preload = "auto";
  }
  
  clickAudio.pause();
  clickAudio.currentTime = 0;
  clickAudio.volume = 0.4;
  
  clickAudio.play().catch(err => console.log("Audio play blocked until user interaction."));
}

function setActiveTab(nextTab) {
  state.activeTab = nextTab;
  document.querySelectorAll(".tab-link").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === nextTab));
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === nextTab));
}

function bindTabs() {
  document.querySelectorAll(".tab-link").forEach(btn => {
    btn.addEventListener("click", () => {
      playClickSound();
      setActiveTab(btn.dataset.tab);
    });
  });
}

function bindGlobalClicks() {
  document.addEventListener("click", (e) => {
    if (e.target.closest(".social-btn") || e.target.closest(".timeline-card")) {
      playClickSound();
    }
  });
}

function bootstrapConfig() {
  if (!config.about) return;

  document.querySelector(".identity-name").textContent = config.name;
  document.querySelector(".identity-role").textContent = config.role;
  document.getElementById("intro-text").textContent = config.about.introduction;
  
  const skillsList = document.getElementById("skills-list");
  skillsList.innerHTML = "";
  config.about.skills.forEach(skill => {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li);
  });

  const contactList = document.getElementById("contact-details");
  contactList.innerHTML = `
    <li><strong>E-mail:</strong> ${config.contact.email}</li>
    <li><strong>Timezone:</strong> ${config.contact.timezone}</li>
  `;

  const socialContainer = document.getElementById("social-buttons");
  socialContainer.innerHTML = "";
  const platforms = [
    { key: 'discord', icon: 'discord.svg' },
    { key: 'robloxProfile', icon: 'roblox.svg' },
    { key: 'twitter', icon: 'twitter.svg' }
  ];

  platforms.forEach(p => {
    if (config.links[p.key]) {
      const a = document.createElement("a");
      a.className = "social-btn";
      a.href = config.links[p.key];
      a.target = "_blank";
      a.innerHTML = `<img src="assets/icons/${p.icon}" alt="${p.key}">`;
      socialContainer.appendChild(a);
    }
  });
}

async function renderTimeline() {
  const container = document.getElementById("experience-timeline");
  if (!container || !config.experiences) return;
  container.innerHTML = "";

  const promises = config.experiences.map(async (exp, index) => {

    const placeIdMatch = exp.robloxGameUrl.match(/games\/(\d+)/);
    const placeId = placeIdMatch ? placeIdMatch[1] : null;
    const cardId = `game-${index}`;
    
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${exp.robloxGameUrl}" target="_blank" class="timeline-card glass">
        <div class="game-thumb-side">
          <img id="${cardId}-img" src="assets/placeholders/game.jpg" alt="Thumbnail">
        </div>
        <div class="game-info-side">
          <h3 class="timeline-game-name" id="${cardId}-title">Loading Game...</h3>
          <p class="timeline-role-row">${exp.role}</p>
          <p class="timeline-period-row">${exp.period}</p>
          <p class="timeline-desc" id="${cardId}-desc">Fetching details...</p>
          <div class="game-stats-row">
            <span class="game-visits" id="${cardId}-visits">---</span>
            <span class="cta-link">View Experience ↗</span>
          </div>
        </div>
      </a>
    `;
    container.appendChild(li);

    if (placeId) {
      return fetchRobloxData(placeId, cardId);
    }
  });

  await Promise.all(promises);
}

async function fetchRobloxData(placeId, cardId) {
  try {
    const univRes = await fetch(`https://apis.roproxy.com/universes/v1/places/${placeId}/universe`);
    if (!univRes.ok) throw new Error("Universe fetch failed");
    const { universeId } = await univRes.json();
    
    const [gameRes, thumbRes] = await Promise.all([
      fetch(`https://games.roproxy.com/v1/games?universeIds=${universeId}`),
      fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`)
    ]);

    const gameData = await gameRes.json();
    const thumbData = await thumbRes.json();

    if (gameData.data && gameData.data[0]) {
      const g = gameData.data[0];
      document.getElementById(`${cardId}-title`).textContent = g.name;
      document.getElementById(`${cardId}-visits`).textContent = `👁️ ${g.visits.toLocaleString()} Visits`;

      const shortDesc = g.description.length > 150 ? g.description.substring(0, 150) + "..." : g.description;
      document.getElementById(`${cardId}-desc`).textContent = shortDesc || "No description available.";
    }

    if (thumbData.data && thumbData.data[0]) {
      document.getElementById(`${cardId}-img`).src = thumbData.data[0].imageUrl;
    }
  } catch (e) {
    console.error(`Error loading data for ${cardId}:`, e);
    document.getElementById(`${cardId}-title`).textContent = "Experience Linked";
    document.getElementById(`${cardId}-desc`).textContent = "Click to view details on Roblox.";
  }
}

async function loadDiscordPresence() {
  const userId = config.discord?.lanyardUserId;
  if (!userId) return;

  const statusMap = {
    "online": "Online",
    "idle": "Away",
    "dnd": "Do Not Disturb",
    "offline": "Offline"
  };

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const { data } = await res.json();
    if (!data) return;

    const status = data.discord_status;
    const avatar = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=256`;

    if (state.currentStatus !== status) {
      const dot = document.getElementById("status-dot");
      const label = document.getElementById("discord-presence");
      if (dot) dot.className = `status-dot status-${status}`;
      if (label) label.textContent = statusMap[status] || "Offline";
      state.currentStatus = status;
    }

    if (state.currentAvatar !== avatar) {
      const avatarImg = document.getElementById("discord-avatar");
      if (avatarImg) avatarImg.src = avatar;
      state.currentAvatar = avatar;
    }
  } catch (e) {}
}

bootstrapConfig();
renderTimeline();
bindTabs();
bindGlobalClicks();
loadDiscordPresence();
setInterval(loadDiscordPresence, 15000);