const Storage = {
  KEY: 'levelkids_user',
  USERS_KEY: 'levelkids_users',

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || {};
    } catch {
      return {};
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY));
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(this.KEY, JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem(this.KEY);
  },

  register(data) {
    const users = this.getUsers();
    const username = data.username.toLowerCase().trim();
    if (users[username]) {
      return { ok: false, error: 'Username already exists' };
    }
    const user = {
      id: Date.now().toString(36),
      name: data.name.trim(),
      username,
      email: data.email.trim(),
      password: data.password, // demo only
      age: parseInt(data.age, 10),
      avatar: data.avatar || '🦊',
      level: 1,
      points: 50,
      xp: 0,
      xpToNext: 100,
      ownedItems: ['avatar_fox'],
      activeAvatar: 'avatar_fox',
      medals: [],
      achievements: [],
      stats: {
        gamesPlayed: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        totalTime: 0,
        streak: 0,
        bestStreak: 0
      },
      gameHistory: [],
      worldsUnlocked: ['forest'],
      lastDailyBonus: null,
      createdAt: new Date().toISOString()
    };
    users[username] = user;
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { ok: true, user };
  },

  login(username, password) {
    const users = this.getUsers();
    const key = username.toLowerCase().trim();
    const user = users[key];
    if (!user || user.password !== password) {
      return { ok: false, error: 'Invalid credentials' };
    }
    this.setCurrentUser(user);
    return { ok: true, user };
  },

  updateUser(updates) {
    const user = this.getCurrentUser();
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.setCurrentUser(updated);
    const users = this.getUsers();
    users[user.username] = updated;
    this.saveUsers(users);
    return updated;
  },

  addPoints(amount) {
    const user = this.getCurrentUser();
    if (!user) return;
    let points = user.points + amount;
    let xp = user.xp + Math.max(5, Math.floor(amount / 2));
    let level = user.level;
    let xpToNext = user.xpToNext;
    let leveledUp = false;

    while (xp >= xpToNext) {
      xp -= xpToNext;
      level += 1;
      xpToNext = Math.floor(xpToNext * 1.15);
      leveledUp = true;
      // unlock worlds every 10 levels roughly
      if (level === 5 && !user.worldsUnlocked.includes('ocean')) {
        user.worldsUnlocked.push('ocean');
      }
      if (level === 10 && !user.worldsUnlocked.includes('space')) {
        user.worldsUnlocked.push('space');
      }
      if (level === 15 && !user.worldsUnlocked.includes('magic')) {
        user.worldsUnlocked.push('magic');
      }
      if (level === 20 && !user.worldsUnlocked.includes('dino')) {
        user.worldsUnlocked.push('dino');
      }
    }

    const stats = { ...user.stats };
    if (amount > 0) {
      stats.streak = (stats.streak || 0) + 1;
      stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak);
    } else {
      stats.streak = 0;
    }

    return this.updateUser({
      points,
      xp,
      level,
      xpToNext,
      worldsUnlocked: user.worldsUnlocked,
      stats
    });
  },

  recordGame(gameId, score, correct, total, timeSpent) {
    const user = this.getCurrentUser();
    if (!user) return;
    const stats = { ...user.stats };
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.correctAnswers = (stats.correctAnswers || 0) + correct;
    stats.wrongAnswers = (stats.wrongAnswers || 0) + (total - correct);
    stats.totalTime = (stats.totalTime || 0) + timeSpent;

    const history = user.gameHistory || [];
    history.unshift({
      gameId,
      score,
      correct,
      total,
      timeSpent,
      date: new Date().toISOString()
    });
    if (history.length > 50) history.length = 50;

    this.updateUser({ stats, gameHistory: history });
    this.addPoints(score);
  },

  claimDailyBonus() {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    const today = new Date().toDateString();
    if (user.lastDailyBonus === today) {
      return { ok: false, already: true };
    }
    this.updateUser({ lastDailyBonus: today, points: user.points + 50 });
    return { ok: true, amount: 50 };
  },

  buyItem(itemId, price) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    if (user.ownedItems.includes(itemId)) return { ok: false, error: 'owned' };
    if (user.points < price) return { ok: false, error: 'points' };
    const owned = [...user.ownedItems, itemId];
    this.updateUser({ points: user.points - price, ownedItems: owned });
    return { ok: true };
  },

  setAvatar(itemId) {
    const user = this.getCurrentUser();
    if (!user || !user.ownedItems.includes(itemId)) return;
    this.updateUser({ activeAvatar: itemId });
  }
};

