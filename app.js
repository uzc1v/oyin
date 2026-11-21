/* =========================================================
   LEVELKIDS — Main Application Controller & SPA Views
   ========================================================= */

const App = {
  currentUser: null,
  currentPage: "dashboard",
  shopTab: "avatars",

  init() {
    setLanguage(currentLang);
    this.setupAuthUI();
    this.setupNavEvents();

    setTimeout(() => {
      document.getElementById("loader").classList.add("hidden");
      const user = StorageManager.getCurrentUser();
      if (user) {
        this.loginSuccess(user);
      } else {
        this.showAuthModal();
      }
    }, 650);
  },

  showToast(msg) {
    const box = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  setupAuthUI() {
    // Age chips 3..12
    const ageBox = document.getElementById("reg-age-selector");
    let selectedAge = 7;
    for (let a = 3; a <= 12; a++) {
      const chip = document.createElement("div");
      chip.className = `age-chip ${a === selectedAge ? "selected" : ""}`;
      chip.textContent = `${a}`;
      chip.onclick = () => {
        selectedAge = a;
        ageBox.querySelectorAll(".age-chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
      };
      ageBox.appendChild(chip);
    }

    // Avatar chips
    const avBox = document.getElementById("reg-avatar-selector");
    let selectedAvatar = "🦁";
    SHOP_AVATARS.slice(0, 12).forEach((av, idx) => {
      const opt = document.createElement("div");
      opt.className = `avatar-option ${idx === 0 ? "selected" : ""}`;
      opt.textContent = av.icon;
      opt.onclick = () => {
        selectedAvatar = av.icon;
        avBox.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
      };
      avBox.appendChild(opt);
    });

    // Tabs
    document.getElementById("tab-register").onclick = () => {
      document.getElementById("tab-register").classList.add("active");
      document.getElementById("tab-login").classList.remove("active");
      document.getElementById("register-form").classList.remove("hidden");
      document.getElementById("login-form").classList.add("hidden");
    };
    document.getElementById("tab-login").onclick = () => {
      document.getElementById("tab-login").classList.add("active");
      document.getElementById("tab-register").classList.remove("active");
      document.getElementById("login-form").classList.remove("hidden");
      document.getElementById("register-form").classList.add("hidden");
    };

    // Register submit
    document.getElementById("register-form").onsubmit = e => {
      e.preventDefault();
      const res = StorageManager.createUser({
        name: document.getElementById("reg-name").value.trim(),
        username: document.getElementById("reg-username").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
        age: selectedAge,
        avatar: selectedAvatar
      });
      if (res.error) return this.showToast(res.error);
      this.loginSuccess(res.user);
    };

    // Login submit
    document.getElementById("login-form").onsubmit = e => {
      e.preventDefault();
      const res = StorageManager.loginUser(
        document.getElementById("login-email").value.trim(),
        document.getElementById("login-password").value
      );
      if (res.error) return this.showToast(res.error);
      this.loginSuccess(res.user);
    };
  },

  showAuthModal() {
    document.getElementById("app-shell").classList.add("hidden");
    document.getElementById("auth-modal").classList.remove("hidden");
    const users = StorageManager.getUsers();
    const box = document.getElementById("saved-accounts-box");
    const list = document.getElementById("saved-accounts-list");
    if (users.length > 0) {
      box.classList.remove("hidden");
      list.innerHTML = users.map(u => `
        <div class="saved-acc-chip" onclick="App.quickLogin('${u.username}')">
          <span>${u.avatar}</span>
          <span>${u.name} (Lv.${u.level})</span>
        </div>
      `).join("");
    }
  },

  quickLogin(username) {
    const users = StorageManager.getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      StorageManager.setActiveUsername(user.username);
      this.loginSuccess(user);
    }
  },

  loginSuccess(user) {
    this.currentUser = user;
    document.getElementById("auth-modal").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    this.refreshTopbar();
    this.navigate("dashboard");
  },

  logout() {
    StorageManager.setActiveUsername(null);
    this.currentUser = null;
    this.showAuthModal();
  },

  setupNavEvents() {
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.onclick = () => setLanguage(btn.dataset.lang);
    });
    document.querySelectorAll("[data-page]").forEach(btn => {
      btn.onclick = () => this.navigate(btn.dataset.page);
    });
  },

  refreshTopbar() {
    const u = this.currentUser;
    if (!u) return;
    document.getElementById("top-points").textContent = u.points;
    document.getElementById("top-level").textContent = u.level;
    document.getElementById("top-avatar").textContent = u.avatar;
    document.getElementById("top-name").textContent = u.name;
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll("[data-page]").forEach(b => {
      b.classList.toggle("active", b.dataset.page === page);
    });
    this.renderPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  claimDailyBonus() {
    const u = this.currentUser;
    const today = new Date().toDateString();
    if (u.lastBonusDate === today) return;
    u.lastBonusDate = today;
    StorageManager.addPointsAndXP(u, 150, 50, "Kunlik kirish bonusi");
    this.refreshTopbar();
    this.showToast("+150 ⭐ Kunlik bonus olindi!");
    this.renderPage("dashboard");
  },

  renderPage(page) {
    const container = document.getElementById("main-content");
    const u = this.currentUser;

    if (page === "dashboard") {
      const todayClaimed = u.lastBonusDate === new Date().toDateString();
      const xpNeeded = u.level * 100;
      const xpPct = Math.min(100, Math.round((u.xp / xpNeeded) * 100));

      container.innerHTML = `
        <section class="hero-banner" style="background:${u.bg}">
          <div class="hero-content">
            <span class="hero-tag">${t("hero_tag")}</span>
            <h1 class="hero-title">${t("hero_welcome")}, ${u.name}! ${u.pet || "✨"}</h1>
            <p class="hero-sub">${t("hero_desc")}</p>
            <div class="hero-actions">
              <button class="btn btn-lime" onclick="App.navigate('games')">${t("hero_play_now")}</button>
              <button class="btn btn-primary-sky" ${todayClaimed ? "disabled" : ""} onclick="App.claimDailyBonus()">
                ${todayClaimed ? t("hero_bonus_claimed") : t("hero_daily_bonus")}
              </button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-level-card">
              <div class="big-avatar">${u.avatar}</div>
              <h3>Level ${u.level} / 100</h3>
              <p style="font-size:12px;color:#64748B;margin-bottom:8px">${u.xp} / ${xpNeeded} XP</p>
              <div class="progress-track"><div class="progress-fill" style="width:${xpPct}%"></div></div>
            </div>
          </div>
        </section>

        <div class="section-header">
          <h2 class="section-title">${t("sec_daily_tasks")}</h2>
          <span class="game-badge">🔥 Streak: ${u.streak}</span>
        </div>
        <div class="grid-3">
          ${DAILY_QUESTS.map(q => {
            const prog = Math.min(q.target, u.questProgress[q.id] || 0);
            const done = prog >= q.target;
            return `
              <div class="card">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <strong>${q.title[currentLang]}</strong>
                  <span class="game-badge">+${q.reward} ⭐</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${(prog / q.target) * 100}%"></div></div>
                <p style="font-size:12px;color:#64748B;margin-top:8px">${prog} / ${q.target} ${done ? "✅" : ""}</p>
              </div>
            `;
          }).join("")}
        </div>

        <div class="section-header">
          <h2 class="section-title">${t("sec_featured_games")}</h2>
        </div>
        ${this.renderGamesGrid()}
      `;
    }

    if (page === "games") {
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_featured_games")}</h2>
          <span class="game-badge">${u.age} ${t("age_years")} • Level ${u.level}</span>
        </div>
        ${this.renderGamesGrid()}
      `;
    }

    if (page === "worlds") {
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_worlds")}</h2>
          <span class="game-badge">Level ${u.level}</span>
        </div>
        <div class="grid-2">
          ${WORLDS_DATA.map(w => {
            const unlocked = u.level >= w.minLevel;
            return `
              <div class="world-card" style="background:${w.bg};opacity:${unlocked ? 1 : 0.75}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                  <span style="font-size:44px">${w.icon}</span>
                  <span class="game-badge">${unlocked ? "🔓 Ochiq" : `🔒 Level ${w.minLevel}+`}</span>
                </div>
                <h3>${w.title[currentLang]}</h3>
                <p style="margin:6px 0 14px;font-size:14px">${w.desc[currentLang]}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${w.games.map(gid => {
                    const g = GAMES_CATALOG.find(x => x.id === gid);
                    return `<button class="btn btn-sm ${unlocked ? "btn-lime" : "btn-sky"}" ${unlocked ? `onclick="GameEngine.startGame('${gid}')"` : "disabled"}>${g.icon} ${g.title[currentLang]}</button>`;
                  }).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    if (page === "arena") {
      const board = [...LEADERBOARD_BOTS, { name: u.name, username: u.username, age: u.age, level: u.level, points: u.points, avatar: u.avatar }]
        .sort((a, b) => b.points - a.points);
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_arena")}</h2>
          <button class="btn btn-lime btn-sm" onclick="GameEngine.startGame('quiz')">⚡ Tezkor Bellashuv</button>
        </div>
        <div class="card table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>O'yinchi</th><th>Yosh</th><th>Level</th><th>Ballar</th></tr>
            </thead>
            <tbody>
              ${board.map((p, idx) => `
                <tr style="${p.username === u.username ? "background:#ECFCCB;font-weight:800" : ""}">
                  <td>${idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}</td>
                  <td>${p.avatar} ${p.name}</td>
                  <td>${p.age}</td>
                  <td>Lv.${p.level}</td>
                  <td>${p.points} ⭐</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    if (page === "shop") {
      const items = this.shopTab === "avatars" ? SHOP_AVATARS : this.shopTab === "bgs" ? SHOP_BACKGROUNDS : SHOP_EXTRAS;
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_shop")}</h2>
          <span class="stat-pill points-pill">⭐ ${u.points}</span>
        </div>
        <div class="shop-tabs">
          <button class="btn btn-sm ${this.shopTab === "avatars" ? "btn-primary-sky" : "btn-sky"}" onclick="App.shopTab='avatars';App.renderPage('shop')">Avatarlar (32)</button>
          <button class="btn btn-sm ${this.shopTab === "bgs" ? "btn-primary-sky" : "btn-sky"}" onclick="App.shopTab='bgs';App.renderPage('shop')">Profil fonlari (22)</button>
          <button class="btn btn-sm ${this.shopTab === "extras" ? "btn-primary-sky" : "btn-sky"}" onclick="App.shopTab='extras';App.renderPage('shop')">Skin, Ramka & Hayvonlar</button>
        </div>
        <div class="grid-4">
          ${items.map(item => {
            const owned = u.ownedItems.includes(item.id);
            return `
              <div class="shop-item-card ${owned ? "owned" : ""}">
                <div class="shop-preview" style="${item.css ? `background:${item.css}` : ""}">${item.icon}</div>
                <h4 style="font-size:15px;margin-bottom:4px">${item.name[currentLang]}</h4>
                <p style="font-size:13px;font-weight:800;color:#0284C7;margin-bottom:10px">${item.price === 0 ? "Bepul" : `${item.price} ⭐`}</p>
                <button class="btn btn-sm ${owned ? "btn-sky" : "btn-lime"} btn-block" onclick="App.handleShopAction('${item.id}')">
                  ${owned ? t("btn_equip") : t("btn_buy")}
                </button>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    if (page === "profile") {
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_profile")}</h2>
          <button class="btn btn-danger btn-sm" onclick="App.logout()">${t("btn_logout")}</button>
        </div>
        <div class="grid-2">
          <div class="card" style="background:${u.bg}">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
              <div style="font-size:56px">${u.avatar}</div>
              <div>
                <h2>${u.name} ${u.pet || ""}</h2>
                <p>@${u.username} • ${u.age} ${t("age_years")} • Level ${u.level}</p>
                <p><strong>${u.points} ⭐</strong> • O'yinlar: ${u.stats.gamesPlayed}</p>
              </div>
            </div>
            <form onsubmit="App.saveProfileEdit(event)">
              <div class="form-row">
                <div class="form-group"><label>${t("auth_name")}</label><input id="edit-name" value="${u.name}" required /></div>
                <div class="form-group"><label>${t("auth_age")}</label><input type="number" min="3" max="12" id="edit-age" value="${u.age}" required /></div>
              </div>
              <button type="submit" class="btn btn-lime btn-sm">${t("btn_save")}</button>
            </form>
          </div>
          <div class="card">
            <h3 style="margin-bottom:10px">🏅 Medallar va Ballar Tarixi</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
              ${u.medals.map(m => `<span class="game-badge">${m}</span>`).join("")}
            </div>
            <div style="max-height:180px;overflow-y:auto">
              ${u.history.map(h => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
                  <span>${h.text}</span>
                  <strong style="color:#65A30D">${h.delta}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    if (page === "parents") {
      const accuracy = u.stats.totalQuestions ? Math.round((u.stats.correctAnswers / u.stats.totalQuestions) * 100) : 100;
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_parents")}</h2>
        </div>
        <div class="grid-3">
          <div class="card"><h4>📊 O'zlashtirish aniqligi</h4><h2 style="font-size:32px;color:#0284C7">${accuracy}%</h2></div>
          <div class="card"><h4>🎮 Bugungi o'yin vaqti</h4><h2 style="font-size:32px;color:#65A30D">${u.parentSettings.minutesPlayedToday} / ${u.parentSettings.dailyLimitMinutes} daq</h2></div>
          <div class="card"><h4>🏆 Joriy Level</h4><h2 style="font-size:32px">Level ${u.level}</h2></div>
        </div>
        <div class="card" style="margin-top:18px;max-width:520px">
          <h3 style="margin-bottom:12px">⏱️ Vaqt va Xavfsizlik Nazorati</h3>
          <form onsubmit="App.saveParentSettings(event)">
            <div class="form-group">
              <label>Kunlik o'yin limiti (daqiqa):</label>
              <input type="number" id="parent-limit" min="10" max="240" value="${u.parentSettings.dailyLimitMinutes}" />
            </div>
            <button type="submit" class="btn btn-primary-sky">${t("btn_save")}</button>
          </form>
        </div>
      `;
    }

    if (page === "admin") {
      const allUsers = StorageManager.getUsers();
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${t("sec_admin")}</h2>
          <span class="game-badge">Foydalanuvchilar: ${allUsers.length}</span>
        </div>
        <div class="grid-2">
          <div class="card">
            <h3 style="margin-bottom:12px">➕ Yangi Savol Qo'shish</h3>
            <form onsubmit="App.adminAddQuestion(event)">
              <div class="form-group">
                <label>O'yin turi</label>
                <select id="adm-game">
                  ${GAMES_CATALOG.map(g => `<option value="${g.id}">${g.title[currentLang]}</option>`).join("")}
                </select>
              </div>
              <div class="form-group"><label>Savol matni</label><input id="adm-q" required placeholder="Masalan: 15 + 25 = ?" /></div>
              <div class="form-group"><label>4 ta javob (vergul bilan)</label><input id="adm-opts" required placeholder="40, 35, 45, 50" /></div>
              <div class="form-group"><label>To'g'ri javob</label><input id="adm-ans" required placeholder="40" /></div>
              <button type="submit" class="btn btn-lime">Savolni qo'shish</button>
            </form>
          </div>
          <div class="card table-wrap">
            <h3 style="margin-bottom:12px">👥 Ro'yxatdan o'tgan foydalanuvchilar</h3>
            <table>
              <thead><tr><th>Ism</th><th>Login</th><th>Yosh</th><th>Level</th><th>Ball</th></tr></thead>
              <tbody>
                ${allUsers.map(usr => `<tr><td>${usr.avatar} ${usr.name}</td><td>${usr.username}</td><td>${usr.age}</td><td>${usr.level}</td><td>${usr.points}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  },

  renderGamesGrid() {
    return `
      <div class="grid-4">
        ${GAMES_CATALOG.map(g => `
          <div class="game-card" onclick="GameEngine.startGame('${g.id}')">
            <div class="game-card-top">
              <div class="game-icon-box" style="background:${g.color}">${g.icon}</div>
              <span class="game-badge">${g.category}</span>
            </div>
            <div>
              <h3>${g.title[currentLang]}</h3>
              <p>${g.desc[currentLang]}</p>
            </div>
            <button class="btn btn-lime btn-sm btn-block">${t("btn_play")} ▶</button>
          </div>
        `).join("")}
      </div>
    `;
  },

  handleShopAction(itemId) {
    const u = this.currentUser;
    const all = [...SHOP_AVATARS, ...SHOP_BACKGROUNDS, ...SHOP_EXTRAS];
    const item = all.find(i => i.id === itemId);
    if (!item) return;

    if (!u.ownedItems.includes(itemId)) {
      if (u.points < item.price) return this.showToast(t("insufficient_points"));
      u.points -= item.price;
      u.ownedItems.push(itemId);
      if (item.id === "gift_mystery") {
        u.points += 300;
      }
      u.history.unshift({ date: new Date().toLocaleDateString(), text: `Do'kon: ${item.name[currentLang]}`, delta: `-${item.price} ⭐` });
      this.showToast(t("item_purchased"));
    }

    if (item.type === "avatar") u.avatar = item.icon;
    if (item.type === "bg") u.bg = item.css;
    if (item.type === "pet") u.pet = item.icon;
    if (item.type === "skin") u.avatar = item.icon;

    StorageManager.updateUser(u);
    this.refreshTopbar();
    this.renderPage("shop");
  },

  saveProfileEdit(e) {
    e.preventDefault();
    const u = this.currentUser;
    u.name = document.getElementById("edit-name").value.trim() || u.name;
    u.age = Math.min(12, Math.max(3, Number(document.getElementById("edit-age").value) || u.age));
    StorageManager.updateUser(u);
    this.refreshTopbar();
    this.showToast(t("profile_updated"));
    this.renderPage("profile");
  },

  saveParentSettings(e) {
    e.preventDefault();
    const u = this.currentUser;
    u.parentSettings.dailyLimitMinutes = Number(document.getElementById("parent-limit").value) || 60;
    StorageManager.updateUser(u);
    this.showToast(t("parent_limit_saved"));
    this.renderPage("parents");
  },

  adminAddQuestion(e) {
    e.preventDefault();
    const gameId = document.getElementById("adm-game").value;
    const question = document.getElementById("adm-q").value.trim();
    const options = document.getElementById("adm-opts").value.split(",").map(s => s.trim()).filter(Boolean);
    const answer = document.getElementById("adm-ans").value.trim();
    StorageManager.addCustomQuestion({ gameId, question, options, answer });
    e.target.reset();
    this.showToast("Yangi savol o'yinga qo'shildi! ✅");
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());