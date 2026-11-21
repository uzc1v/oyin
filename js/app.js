/* LEVELKIDS App Core */
(function () {
  let currentUser = null;
  let currentPage = 'home';
  let currentGame = null;
  let gameState = null;

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hide');
      setTimeout(() => document.getElementById('loading-screen').remove(), 400);
    }, 700);

    currentUser = Storage.getCurrentUser();
    if (currentUser) {
      showApp();
    } else {
      showAuth();
    }

    setupAuth();
    setupHeader();
    setupNav();
    setLanguage(currentLang);
  });

  function showAuth() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    renderAvatarPicker();
  }

  function showApp() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateHeader();
    renderPage('home');
  }

  // ---------- Auth ----------
  function setupAuth() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        document.getElementById('login-form').classList.toggle('hidden', !isLogin);
        document.getElementById('register-form').classList.toggle('hidden', isLogin);
      });
    });

    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const res = Storage.login(username, password);
      if (res.ok) {
        currentUser = res.user;
        toast(t('login_success'));
        showApp();
      } else {
        toast('Login yoki parol noto\'g\'ri');
      }
    });

    document.getElementById('register-form').addEventListener('submit', e => {
      e.preventDefault();
      const selected = document.querySelector('.avatar-option.selected');
      const data = {
        name: document.getElementById('reg-name').value,
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        age: document.getElementById('reg-age').value,
        avatar: selected ? selected.dataset.emoji : '🦊'
      };
      const res = Storage.register(data);
      if (res.ok) {
        currentUser = res.user;
        toast(t('register_success'));
        showApp();
      } else {
        toast(res.error || 'Xatolik');
      }
    });
  }

  function renderAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    const emojis = ['🦊','🐱','🐶','🐼','🦁','🦄','🤖','👽','🐲','🦉','🐻','🐰','🐯','🐵','🐸','🐥','🐳','🦕','⭐','🚀'];
    picker.innerHTML = emojis.map((e, i) =>
      `<div class="avatar-option ${i === 0 ? 'selected' : ''}" data-emoji="${e}">${e}</div>`
    ).join('');
    picker.querySelectorAll('.avatar-option').forEach(el => {
      el.addEventListener('click', () => {
        picker.querySelectorAll('.avatar-option').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
  }

  // ---------- Header & Nav ----------
  function setupHeader() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      Storage.clearCurrentUser();
      currentUser = null;
      showAuth();
    });

    document.getElementById('profile-btn').addEventListener('click', () => renderPage('profile'));
  }

  function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const page = item.dataset.page;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('sidebar').classList.remove('open');
        renderPage(page);
      });
    });
  }

  function updateHeader() {
    if (!currentUser) return;
    currentUser = Storage.getCurrentUser();
    document.getElementById('header-level').textContent = `${t('level')} ${currentUser.level}`;
    document.getElementById('header-points').textContent = `${currentUser.points} ⭐`;
    const avatarEl = document.getElementById('header-avatar');
    avatarEl.textContent = getAvatarEmoji(currentUser.activeAvatar);
    avatarEl.style.fontSize = '22px';
  }

  // ---------- Pages ----------
  window.renderCurrentPage = () => renderPage(currentPage);

  function renderPage(page) {
    currentPage = page;
    currentGame = null;
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    main.classList.remove('fade-up');
    void main.offsetWidth;
    main.classList.add('fade-up');

    switch (page) {
      case 'home': renderHome(main); break;
      case 'games': renderGames(main); break;
      case 'worlds': renderWorlds(main); break;
      case 'shop': renderShop(main); break;
      case 'profile': renderProfile(main); break;
      case 'parent': renderParent(main); break;
      case 'leaderboard': renderLeaderboard(main); break;
      default: renderHome(main);
    }
  }

  function renderHome(el) {
    currentUser = Storage.getCurrentUser();
    const u = currentUser;
    el.innerHTML = `
      <div class="hero">
        <h1>${t('welcome')}, ${u.name}! 👋</h1>
        <p>${t('games_sub')}</p>
        <div class="hero-stats">
          <div class="hero-stat"><strong>${u.level}</strong><span>${t('level')}</span></div>
          <div class="hero-stat"><strong>${u.points}</strong><span>${t('points')}</span></div>
          <div class="hero-stat"><strong>${u.stats.streak || 0}</strong><span>${t('current_streak')}</span></div>
        </div>
      </div>
      <div class="flex justify-between align-center mb-16 flex-wrap gap-12">
        <h2 class="page-title" style="margin:0;font-size:22px;">${t('games_title')}</h2>
        <button class="btn btn-primary btn-sm" id="daily-bonus-btn">${t('daily_bonus')} +50⭐</button>
      </div>
      <div class="grid grid-3" id="home-games"></div>
    `;
    const grid = el.querySelector('#home-games');
    Games.list.slice(0, 6).forEach(g => {
      grid.innerHTML += `
        <div class="card" data-game="${g.id}">
          <span class="card-icon">${g.icon}</span>
          <div class="card-title">${t(g.nameKey)}</div>
          <div class="card-desc">${g.desc}</div>
          <div class="card-meta"><span class="badge badge-lime">${t('play')}</span></div>
        </div>`;
    });
    grid.querySelectorAll('.card').forEach(c => {
      c.addEventListener('click', () => startGame(c.dataset.game));
    });
    el.querySelector('#daily-bonus-btn').addEventListener('click', () => {
      const res = Storage.claimDailyBonus();
      if (res.ok) {
        toast(t('daily_claimed'));
        updateHeader();
        renderHome(el);
      } else {
        toast(res.already ? 'Bugun allaqachon oldingiz' : 'Xatolik');
      }
    });
  }

  function renderGames(el) {
    el.innerHTML = `
      <h1 class="page-title">${t('games_title')}</h1>
      <p class="page-subtitle">${t('games_sub')}</p>
      <div class="grid grid-3" id="all-games"></div>
    `;
    const grid = el.querySelector('#all-games');
    Games.list.forEach(g => {
      grid.innerHTML += `
        <div class="card" data-game="${g.id}">
          <span class="card-icon">${g.icon}</span>
          <div class="card-title">${t(g.nameKey)}</div>
          <div class="card-desc">${g.desc}</div>
          <div class="card-meta"><span class="badge badge-lime">${t('play')}</span></div>
        </div>`;
    });
    grid.querySelectorAll('.card').forEach(c => {
      c.addEventListener('click', () => startGame(c.dataset.game));
    });
  }

  function renderWorlds(el) {
    const worlds = [
      { id: 'forest', icon: '🌲', nameKey: 'forest', bg: 'linear-gradient(135deg,#166534,#4ade80)' },
      { id: 'ocean', icon: '🌊', nameKey: 'ocean', bg: 'linear-gradient(135deg,#1e3a8a,#38bdf8)' },
      { id: 'space', icon: '🚀', nameKey: 'space', bg: 'linear-gradient(135deg,#312e81,#818cf8)' },
      { id: 'magic', icon: '✨', nameKey: 'magic', bg: 'linear-gradient(135deg,#581c87,#e879f9)' },
      { id: 'dino', icon: '🦕', nameKey: 'dino', bg: 'linear-gradient(135deg,#78350f,#fbbf24)' }
    ];
    el.innerHTML = `
      <h1 class="page-title">${t('worlds_title')}</h1>
      <p class="page-subtitle">${t('worlds_sub')}</p>
      <div class="grid grid-2" id="worlds-grid"></div>
    `;
    const grid = el.querySelector('#worlds-grid');
    const unlocked = currentUser.worldsUnlocked || ['forest'];
    worlds.forEach(w => {
      const isUnlocked = unlocked.includes(w.id);
      grid.innerHTML += `
        <div class="card world-card ${isUnlocked ? '' : 'locked'}" style="background:${w.bg}" data-world="${w.id}">
          ${!isUnlocked ? '<span class="lock">🔒</span>' : ''}
          <span style="font-size:40px;margin-bottom:8px">${w.icon}</span>
          <div class="card-title" style="color:white">${t(w.nameKey)}</div>
          <div style="font-size:13px;opacity:0.9">${isUnlocked ? t('play') : t('locked')}</div>
        </div>`;
    });
    grid.querySelectorAll('.world-card').forEach(c => {
      c.addEventListener('click', () => {
        if (c.classList.contains('locked')) {
          toast(t('locked') + ' — Level oshiring');
          return;
        }
        // Start a random game as world activity
        const ids = Games.list.map(g => g.id);
        startGame(ids[rand(0, ids.length - 1)]);
      });
    });
  }

  function renderShop(el) {
    el.innerHTML = `
      <h1 class="page-title">${t('shop_title')}</h1>
      <p class="page-subtitle">${t('shop_sub')} · ${currentUser.points} ⭐</p>
      <h3 style="margin:16px 0 12px;font-weight:800">Avatarlar</h3>
      <div class="grid grid-4" id="shop-avatars"></div>
      <h3 style="margin:28px 0 12px;font-weight:800">Fonlar</h3>
      <div class="grid grid-4" id="shop-bgs"></div>
    `;
    const avGrid = el.querySelector('#shop-avatars');
    AVATARS.forEach(item => {
      const owned = currentUser.ownedItems.includes(item.id);
      avGrid.innerHTML += `
        <div class="card shop-item ${owned ? 'owned' : ''}" data-id="${item.id}" data-price="${item.price}" data-type="avatar">
          ${owned ? '<span class="owned-badge">✓</span>' : ''}
          <div class="item-preview">${item.emoji}</div>
          <div class="card-title" style="font-size:14px">${item.name}</div>
          <div class="card-meta" style="justify-content:center">
            <span class="badge ${owned ? 'badge-lime' : 'badge-orange'}">${owned ? t('owned') : item.price + ' ⭐'}</span>
          </div>
        </div>`;
    });
    const bgGrid = el.querySelector('#shop-bgs');
    BACKGROUNDS.forEach(item => {
      const owned = currentUser.ownedItems.includes(item.id);
      bgGrid.innerHTML += `
        <div class="card shop-item ${owned ? 'owned' : ''}" data-id="${item.id}" data-price="${item.price}" data-type="bg">
          ${owned ? '<span class="owned-badge">✓</span>' : ''}
          <div class="item-preview">${item.emoji}</div>
          <div class="card-title" style="font-size:14px">${item.name}</div>
          <div class="card-meta" style="justify-content:center">
            <span class="badge ${owned ? 'badge-lime' : 'badge-orange'}">${owned ? t('owned') : item.price + ' ⭐'}</span>
          </div>
        </div>`;
    });

    el.querySelectorAll('.shop-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const price = parseInt(card.dataset.price, 10);
        if (currentUser.ownedItems.includes(id)) {
          if (card.dataset.type === 'avatar') {
            Storage.setAvatar(id);
            currentUser = Storage.getCurrentUser();
            updateHeader();
            toast('Avatar o\'zgartirildi');
          }
          return;
        }
        const res = Storage.buyItem(id, price);
        if (res.ok) {
          toast(t('bought'));
          currentUser = Storage.getCurrentUser();
          updateHeader();
          renderShop(el);
        } else {
          toast(res.error === 'points' ? t('not_enough') : t('already_owned'));
        }
      });
    });
  }

  function renderProfile(el) {
    const u = currentUser;
    const emoji = getAvatarEmoji(u.activeAvatar);
    el.innerHTML = `
      <h1 class="page-title">${t('profile_title')}</h1>
      <div class="profile-header">
        <div class="profile-avatar-lg">${emoji}</div>
        <div class="profile-info">
          <h2>${u.name}</h2>
          <div style="color:var(--text-muted);font-size:14px">@${u.username} · ${t('age')}: ${u.age}</div>
          <div class="profile-stats">
            <div class="stat-pill">${t('level')} ${u.level}</div>
            <div class="stat-pill">${u.points} ⭐</div>
            <div class="stat-pill">XP ${u.xp}/${u.xpToNext}</div>
          </div>
          <div class="progress-bar" style="width:200px;margin-top:10px">
            <div class="progress-fill" style="width:${Math.min(100, (u.xp / u.xpToNext) * 100)}%"></div>
          </div>
        </div>
      </div>
      <div class="grid grid-2 mt-24">
        <div class="card stat-card">
          <div class="big-num">${u.stats.gamesPlayed || 0}</div>
          <div>${t('games_played')}</div>
        </div>
        <div class="card stat-card">
          <div class="big-num">${u.stats.correctAnswers || 0}</div>
          <div>${t('correct_answers')}</div>
        </div>
        <div class="card stat-card">
          <div class="big-num">${u.stats.bestStreak || 0}</div>
          <div>${t('current_streak')}</div>
        </div>
        <div class="card stat-card">
          <div class="big-num">${Math.floor((u.stats.totalTime || 0) / 60)}m</div>
          <div>${t('total_time')}</div>
        </div>
      </div>
      <h3 style="margin:28px 0 12px;font-weight:800">${t('medals')}</h3>
      <div class="flex gap-12 flex-wrap">
        ${(u.medals && u.medals.length) ? u.medals.map(m => `<span class="badge badge-lime">${m}</span>`).join('') : '<span style="color:var(--text-muted)">' + t('no_data') + '</span>'}
      </div>
    `;
  }

  function renderParent(el) {
    const u = currentUser;
    const hist = (u.gameHistory || []).slice(0, 8);
    el.innerHTML = `
      <h1 class="page-title">${t('parent_title')}</h1>
      <p class="page-subtitle">${t('parent_sub')}</p>
      <div class="grid grid-3 mb-16">
        <div class="card stat-card">
          <div class="big-num">${u.level}</div>
          <div>${t('level')}</div>
        </div>
        <div class="card stat-card">
          <div class="big-num">${u.stats.gamesPlayed || 0}</div>
          <div>${t('games_played')}</div>
        </div>
        <div class="card stat-card">
          <div class="big-num">${u.stats.correctAnswers || 0}</div>
          <div>${t('correct_answers')}</div>
        </div>
      </div>
      <h3 style="font-weight:800;margin-bottom:12px">So'nggi o'yinlar</h3>
      <div class="card">
        ${hist.length === 0 ? `<p style="color:var(--text-muted)">${t('no_data')}</p>` :
          hist.map(h => `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px">
              <span>${h.gameId}</span>
              <span>${h.correct}/${h.total} · ${h.score}⭐</span>
              <span style="color:var(--text-muted)">${new Date(h.date).toLocaleDateString()}</span>
            </div>`).join('')}
      </div>
      <div class="mt-24">
        <p style="font-size:13px;color:var(--text-muted)">* Demo rejimida ota-ona paneli bolaning o'z akkauntidan ko'rinadi. Haqiqiy loyihada alohida ota-ona akkaunti va nazorat sozlamalari bo'ladi.</p>
      </div>
    `;
  }

  function renderLeaderboard(el) {
    const users = Object.values(Storage.getUsers()).sort((a, b) => b.points - a.points).slice(0, 10);
    el.innerHTML = `
      <h1 class="page-title">${t('leaderboard_title')}</h1>
      <p class="page-subtitle">Top o'yinchilar (lokal demo)</p>
      <div class="card">
        ${users.length === 0 ? `<p>${t('no_data')}</p>` :
          users.map((u, i) => `
            <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
              <span style="font-weight:800;width:28px;color:var(--primary-dark)">#${i + 1}</span>
              <span style="font-size:24px">${getAvatarEmoji(u.activeAvatar)}</span>
              <div style="flex:1">
                <div style="font-weight:700">${u.name}</div>
                <div style="font-size:12px;color:var(--text-muted)">Level ${u.level}</div>
              </div>
              <span style="font-weight:800;color:#854d0e">${u.points} ⭐</span>
            </div>`).join('')}
      </div>
    `;
  }

  // ---------- Game Engine ----------
  function startGame(gameId) {
    currentGame = gameId;
    currentUser = Storage.getCurrentUser();
    const age = currentUser.age || 7;
    let questions = [];
    let isMemory = false;

    switch (gameId) {
      case 'math': questions = Games.generateMath(age); break;
      case 'logic': questions = Games.generateLogic(age); break;
      case 'memory': isMemory = true; questions = Games.generateMemory(age); break;
      case 'words': questions = Games.generateWords(); break;
      case 'colors': questions = Games.generateColors(age); break;
      case 'shapes': questions = Games.generateShapes(); break;
      case 'numbers': questions = Games.generateNumbers(age); break;
      case 'alphabet': questions = Games.generateAlphabet(); break;
      case 'animals': questions = Games.generateAnimals(); break;
      case 'quiz': questions = Games.generateQuiz(age); break;
      case 'puzzle': questions = Games.generatePuzzle(); break;
      case 'find_pic': questions = Games.generateFindPic(); break;
      default: questions = Games.generateMath(age);
    }

    gameState = {
      gameId,
      questions,
      index: 0,
      score: 0,
      correct: 0,
      total: isMemory ? questions.length / 2 : questions.length,
      startTime: Date.now(),
      timer: null,
      timeLeft: isMemory ? 90 : 60,
      isMemory,
      memoryCards: isMemory ? questions : null,
      flipped: [],
      matched: 0
    };

    const main = document.getElementById('main-content');
    main.innerHTML = '';
    if (isMemory) {
      renderMemoryGame(main);
    } else {
      renderQuestion(main);
    }
  }

  function renderQuestion(el) {
    const s = gameState;
    if (s.index >= s.questions.length) {
      endGame();
      return;
    }
    const q = s.questions[s.index];
    clearInterval(s.timer);

    el.innerHTML = `
      <div class="game-area">
        <div class="game-header">
          <button class="btn btn-outline btn-sm" id="game-back">←</button>
          <div class="game-timer" id="game-timer">${s.timeLeft}s</div>
          <div class="game-score">${t('score')}: ${s.score}</div>
        </div>
        <div class="question-card">
          ${q.type === 'color' ? `<div class="color-swatch" style="background:${q.hex};border:2px solid #cbd5e1"></div>` : ''}
          ${q.type === 'shape' || q.type === 'animal' ? `<div class="shape-item">${q.emoji}</div>` : ''}
          <div class="question-text">${q.q || (q.type === 'color' ? 'Bu qanday rang?' : q.type === 'shape' ? 'Bu qanday shakl?' : q.type === 'animal' ? 'Bu qaysi hayvon?' : '')}</div>
          <div class="options-grid" id="options"></div>
        </div>
        <div style="text-align:center;color:var(--text-muted);font-size:13px">${s.index + 1} / ${s.questions.length}</div>
      </div>
    `;

    const opts = el.querySelector('#options');
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(opt, q.answer, btn));
      opts.appendChild(btn);
    });

    el.querySelector('#game-back').addEventListener('click', () => {
      clearInterval(s.timer);
      renderPage('games');
    });

    s.timer = setInterval(() => {
      s.timeLeft--;
      const timerEl = document.getElementById('game-timer');
      if (timerEl) timerEl.textContent = s.timeLeft + 's';
      if (s.timeLeft <= 0) {
        clearInterval(s.timer);
        endGame();
      }
    }, 1000);
  }

  function selectAnswer(selected, correct, btn) {
    const s = gameState;
    clearInterval(s.timer);
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (String(selected) === String(correct)) {
      btn.classList.add('correct');
      s.score += 15;
      s.correct++;
      toast(t('correct'));
    } else {
      btn.classList.add('wrong');
      buttons.forEach(b => {
        if (String(b.textContent) === String(correct)) b.classList.add('correct');
      });
      toast(t('wrong'));
    }

    setTimeout(() => {
      s.index++;
      s.timeLeft = Math.max(20, s.timeLeft); // small refill
      const main = document.getElementById('main-content');
      renderQuestion(main);
    }, 900);
  }

  function renderMemoryGame(el) {
    const s = gameState;
    el.innerHTML = `
      <div class="game-area">
        <div class="game-header">
          <button class="btn btn-outline btn-sm" id="game-back">←</button>
          <div class="game-timer" id="game-timer">${s.timeLeft}s</div>
          <div class="game-score">${t('score')}: ${s.score}</div>
        </div>
        <div class="memory-grid" id="memory-grid"></div>
      </div>
    `;
    const grid = el.querySelector('#memory-grid');
    s.memoryCards.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'memory-card' + (card.flipped || card.matched ? ' flipped' : '') + (card.matched ? ' matched' : '');
      div.dataset.index = i;
      div.textContent = (card.flipped || card.matched) ? card.emoji : '';
      div.addEventListener('click', () => flipCard(i));
      grid.appendChild(div);
    });

    el.querySelector('#game-back').addEventListener('click', () => {
      clearInterval(s.timer);
      renderPage('games');
    });

    s.timer = setInterval(() => {
      s.timeLeft--;
      const timerEl = document.getElementById('game-timer');
      if (timerEl) timerEl.textContent = s.timeLeft + 's';
      if (s.timeLeft <= 0) {
        clearInterval(s.timer);
        endGame();
      }
    }, 1000);
  }

  function flipCard(index) {
    const s = gameState;
    const card = s.memoryCards[index];
    if (card.flipped || card.matched || s.flipped.length >= 2) return;

    card.flipped = true;
    s.flipped.push(index);
    renderMemoryGame(document.getElementById('main-content'));

    if (s.flipped.length === 2) {
      const [a, b] = s.flipped;
      if (s.memoryCards[a].emoji === s.memoryCards[b].emoji) {
        s.memoryCards[a].matched = true;
        s.memoryCards[b].matched = true;
        s.matched++;
        s.score += 20;
        s.correct++;
        s.flipped = [];
        if (s.matched >= s.total) {
          setTimeout(endGame, 600);
        } else {
          setTimeout(() => renderMemoryGame(document.getElementById('main-content')), 400);
        }
      } else {
        setTimeout(() => {
          s.memoryCards[a].flipped = false;
          s.memoryCards[b].flipped = false;
          s.flipped = [];
          renderMemoryGame(document.getElementById('main-content'));
        }, 700);
      }
    }
  }

  function endGame() {
    clearInterval(gameState.timer);
    const s = gameState;
    const timeSpent = Math.floor((Date.now() - s.startTime) / 1000);
    Storage.recordGame(s.gameId, s.score, s.correct, s.total, timeSpent);
    currentUser = Storage.getCurrentUser();
    updateHeader();

    const modal = document.getElementById('result-modal');
    const emoji = s.correct >= s.total * 0.8 ? '🎉' : s.correct >= s.total * 0.5 ? '👍' : '💪';
    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-title').textContent = s.correct >= s.total * 0.7 ? t('great') : t('good');
    document.getElementById('result-score').textContent = `${t('score')}: ${s.score} · ${s.correct}/${s.total}`;
    modal.classList.remove('hidden');

    document.getElementById('result-replay').onclick = () => {
      modal.classList.add('hidden');
      startGame(s.gameId);
    };
    document.getElementById('result-home').onclick = () => {
      modal.classList.add('hidden');
      renderPage('home');
    };
  }

  // ---------- Utils ----------
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 300);
    }, 2200);
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
})();
