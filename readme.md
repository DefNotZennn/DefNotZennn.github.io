# Roblox Portfolio (GitHub Pages Ready)

A modern single-page portfolio for Roblox developers with animated tab transitions, Discord presence, announcements, and a clickable work timeline.

## Tabs
- Home
- Past Experiences
- Contact

## Quick customization
All editable content lives in `portfolio.config.js`.

### 1 Profile block on Home
Update:
- `name`
- `role`
- `about`

### 2 Discord status / avatar (Lanyard)
Update:
- `discord.lanyardUserId`
- `discord.fallbackAvatar`

The page fetches:
- `https://api.lanyard.rest/v1/users/<your-id>`

Status dot colors:
- online -> green
- idle -> yellow
- dnd -> red
- offline -> gray

### 3 Contact icons
Update:
- `links.discord`
- `links.robloxProfile`
- `links.twitter`

Contact shows icon-only buttons for Discord, Roblox, and X.

### 4 Click sound configuration
Update `clickSound`:
- `enabled`
- `type` (`triangle`, `sine`, `square`, `sawtooth`)
- `frequency`
- `durationMs`
- `volume`

### 5 Announcements (important for GitHub Pages)
Current mode is `announcements.mode = "local"`.

That means:
- Only the same browser/device can edit and see its saved announcement.
- GitHub Pages cannot know "who is you" by itself.
- Other visitors will **not** see your local announcement.

If you want "only me can post and everyone can see", you need a backend/auth flow (for example: Supabase/Firebase/GitHub API workflow with a token and admin login).

Announcement body preserves spaces/new lines.

### 6 Past experiences timeline
Edit `experiences` and add as many items as needed:

```js
{
  groupName: "Your Group Name",
  role: "Your Role",
  period: "2024 — Present",
  description: "What you did there.",
  robloxGroupUrl: "https://www.roblox.com/communities/<group-id>/<slug>#!/about",
}
```

Each card opens `robloxGroupUrl` in a new tab.

## How to test locally

### 1 Start server
```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

### 2 Checklist
- Name/role/status appear next to avatar (not in nav).
- Status text is simple: `Online`, `Idle`, `Do Not Disturb`, or `Offline`.
- Skill chips are icon-only and represent LuaU + JavaScript.
- Contact has icon-only buttons for Discord/Roblox/X.
- Announcement supports spaces/new lines and save/update/delete.
- Click sound works and changes when `clickSound` config values are changed.
- Past Experiences cards render and open Roblox group links.

## Deploy to GitHub Pages
1. Push this repository to GitHub.
2. In **Settings → Pages**, set source to **Deploy from a branch**.
3. Select your main branch and root folder (`/`).
4. Save.