/* =========================================================
   LEVELKIDS — Interactive 12-Game Engine (Age 3-12 Adaptive)
   ========================================================= */

const GameEngine = {
  activeGame: null,
  stage: 1,
  maxStages: 5,
  score: 0,
  correctCount: 0,
  seconds: 0,
  timerInterval: null,
  selectedTile: null,

  playTone(freq = 520, duration = 0.25, type = "sine") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  startGame(gameId) {
    const user = App.currentUser;
    if (user.parentSettings.minutesPlayedToday >= user.parentSettings.dailyLimitMinutes) {
      App.showToast(t("time_limit_reached"));
      return;
    }

    const gameMeta = GAMES_CATALOG.find(g => g.id === gameId);
    if (!gameMeta) return;

    this.activeGame = gameMeta;
    this.stage = 1;
    this.maxStages = (gameId === "memory" || gameId === "puzzle") ? 2 : 5;
    this.score = 0;
    this.correctCount = 0;
    this.seconds = 0;

    document.getElementById("stage-game-icon").textContent = gameMeta.icon;
    document.getElementById("stage-game-title").textContent = gameMeta.title[currentLang];
    document.getElementById("stage-score").textContent = "0";
    document.getElementById("stage-timer").textContent = "00:00";
    document.getElementById("game-modal").classList.remove("hidden");

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.seconds++;
      const m = String(Math.floor(this.seconds / 60)).padStart(2, "0");
      const s = String(this.seconds % 60).padStart(2, "0");
      document.getElementById("stage-timer").textContent = `${m}:${s}`;
      if (this.seconds % 60 === 0) {
        user.parentSettings.minutesPlayedToday += 1;
        StorageManager.updateUser(user);
      }
    }, 1000);

    this.renderStage();
  },

  closeGame() {
    clearInterval(this.timerInterval);
    document.getElementById("game-modal").classList.add("hidden");
  },

  updateHUD() {
    const user = App.currentUser;
    document.getElementById("stage-game-sub").textContent =
      `${t("stage_label")} ${this.stage}/${this.maxStages} • ${user.age} ${t("age_years")}`;
    document.getElementById("stage-score").textContent = this.score;
    const pct = Math.round(((this.stage - 1) / this.maxStages) * 100);
    document.getElementById("stage-progress-bar").style.width = `${Math.max(12, pct)}%`;
  },

  renderStage() {
    this.updateHUD();
    const area = document.getElementById("game-canvas-area");
    const age = App.currentUser.age;
    const id = this.activeGame.id;

    if (id === "memory") return this.renderMemoryGame(area, age);
    if (id === "puzzle") return this.renderPuzzleGame(area);

    const q = this.generateQuestion(id, age);
    area.innerHTML = `
      ${q.extraHtml || ""}
      <div class="question-prompt">${q.prompt}</div>
      <div class="options-grid">
        ${q.options.map(opt => `
          <button class="option-btn" onclick="GameEngine.checkAnswer(this, '${String(opt).replace(/'/g, "\\'")}', '${String(q.answer).replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join("")}
      </div>
    `;
  },

  checkAnswer(btn, chosen, correct) {
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b => (b.disabled = true));

    if (chosen === correct) {
      btn.classList.add("correct");
      this.playTone(660, 0.22, "triangle");
      this.score += 25;
      this.correctCount += 1;
      App.showToast(t("correct_msg") + " +25 ⭐");
    } else {
      btn.classList.add("wrong");
      this.playTone(220, 0.3, "sawtooth");
      buttons.forEach(b => {
        if (b.textContent.trim() === correct) b.classList.add("correct");
      });
      App.showToast(t("wrong_msg"));
    }

    setTimeout(() => {
      if (this.stage < this.maxStages) {
        this.stage++;
        this.renderStage();
      } else {
        this.finishGame();
      }
    }, 950);
  },

  generateQuestion(id, age) {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    // Check admin custom questions first
    const custom = StorageManager.getCustomQuestions().filter(c => c.gameId === id);
    if (custom.length && Math.random() < 0.35) {
      const pick = custom[rand(0, custom.length - 1)];
      return { prompt: pick.question, options: shuffle(pick.options), answer: pick.answer };
    }

    if (id === "math") {
      if (age <= 5) {
        const a = rand(1, 5), b = rand(1, 5), ans = a + b;
        return { prompt: `${a} + ${b} = ?`, options: shuffle([ans, ans + 1, Math.max(1, ans - 1), ans + 2]), answer: String(ans) };
      } else if (age <= 8) {
        const a = rand(6, 20), b = rand(2, 12), ans = a + b;
        return { prompt: `${a} + ${b} = ?`, options: shuffle([ans, ans + 2, ans - 2, ans + 5]), answer: String(ans) };
      } else {
        const a = rand(3, 12), b = rand(4, 12), ans = a * b;
        return { prompt: `${a} × ${b} = ?`, options: shuffle([ans, ans + a, ans - b, ans + 6]), answer: String(ans) };
      }
    }

    if (id === "logic") {
      const start = rand(2, 6);
      const step = age <= 6 ? 2 : rand(3, 5);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const ans = start + step * 4;
      return {
        prompt: `${seq.join(", ")}, ... ?`,
        options: shuffle([ans, ans + step, ans - 1, ans + 2]),
        answer: String(ans)
      };
    }

    if (id === "word") {
      const words = {
        uz: [
          { w: "KITOB", h: "📚" }, { w: "QUYOSH", h: "☀️" }, { w: "OLMA", h: "🍎" },
          { w: "MAKTAB", h: "🏫" }, { w: "YULDUZ", h: "⭐" }, { w: "SAMOLYOT", h: "✈️" }
        ],
        ru: [
          { w: "КНИГА", h: "📚" }, { w: "СОЛНЦЕ", h: "☀️" }, { w: "ЯБЛОКО", h: "🍎" },
          { w: "ШКОЛА", h: "🏫" }, { w: "ЗВЕЗДА", h: "⭐" }, { w: "РАКЕТА", h: "🚀" }
        ],
        en: [
          { w: "APPLE", h: "🍎" }, { w: "PLANET", h: "🪐" }, { w: "ROCKET", h: "🚀" },
          { w: "TIGER", h: "🐯" }, { w: "OCEAN", h: "🌊" }, { w: "SCHOOL", h: "🏫" }
        ]
      };
      const list = words[currentLang] || words.uz;
      const item = list[rand(0, list.length - 1)];
      const scrambled = item.w.split("").sort(() => Math.random() - 0.5).join(" ");
      const distractors = list.filter(x => x.w !== item.w).slice(0, 3).map(x => x.w);
      return {
        prompt: `${item.h} [ ${scrambled} ]`,
        options: shuffle([item.w, ...distractors]),
        answer: item.w
      };
    }

    if (id === "picture") {
      const items = [
        { e: "🚀", uz: "Kosmik kema", ru: "Космический корабль", en: "Space Rocket" },
        { e: "🦖", uz: "Dinozavr", ru: "Динозавр", en: "Dinosaur" },
        { e: "🌈", uz: "Kamalak", ru: "Радуга", en: "Rainbow" },
        { e: "🐬", uz: "Delfin", ru: "Дельфин", en: "Dolphin" },
        { e: "🍉", uz: "Tarvuz", ru: "Арбуз", en: "Watermelon" }
      ];
      const target = items[rand(0, items.length - 1)];
      return {
        prompt: target[currentLang],
        options: shuffle(items.slice(0, 4).includes(target) ? items.slice(0, 4).map(i => i.e) : [target.e, "🦁", "🍎", "🚗"]),
        answer: target.e
      };
    }

    if (id === "animal_sound") {
      const animals = [
        { e: "🐶", sound: "Vov-vov! / Woof!", freq: 320, uz: "Kuchuk", ru: "Собака", en: "Dog" },
        { e: "🐱", sound: "Miyov-miyov! / Meow!", freq: 620, uz: "Mushuk", ru: "Кошка", en: "Cat" },
        { e: "🦁", sound: "R-r-r-roar!", freq: 160, uz: "Sher", ru: "Лев", en: "Lion" },
        { e: "🐸", sound: "Va-vaq! / Ribbit!", freq: 440, uz: "Qurbaqa", ru: "Лягушка", en: "Frog" },
        { e: "🐝", sound: "Bzz-z-z!", freq: 780, uz: "Asalari", ru: "Пчела", en: "Bee" }
      ];
      const pick = animals[rand(0, animals.length - 1)];
      return {
        extraHtml: `<button class="btn btn-primary-sky" style="margin-bottom:14px" onclick="GameEngine.playTone(${pick.freq}, 0.45, 'sawtooth')">🔊 Ovozni tinglash / Play Sound</button>`,
        prompt: `"${pick.sound}"`,
        options: shuffle(animals.slice(0, 4).includes(pick) ? animals.slice(0, 4).map(a => `${a.e} ${a[currentLang]}`) : [`${pick.e} ${pick[currentLang]}`, "🐮 Sigir", "🐴 Ot", "🐧 Pingvin"]),
        answer: `${pick.e} ${pick[currentLang]}`
      };
    }

    if (id === "alphabet") {
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "O", "P", "S", "T"];
      const idx = rand(0, letters.length - 3);
      return {
        prompt: `${letters[idx]} ➔ ${letters[idx + 1]} ➔ ?`,
        options: shuffle([letters[idx + 2], "Z", "Q", "W"]),
        answer: letters[idx + 2]
      };
    }

    if (id === "numbers") {
      const count = rand(2, age <= 6 ? 7 : 12);
      const emojis = ["🍎", "⭐", "🎈", "🍓", "🦋"];
      const em = emojis[rand(0, emojis.length - 1)];
      return {
        prompt: `${em.repeat(count)}`,
        options: shuffle([count, count + 1, Math.max(1, count - 1), count + 2]),
        answer: String(count)
      };
    }

    if (id === "colors") {
      const colors = [
        { box: "#EF4444", uz: "Qizil", ru: "Красный", en: "Red" },
        { box: "#38BDF8", uz: "Moviy", ru: "Голубой", en: "Sky Blue" },
        { box: "#84CC16", uz: "Yashil (Lime)", ru: "Зелёный", en: "Lime Green" },
        { box: "#FACC15", uz: "Sariq", ru: "Жёлтый", en: "Yellow" },
        { box: "#A855F7", uz: "Binafsha", ru: "Фиолетовый", en: "Purple" }
      ];
      const c = colors[rand(0, colors.length - 1)];
      return {
        extraHtml: `<div style="width:90px;height:90px;border-radius:24px;background:${c.box};margin:0 auto 14px;box-shadow:0 10px 25px rgba(0,0,0,0.12)"></div>`,
        prompt: currentLang === "uz" ? "Bu qaysi rang?" : currentLang === "ru" ? "Какой это цвет?" : "What color is this?",
        options: shuffle(colors.slice(0, 4).includes(c) ? colors.slice(0, 4).map(x => x[currentLang]) : [c[currentLang], "Qora / Black", "Oq / White", "Kulrang / Gray"]),
        answer: c[currentLang]
      };
    }

    if (id === "shapes") {
      const shapes = [
        { s: "🔴", uz: "Doira", ru: "Круг", en: "Circle" },
        { s: "🟦", uz: "Kvadrat", ru: "Квадрат", en: "Square" },
        { s: "🔺", uz: "Uchburchak", ru: "Треугольник", en: "Triangle" },
        { s: "⭐", uz: "Yulduz", ru: "Звезда", en: "Star" }
      ];
      const sh = shapes[rand(0, shapes.length - 1)];
      return {
        prompt: `${sh.s}`,
        options: shuffle(shapes.map(x => x[currentLang])),
        answer: sh[currentLang]
      };
    }

    // Default: quiz
    const trivia = [
      {
        q: { uz: "Quyosh sistemasidagi eng katta sayyora qaysi?", ru: "Какая самая большая планета Солнечной системы?", en: "What is the largest planet in our Solar System?" },
        a: { uz: "Yupiter", ru: "Юпитер", en: "Jupiter" },
        o: { uz: ["Yupiter", "Mars", "Yer", "Venera"], ru: ["Юпитер", "Марс", "Земля", "Венера"], en: ["Jupiter", "Mars", "Earth", "Venus"] }
      },
      {
        q: { uz: "Bir haftada necha kun bor?", ru: "Сколько дней в неделе?", en: "How many days are in a week?" },
        a: { uz: "7 kun", ru: "7 дней", en: "7 days" },
        o: { uz: ["7 kun", "5 kun", "10 kun", "12 kun"], ru: ["7 дней", "5 дней", "10 дней", "12 дней"], en: ["7 days", "5 days", "10 days", "12 days"] }
      },
      {
        q: { uz: "O'simliklar o'sishi uchun nima kerak?", ru: "Что нужно растениям для роста?", en: "What do plants need to grow?" },
        a: { uz: "Suv va Quyosh nuri", ru: "Вода и солнечный свет", en: "Water and Sunlight" },
        o: { uz: ["Suv va Quyosh nuri", "Muzqaymoq", "Qorong'ulik", "Tosh"], ru: ["Вода и солнечный свет", "Мороженое", "Темнота", "Камень"], en: ["Water and Sunlight", "Ice cream", "Darkness", "Rocks"] }
      }
    ];
    const tr = trivia[rand(0, trivia.length - 1)];
    return {
      prompt: tr.q[currentLang],
      options: shuffle(tr.o[currentLang]),
      answer: tr.a[currentLang]
    };
  },

  renderMemoryGame(area, age) {
    const icons = ["🦁", "🚀", "🍎", "🦄", "🐳", "🌈"];
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;

    area.innerHTML = `<div class="memory-grid" id="mem-grid"></div>`;
    const grid = document.getElementById("mem-grid");

    deck.forEach((icon, index) => {
      const card = document.createElement("button");
      card.className = "memory-card";
      card.textContent = "❓";
      card.onclick = () => {
        if (card.classList.contains("flipped") || card.classList.contains("matched") || flipped.length === 2) return;
        card.classList.add("flipped");
        card.textContent = icon;
        flipped.push({ card, icon });

        if (flipped.length === 2) {
          if (flipped[0].icon === flipped[1].icon) {
            flipped[0].card.classList.add("matched");
            flipped[1].card.classList.add("matched");
            flipped = [];
            matched += 2;
            this.score += 20;
            this.correctCount += 1;
            this.updateHUD();
            this.playTone(640, 0.2);
            if (matched === deck.length) {
              setTimeout(() => {
                if (this.stage < this.maxStages) {
                  this.stage++;
                  this.renderStage();
                } else {
                  this.finishGame();
                }
              }, 600);
            }
          } else {
            setTimeout(() => {
              flipped.forEach(f => {
                f.card.classList.remove("flipped");
                f.card.textContent = "❓";
              });
              flipped = [];
            }, 650);
          }
        }
      };
      grid.appendChild(card);
    });
  },

  renderPuzzleGame(area) {
    let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    this.selectedTile = null;

    const draw = () => {
      area.innerHTML = `
        <p style="margin-bottom:12px;font-weight:700">1 dan 9 gacha sonlarni ketma-ket joylashtiring (2 ta katakni bosing):</p>
        <div class="puzzle-grid">
          ${tiles.map((num, idx) => `
            <div class="puzzle-tile ${this.selectedTile === idx ? "selected-tile" : ""}" onclick="GameEngine.tapPuzzle(${idx})">${num}</div>
          `).join("")}
        </div>
      `;
    };

    this.tapPuzzle = idx => {
      if (this.selectedTile === null) {
        this.selectedTile = idx;
        draw();
      } else {
        const temp = tiles[this.selectedTile];
        tiles[this.selectedTile] = tiles[idx];
        tiles[idx] = temp;
        this.selectedTile = null;
        this.playTone(500, 0.12);
        draw();
        if (tiles.every((v, i) => v === i + 1)) {
          this.score += 60;
          this.correctCount += 1;
          setTimeout(() => {
            if (this.stage < this.maxStages) {
              this.stage++;
              this.renderStage();
            } else {
              this.finishGame();
            }
          }, 500);
        }
      }
    };
    draw();
  },

  finishGame() {
    clearInterval(this.timerInterval);
    document.getElementById("game-modal").classList.add("hidden");

    const user = App.currentUser;
    const isWin = this.correctCount >= Math.ceil(this.maxStages / 2);
    user.streak = isWin ? user.streak + 1 : 0;
    const streakBonus = user.streak >= 2 ? user.streak * 15 : 0;
    const totalPoints = this.score + streakBonus;
    const xpGain = 55 + this.correctCount * 15;

    const res = StorageManager.addPointsAndXP(
      user,
      totalPoints,
      xpGain,
      `${this.activeGame.title[currentLang]} (+${streakBonus} streak)`,
      this.activeGame.id,
      this.correctCount,
      this.maxStages
    );

    App.refreshTopbar();
    App.renderPage(App.currentPage);

    // Show Celebration Modal
    document.getElementById("cel-badge").textContent = res.milestoneGift ? "🎁" : res.leveledUp ? "🏆" : "🎉";
    document.getElementById("cel-title").textContent = res.milestoneGift
      ? t("gift_5_title")
      : res.leveledUp
      ? `${t("level_up_title")} Level ${res.newLevel}!`
      : t("game_complete_title");
    document.getElementById("cel-desc").textContent = `${this.activeGame.title[currentLang]} • ${this.correctCount}/${this.maxStages}`;
    document.getElementById("cel-rewards").innerHTML = `
      <span class="reward-pill">+${totalPoints} ⭐</span>
      <span class="reward-pill">+${xpGain} XP</span>
      ${streakBonus ? `<span class="reward-pill">🔥 ${t("streak_bonus")}: +${streakBonus}</span>` : ""}
    `;
    document.getElementById("cel-replay-btn").onclick = () => {
      document.getElementById("celebration-modal").classList.add("hidden");
      this.startGame(this.activeGame.id);
    };
    document.getElementById("cel-close-btn").onclick = () => {
      document.getElementById("celebration-modal").classList.add("hidden");
    };
    document.getElementById("celebration-modal").classList.remove("hidden");
    this.playTone(780, 0.4, "triangle");
  }
};