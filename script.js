const config = window.PORTFOLIO_CONFIG || {};

const ANNOUNCEMENT_KEY = "portfolio_announcement_v1";
const ANNOUNCEMENT_AUTH_SESSION_KEY = "portfolio_announcement_auth_v1";
const ANNOUNCEMENT_EMPTY_MESSAGE = "There aren't any announcements at this moment.";

const state = {
  activeTab: "home",
  announcementAuthorized: false,
};

function updateTextContent(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function setActiveTab(nextTab) {
  state.activeTab = nextTab;

  document.querySelectorAll(".tab-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === nextTab);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const show = panel.id === nextTab;
    panel.classList.toggle("active", show);
    panel.setAttribute("aria-hidden", String(!show));
  });
}

function bindTabs() {
  document.querySelectorAll(".tab-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      playClickSound();
      setActiveTab(btn.dataset.tab);
    });
  });
}

let clickAudio;

function playClickSound() {
  const click = config.clickSound || {};
  if (click.enabled === false) return;

  const soundPath = click.file || "assets/sounds/click.mp3";
  const volume = Number(click.volume) || 0.4;

  if (!clickAudio) {
    clickAudio = new Audio(soundPath);
    clickAudio.preload = "auto";
  }

  try {
    clickAudio.pause();
    clickAudio.currentTime = 0;
    clickAudio.volume = volume;
    clickAudio.play();
  } catch (error) {
    console.warn("Click sound failed:", error);
  }
}

function bindClickSounds() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest(
      ".social-btn, .timeline-card, .action-btn, .announcement-access-btn"
    );
    if (target) playClickSound();
  });
}

function bootstrapConfig() {
  updateTextContent(".identity-name", config.name);
  updateTextContent(".identity-role", config.role);

  const aboutParagraph = document.querySelector("#home .about-text");
  if (aboutParagraph && config.about) {
    aboutParagraph.textContent = config.about;
  }

  const contactList = document.querySelector("#contact ul");
  if (contactList && config.contact) {
    contactList.innerHTML = `
      <li><strong>E-mail:</strong> ${config.contact.email || "N/A"}</li>
      <li><strong>Timezone:</strong> ${config.contact.timezone || "N/A"}</li>
    `;
  }

  const socials = document.getElementById("social-buttons");
  if (socials) {
    const links = config.links || {};
    const items = [
      {
        url: links.discord,
        label: "Discord",
        icon: `<img src="assets/icons/discord.svg" alt="Discord">`,
      },
      {
        url: links.robloxProfile,
        label: "Roblox",
        icon: `<img src="assets/icons/roblox.svg" alt="Roblox">`,
      },
      {
        url: links.twitter,
        label: "X",
        icon: `<img src="assets/icons/twitter.svg" alt="Twitter">`,
      },
    ];

    socials.innerHTML = items
      .filter((item) => item.url)
      .map(
        (item) =>
          `<a class="social-btn icon-only" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="${item.label}" title="${item.label}">${item.icon}</a>`
      )
      .join("");
  }
}

function renderTimeline() {
  const timeline = document.querySelector("#experience-timeline");
  if (!timeline) return;

  const experiences = Array.isArray(config.experiences) ? config.experiences : [];
  timeline.innerHTML = "";

  experiences.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "timeline-item";

    const link = document.createElement("a");
    link.className = "timeline-card glass";
    link.href = item.robloxGroupUrl || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.innerHTML = `
      <span class="timeline-index">${String(index + 1).padStart(2, "0")}</span>
      <h3>${item.groupName || "Unknown Group"}</h3>
      <p class="role">${item.role || "Role not provided"}</p>
      <p class="period">${item.period || "Period not provided"}</p>
      <p>${item.description || "Description not provided."}</p>
      <span class="cta">Open Roblox Group ↗</span>
    `;

    li.appendChild(link);
    timeline.appendChild(li);
  });
}

function statusClassFromDiscord(status) {
  if (status === "online") return "status-online";
  if (status === "idle") return "status-idle";
  if (status === "dnd") return "status-dnd";
  return "status-offline";
}

function labelFromDiscordStatus(status) {
  if (status === "online") return "Online";
  if (status === "idle") return "Idle";
  if (status === "dnd") return "Do Not Disturb";
  return "Offline";
}

async function loadDiscordPresence() {
  const avatarNode = document.getElementById("discord-avatar");
  const labelNode = document.getElementById("discord-presence");
  const dotNode = document.getElementById("status-dot");

  if (!avatarNode || !labelNode || !dotNode) return;

  avatarNode.src =
    config.discord?.fallbackAvatar || "https://cdn.discordapp.com/embed/avatars/0.png";

  const userId = config.discord?.lanyardUserId;
  if (!userId) {
    labelNode.textContent = "Offline";
    return;
  }

  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const payload = await response.json();
    const data = payload?.data;

    if (!payload?.success || !data?.discord_user) {
      throw new Error("Lanyard response missing user data");
    }

    const user = data.discord_user;
    const status = data.discord_status || "offline";

    if (user.avatar) {
      avatarNode.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }

    dotNode.className = `status-dot ${statusClassFromDiscord(status)}`;
    labelNode.textContent = labelFromDiscordStatus(status);
  } catch (_error) {
    labelNode.textContent = "Offline";
    dotNode.className = "status-dot status-offline";
  }
}

