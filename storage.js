/* =========================================================
   LEVELKIDS — LocalStorage State, Level 1-100, Security & Admin Data
   ========================================================= */

const StorageManager = {
  KEY_USERS: "lk_users_db",
  KEY_ACTIVE: "lk_active_user",
  KEY_CUSTOM_Q: "lk_custom_questions",

  getUsers() {
    return JSON.parse(localStorage.getItem(this.KEY_USERS) || "[]");
  },

  saveUsers(users) {
    localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
  },

  getActiveUsername() {
    return localStorage.getItem(this.KEY_ACTIVE);
  },

  setActiveUsername(username) {
    if (username) localStorage.setItem(this.KEY_ACTIVE, username);
    else localStorage.removeItem(this.KEY_ACTIVE);
  },

  createUser({ name, username, email, password, age, avatar }) {
    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { error: "Bu foydalanuvchi nomi band!" };
    }
    const newUser = {
      name,
      username,
      email,
      password,
      age: Number(age) || 7,
      avatar: avatar || "🦁",
      bg: "linear-gradient(135deg, #FFFFFF, #E0F2FE)",
      frame: "",
      pet: "",
      skin: "",
      points: 200,
      xp: 0,
      level: 1,
      streak: 0,
      lastBonusDate: "",
      ownedItems: ["av_1", "av_2", "av_3", "av_4", "av_5", "av_6", "bg_1"],
      medals: ["🌟 Boshlang'ich Qahramon"],
      history: [
        { date: new Date().toLocaleDateString(), text: "Ro'yxatdan o'tish bonusi", delta: "+200 ⭐" }
      ],
      stats: {
        gamesPlayed: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        byGame: {}
      },
      questProgress: { q1: 0, q2: 0, q3: 0, claimed: [] },
      parentSettings: {
        dailyLimitMinutes: 60,
        minutesPlayedToday: 0,
        lastPlayDate: new Date().toDateString(),
        allowOnlineArena: true,
        allowChat: false,
        pinCode: "1234"
      }
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setActiveUsername(newUser.username);
    return { user: newUser };
  },

  loginUser(loginId, password) {
    const users = this.getUsers();
    const user = users.find(
      u => (u.username.toLowerCase() === loginId.toLowerCase() || u.email.toLowerCase() === loginId.toLowerCase()) &&
           u.password === password
    );
    if (!user) return { error: "Login yoki parol noto'g'ri!" };
    this.setActiveUsername(user.username);
    return { user };
  },

  getCurrentUser() {
    const uname = this.getActiveUsername();
    if (!uname) return null;
    const users = this.getUsers();
    const user = users.find(u => u.username === uname);
    if (user) {
      const today = new Date().toDateString();
      if (user.parentSettings.lastPlayDate !== today) {
        user.parentSettings.lastPlayDate = today;
        user.parentSettings.minutesPlayedToday = 0;
        this.updateUser(user);
      }
    }
    return user || null;
  },

  updateUser(updatedUser) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.username === updatedUser.username);
    if (idx !== -1) {
      users[idx] = updatedUser;
      this.saveUsers(users);
    }
  },

  addPointsAndXP(user, pointsEarned, xpEarned, reason, gameId = null, correctCount = 0, totalCount = 0) {
    user.points += pointsEarned;
    user.xp += xpEarned;
    user.history.unshift({
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: reason,
      delta: `+${pointsEarned} ⭐`
    });
    if (user.history.length > 30) user.history.pop();

    if (gameId) {
      user.stats.gamesPlayed += 1;
      user.stats.correctAnswers += correctCount;
      user.stats.totalQuestions += totalCount;
      user.stats.byGame[gameId] = (user.stats.byGame[gameId] || 0) + 1;
      user.questProgress.q1 += 1;
      user.questProgress.q2 += correctCount;
      if (gameId === "math") user.questProgress.q3 += 1;
    }

    // Level 1 to Level 100 progression (100 XP per level)
    let leveledUp = false;
    let milestoneGift = false;
    while (user.xp >= user.level * 100 && user.level < 100) {
      user.xp -= user.level * 100;
      user.level += 1;
      leveledUp = true;
      if (user.level % 5 === 0) {
        milestoneGift = true;
        user.points += 250;
        user.medals.push(`🏅 Level ${user.level} Ustasi`);
        user.history.unshift({
          date: new Date().toLocaleDateString(),
          text: `Level ${user.level} maxsus sovg'asi`,
          delta: "+250 ⭐"
        });
      }
    }
    this.updateUser(user);
    return { leveledUp, milestoneGift, newLevel: user.level };
  },

  getCustomQuestions() {
    return JSON.parse(localStorage.getItem(this.KEY_CUSTOM_Q) || "[]");
  },

  addCustomQuestion(qObj) {
    const list = this.getCustomQuestions();
    list.push({ id: Date.now(), ...qObj });
    localStorage.setItem(this.KEY_CUSTOM_Q, JSON.stringify(list));
  }
};