const AVATARS = [
  { id: 'avatar_fox', emoji: '🦊', name: 'Fox', price: 0 },
  { id: 'avatar_cat', emoji: '🐱', name: 'Cat', price: 80 },
  { id: 'avatar_dog', emoji: '🐶', name: 'Dog', price: 80 },
  { id: 'avatar_panda', emoji: '🐼', name: 'Panda', price: 120 },
  { id: 'avatar_lion', emoji: '🦁', name: 'Lion', price: 150 },
  { id: 'avatar_unicorn', emoji: '🦄', name: 'Unicorn', price: 200 },
  { id: 'avatar_robot', emoji: '🤖', name: 'Robot', price: 180 },
  { id: 'avatar_alien', emoji: '👽', name: 'Alien', price: 160 },
  { id: 'avatar_dragon', emoji: '🐲', name: 'Dragon', price: 250 },
  { id: 'avatar_owl', emoji: '🦉', name: 'Owl', price: 100 },
  { id: 'avatar_bear', emoji: '🐻', name: 'Bear', price: 90 },
  { id: 'avatar_rabbit', emoji: '🐰', name: 'Rabbit', price: 70 },
  { id: 'avatar_tiger', emoji: '🐯', name: 'Tiger', price: 140 },
  { id: 'avatar_monkey', emoji: '🐵', name: 'Monkey', price: 90 },
  { id: 'avatar_frog', emoji: '🐸', name: 'Frog', price: 60 },
  { id: 'avatar_chick', emoji: '🐥', name: 'Chick', price: 50 },
  { id: 'avatar_whale', emoji: '🐳', name: 'Whale', price: 170 },
  { id: 'avatar_dino', emoji: '🦕', name: 'Dino', price: 220 },
  { id: 'avatar_star', emoji: '⭐', name: 'Star', price: 100 },
  { id: 'avatar_rocket', emoji: '🚀', name: 'Rocket', price: 190 },
  { id: 'avatar_ghost', emoji: '👻', name: 'Ghost', price: 130 },
  { id: 'avatar_fairy', emoji: '🧚', name: 'Fairy', price: 210 },
  { id: 'avatar_ninja', emoji: '🥷', name: 'Ninja', price: 240 },
  { id: 'avatar_wizard', emoji: '🧙', name: 'Wizard', price: 260 },
  { id: 'avatar_knight', emoji: '🦸', name: 'Hero', price: 230 },
  { id: 'avatar_princess', emoji: '👸', name: 'Princess', price: 200 },
  { id: 'avatar_pirate', emoji: '🏴‍☠️', name: 'Pirate', price: 180 },
  { id: 'avatar_astronaut', emoji: '👨‍🚀', name: 'Astronaut', price: 250 },
  { id: 'avatar_chef', emoji: '👨‍🍳', name: 'Chef', price: 110 },
  { id: 'avatar_artist', emoji: '🎨', name: 'Artist', price: 120 },
  { id: 'avatar_scientist', emoji: '🔬', name: 'Scientist', price: 150 }
];

const BACKGROUNDS = [
  { id: 'bg_sky', emoji: '☁️', name: 'Sky', price: 100 },
  { id: 'bg_forest', emoji: '🌲', name: 'Forest', price: 120 },
  { id: 'bg_ocean', emoji: '🌊', name: 'Ocean', price: 130 },
  { id: 'bg_space', emoji: '🌌', name: 'Space', price: 180 },
  { id: 'bg_magic', emoji: '✨', name: 'Magic', price: 200 },
  { id: 'bg_candy', emoji: '🍬', name: 'Candy', price: 150 },
  { id: 'bg_sunset', emoji: '🌅', name: 'Sunset', price: 140 },
  { id: 'bg_rainbow', emoji: '🌈', name: 'Rainbow', price: 160 },
  { id: 'bg_snow', emoji: '❄️', name: 'Snow', price: 110 },
  { id: 'bg_desert', emoji: '🏜️', name: 'Desert', price: 100 },
  { id: 'bg_city', emoji: '🏙️', name: 'City', price: 170 },
  { id: 'bg_farm', emoji: '🌾', name: 'Farm', price: 90 },
  { id: 'bg_castle', emoji: '🏰', name: 'Castle', price: 220 },
  { id: 'bg_volcano', emoji: '🌋', name: 'Volcano', price: 190 },
  { id: 'bg_underwater', emoji: '🐠', name: 'Underwater', price: 160 },
  { id: 'bg_galaxy', emoji: '🪐', name: 'Galaxy', price: 250 },
  { id: 'bg_meadow', emoji: '🌼', name: 'Meadow', price: 80 },
  { id: 'bg_mountain', emoji: '⛰️', name: 'Mountain', price: 130 },
  { id: 'bg_beach', emoji: '🏖️', name: 'Beach', price: 120 },
  { id: 'bg_night', emoji: '🌙', name: 'Night', price: 140 }
];

function getAvatarEmoji(id) {
  const a = AVATARS.find(x => x.id === id);
  return a ? a.emoji : '🦊';
}