function renderAnnouncementCard() {
  const view = document.getElementById("announcement-view");
  const title = document.getElementById("announcement-title");
  const message = document.getElementById("announcement-message");

  if (!view || !title || !message) return;

  const raw = localStorage.getItem(ANNOUNCEMENT_KEY);

  if (!raw) {
    title.textContent = "";
    title.classList.add("hidden");
    message.textContent = ANNOUNCEMENT_EMPTY_MESSAGE;
    view.classList.remove("hidden");
    return;
  }

  try {
    const data = JSON.parse(raw);
    const hasTitle = Boolean(data?.title?.trim());
    const hasMessage = Boolean(data?.message?.trim());

    if (!hasMessage) {
      title.textContent = "";
      title.classList.add("hidden");
      message.textContent = ANNOUNCEMENT_EMPTY_MESSAGE;
      view.classList.remove("hidden");
      return;
    }

    title.textContent = data.title;
    title.classList.toggle("hidden", !hasTitle);
    message.textContent = data.message;
    view.classList.remove("hidden");
  } catch (_error) {
    title.textContent = "";
    title.classList.add("hidden");
    message.textContent = ANNOUNCEMENT_EMPTY_MESSAGE;
    view.classList.remove("hidden");
  }
}

function syncAnnouncementEditorVisibility() {
  const form = document.getElementById("announcement-form");
  if (!form) return;

  form.classList.toggle("hidden", !state.announcementAuthorized);
}

function bindAnnouncementEditor() {
  const form = document.getElementById("announcement-form");
  const titleInput = document.getElementById("announcement-title-input");
  const messageInput = document.getElementById("announcement-message-input");
  const deleteBtn = document.getElementById("announcement-delete");

  if (!form || !titleInput || !messageInput || !deleteBtn) return;

  const raw = localStorage.getItem(ANNOUNCEMENT_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      titleInput.value = data.title || "";
      messageInput.value = data.message || "";
    } catch (_error) {
      // no-op
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const message = messageInput.value;

    if (!message.trim()) return;

    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify({ title, message }));
    renderAnnouncementCard();
  });

  deleteBtn.addEventListener("click", () => {
    localStorage.removeItem(ANNOUNCEMENT_KEY);
    titleInput.value = "";
    messageInput.value = "";
    renderAnnouncementCard();
  });
}

function applyAnnouncementSessionFromStorage() {
  state.announcementAuthorized =
    sessionStorage.getItem(ANNOUNCEMENT_AUTH_SESSION_KEY) === "true";
  syncAnnouncementEditorVisibility();
}

function openAnnouncementLoginModal() {
  const modal = document.getElementById("announcement-login-modal");
  const error = document.getElementById("announcement-login-error");
  if (!modal) return;

  modal.classList.remove("hidden");
  if (error) error.classList.add("hidden");
}

function closeAnnouncementLoginModal() {
  const modal = document.getElementById("announcement-login-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function authorizeAnnouncementEditor() {
  state.announcementAuthorized = true;
  sessionStorage.setItem(ANNOUNCEMENT_AUTH_SESSION_KEY, "true");
  syncAnnouncementEditorVisibility();
}

function bindAnnouncementAccess() {
  const accessBtn = document.getElementById("announcement-access-btn");
  const closeBtn = document.getElementById("announcement-login-close");
  const modal = document.getElementById("announcement-login-modal");
  const loginForm = document.getElementById("announcement-login-form");
  const loginUser = document.getElementById("announcement-login-user");
  const loginPass = document.getElementById("announcement-login-pass");
  const loginError = document.getElementById("announcement-login-error");
  const announcementCard = document.getElementById("announcement-card");

  if (!accessBtn || !modal || !loginForm || !loginUser || !loginPass || !announcementCard) return;

  accessBtn.addEventListener("click", () => {
    setActiveTab("home");
    announcementCard.scrollIntoView({ behavior: "smooth", block: "start" });

    if (state.announcementAuthorized) return;
    openAnnouncementLoginModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAnnouncementLoginModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeAnnouncementLoginModal();
    }
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const expectedUser = config.announcements?.auth?.username || "";
    const expectedPass = config.announcements?.auth?.password || "";

    const userOk = loginUser.value === expectedUser;
    const passOk = loginPass.value === expectedPass;

    if (userOk && passOk) {
      authorizeAnnouncementEditor();
      closeAnnouncementLoginModal();
      loginForm.reset();
      if (loginError) loginError.classList.add("hidden");
      return;
    }

    if (loginError) loginError.classList.remove("hidden");
  });
}

bootstrapConfig();
renderTimeline();
bindTabs();
bindClickSounds();
loadDiscordPresence();
setInterval(loadDiscordPresence, 15000);
bindAnnouncementEditor();
renderAnnouncementCard();
applyAnnouncementSessionFromStorage();
bindAnnouncementAccess();
setActiveTab(state.activeTab);