const Games = {
  list: [
    { id: 'math', icon: '🔢', nameKey: 'math', color: '#38bdf8', desc: 'Misollarni yeching' },
    { id: 'logic', icon: '🧠', nameKey: 'logic', color: '#a78bfa', desc: 'Mantiqiy savollar' },
    { id: 'memory', icon: '🃏', nameKey: 'memory', color: '#f472b6', desc: 'Xotirani sinang' },
    { id: 'words', icon: '🔤', nameKey: 'words', color: '#34d399', desc: 'So\'zlarni toping' },
    { id: 'colors', icon: '🎨', nameKey: 'colors', color: '#fbbf24', desc: 'Ranglarni o\'rganing' },
    { id: 'shapes', icon: '⬛', nameKey: 'shapes', color: '#fb7185', desc: 'Shakllarni toping' },
    { id: 'numbers', icon: '1️⃣', nameKey: 'numbers', color: '#60a5fa', desc: 'Sonlarni o\'rganing' },
    { id: 'alphabet', icon: '🅰️', nameKey: 'alphabet', color: '#c084fc', desc: 'Alifboni o\'rganing' },
    { id: 'animals', icon: '🦁', nameKey: 'animals', color: '#4ade80', desc: 'Hayvonlarni toping' },
    { id: 'quiz', icon: '⚡', nameKey: 'quiz', color: '#f97316', desc: 'Tezkor savol-javob' },
    { id: 'puzzle', icon: '🧩', nameKey: 'puzzle', color: '#22d3ee', desc: 'Rasmlarni yig\'ing' },
    { id: 'find_pic', icon: '🔍', nameKey: 'find_pic', color: '#e879f9', desc: 'To\'g\'ri rasmni toping' }
  ],

  // ===== MATH =====
  generateMath(age) {
    const questions = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      let a, b, op, answer;
      if (age <= 5) {
        a = rand(1, 5); b = rand(1, 5); op = '+';
        answer = a + b;
      } else if (age <= 7) {
        if (Math.random() > 0.4) {
          a = rand(1, 12); b = rand(1, 12); op = '+'; answer = a + b;
        } else {
          a = rand(5, 15); b = rand(1, a); op = '−'; answer = a - b;
        }
      } else if (age <= 9) {
        const r = Math.random();
        if (r < 0.4) { a = rand(10, 50); b = rand(5, 30); op = '+'; answer = a + b; }
        else if (r < 0.7) { a = rand(15, 60); b = rand(5, a); op = '−'; answer = a - b; }
        else { a = rand(2, 9); b = rand(2, 9); op = '×'; answer = a * b; }
      } else {
        const r = Math.random();
        if (r < 0.3) { a = rand(20, 99); b = rand(10, 50); op = '+'; answer = a + b; }
        else if (r < 0.55) { a = rand(30, 99); b = rand(10, a); op = '−'; answer = a - b; }
        else if (r < 0.8) { a = rand(3, 12); b = rand(3, 12); op = '×'; answer = a * b; }
        else { a = rand(2, 10) * rand(2, 8); b = a / (rand(2, 6) || 2); b = Math.round(b); if (b < 2) b = 2; a = b * rand(2, 9); op = '÷'; answer = a / b; }
      }
      const options = shuffle([answer, answer + rand(1, 4), Math.max(0, answer - rand(1, 3)), answer + rand(5, 9)].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4));
      while (options.length < 4) options.push(answer + options.length + 1);
      questions.push({
        q: `${a} ${op} ${b} = ?`,
        options: shuffle(options.slice(0, 4)),
        answer
      });
    }
    return questions;
  },

  // ===== LOGIC =====
  generateLogic(age) {
    const patterns = [
      { q: '2, 4, 6, 8, ?', options: [10, 9, 12, 7], answer: 10 },
      { q: '1, 3, 5, 7, ?', options: [9, 8, 10, 6], answer: 9 },
      { q: '5, 10, 15, 20, ?', options: [25, 22, 30, 18], answer: 25 },
      { q: '10, 9, 8, 7, ?', options: [6, 5, 8, 9], answer: 6 },
      { q: '1, 2, 4, 8, ?', options: [16, 12, 10, 9], answer: 16 },
      { q: '3, 6, 9, 12, ?', options: [15, 14, 18, 13], answer: 15 },
      { q: '100, 90, 80, 70, ?', options: [60, 65, 50, 75], answer: 60 },
      { q: '2, 3, 5, 8, 12, ?', options: [17, 15, 16, 14], answer: 17 },
      { q: 'A, C, E, G, ?', options: ['I', 'H', 'J', 'F'], answer: 'I' },
      { q: 'Z, Y, X, W, ?', options: ['V', 'U', 'T', 'S'], answer: 'V' }
    ];
    return shuffle(patterns).slice(0, 7).map(p => ({
      q: p.q,
      options: shuffle([...p.options]),
      answer: p.answer
    }));
  },

  // ===== COLORS =====
  generateColors(age) {
    const colors = [
      { name: { uz: 'Qizil', ru: 'Красный', en: 'Red' }, hex: '#ef4444' },
      { name: { uz: 'Ko\'k', ru: 'Синий', en: 'Blue' }, hex: '#3b82f6' },
      { name: { uz: 'Yashil', ru: 'Зелёный', en: 'Green' }, hex: '#22c55e' },
      { name: { uz: 'Sariq', ru: 'Жёлтый', en: 'Yellow' }, hex: '#eab308' },
      { name: { uz: 'To\'q sariq', ru: 'Оранжевый', en: 'Orange' }, hex: '#f97316' },
      { name: { uz: 'Binafsha', ru: 'Фиолетовый', en: 'Purple' }, hex: '#a855f7' },
      { name: { uz: 'Pushti', ru: 'Розовый', en: 'Pink' }, hex: '#ec4899' },
      { name: { uz: 'Jigarrang', ru: 'Коричневый', en: 'Brown' }, hex: '#92400e' },
      { name: { uz: 'Qora', ru: 'Чёрный', en: 'Black' }, hex: '#171717' },
      { name: { uz: 'Oq', ru: 'Белый', en: 'White' }, hex: '#f8fafc' }
    ];
    const qs = [];
    for (let i = 0; i < 8; i++) {
      const correct = colors[rand(0, colors.length - 1)];
      const opts = shuffle([correct, ...shuffle(colors.filter(c => c !== correct)).slice(0, 3)]);
      qs.push({
        type: 'color',
        hex: correct.hex,
        options: opts.map(o => o.name[currentLang] || o.name.uz),
        answer: correct.name[currentLang] || correct.name.uz
      });
    }
    return qs;
  },

  // ===== SHAPES =====
  generateShapes() {
    const shapes = [
      { emoji: '⭕', name: { uz: 'Doira', ru: 'Круг', en: 'Circle' } },
      { emoji: '⬛', name: { uz: 'Kvadrat', ru: 'Квадрат', en: 'Square' } },
      { emoji: '▲', name: { uz: 'Uchburchak', ru: 'Треугольник', en: 'Triangle' } },
      { emoji: '⭐', name: { uz: 'Yulduz', ru: 'Звезда', en: 'Star' } },
      { emoji: '❤️', name: { uz: 'Yurak', ru: 'Сердце', en: 'Heart' } },
      { emoji: '🔷', name: { uz: 'Romb', ru: 'Ромб', en: 'Diamond' } },
      { emoji: '⬟', name: { uz: 'Beshburchak', ru: 'Пятиугольник', en: 'Pentagon' } },
      { emoji: '▮', name: { uz: 'To\'rtburchak', ru: 'Прямоугольник', en: 'Rectangle' } }
    ];
    const qs = [];
    for (let i = 0; i < 7; i++) {
      const correct = shapes[rand(0, shapes.length - 1)];
      const opts = shuffle([correct, ...shuffle(shapes.filter(s => s !== correct)).slice(0, 3)]);
      qs.push({
        type: 'shape',
        emoji: correct.emoji,
        options: opts.map(o => o.name[currentLang] || o.name.uz),
        answer: correct.name[currentLang] || correct.name.uz
      });
    }
    return qs;
  },

  // ===== NUMBERS =====
  generateNumbers(age) {
    const qs = [];
    for (let i = 0; i < 8; i++) {
      const n = age <= 5 ? rand(1, 10) : age <= 8 ? rand(1, 20) : rand(10, 50);
      const options = shuffle([n, n + 1, Math.max(1, n - 1), n + 2].filter((v, idx, a) => a.indexOf(v) === idx));
      qs.push({
        q: age <= 6 ? `${'⭐'.repeat(Math.min(n, 10))} = ?` : `Qaysi son? ${n}`,
        display: n,
        options: options.map(String),
        answer: String(n)
      });
    }
    return qs;
  },

  // ===== ALPHABET =====
  generateAlphabet() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const qs = [];
    for (let i = 0; i < 8; i++) {
      const idx = rand(0, letters.length - 2);
      const correct = letters[idx + 1];
      const opts = shuffle([correct, letters[rand(0, letters.length - 1)], letters[rand(0, letters.length - 1)], letters[rand(0, letters.length - 1)]].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 4);
      while (opts.length < 4) opts.push(letters[rand(0, 25)]);
      qs.push({
        q: `${letters[idx]} dan keyin qaysi harf?`,
        options: shuffle(opts),
        answer: correct
      });
    }
    return qs;
  },

  // ===== ANIMALS =====
  generateAnimals() {
    const animals = [
      { emoji: '🐶', name: { uz: 'It', ru: 'Собака', en: 'Dog' } },
      { emoji: '🐱', name: { uz: 'Mushuk', ru: 'Кошка', en: 'Cat' } },
      { emoji: '🦁', name: { uz: 'Sher', ru: 'Лев', en: 'Lion' } },
      { emoji: '🐘', name: { uz: 'Fil', ru: 'Слон', en: 'Elephant' } },
      { emoji: '🦒', name: { uz: 'Jirafa', ru: 'Жираф', en: 'Giraffe' } },
      { emoji: '🐼', name: { uz: 'Panda', ru: 'Панда', en: 'Panda' } },
      { emoji: '🦊', name: { uz: 'Tulki', ru: 'Лиса', en: 'Fox' } },
      { emoji: '🐰', name: { uz: 'Quyon', ru: 'Кролик', en: 'Rabbit' } },
      { emoji: '🐸', name: { uz: 'Qurbaqa', ru: 'Лягушка', en: 'Frog' } },
      { emoji: '🐧', name: { uz: 'Pingvin', ru: 'Пингвин', en: 'Penguin' } },
      { emoji: '🐵', name: { uz: 'Maymun', ru: 'Обезьяна', en: 'Monkey' } },
      { emoji: '🐯', name: { uz: 'Yo\'lbars', ru: 'Тигр', en: 'Tiger' } }
    ];
    const qs = [];
    for (let i = 0; i < 8; i++) {
      const correct = animals[rand(0, animals.length - 1)];
      const opts = shuffle([correct, ...shuffle(animals.filter(a => a !== correct)).slice(0, 3)]);
      qs.push({
        type: 'animal',
        emoji: correct.emoji,
        options: opts.map(o => o.name[currentLang] || o.name.uz),
        answer: correct.name[currentLang] || correct.name.uz
      });
    }
    return qs;
  },

  // ===== QUIZ (mixed) =====
  generateQuiz(age) {
    const all = [
      ...this.generateMath(age).slice(0, 3),
      ...this.generateLogic(age).slice(0, 2),
      ...this.generateColors().slice(0, 2),
      ...this.generateAnimals().slice(0, 2)
    ];
    return shuffle(all).slice(0, 8);
  },

  // ===== MEMORY =====
  generateMemory(age) {
    const emojis = age <= 6
      ? ['🐶', '🐱', '🦁', '🐼', '🦊', '🐸']
      : ['🐶', '🐱', '🦁', '🐼', '🦊', '🐸', '🐯', '🐵'];
    const pairs = shuffle(emojis).slice(0, age <= 6 ? 4 : 6);
    const cards = shuffle([...pairs, ...pairs]).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false
    }));
    return cards;
  },

  // ===== WORDS (simple missing letter) =====
  generateWords() {
    const words = [
      { full: 'CAT', missing: 1, options: ['A', 'E', 'O', 'U'] },
      { full: 'DOG', missing: 1, options: ['O', 'A', 'E', 'I'] },
      { full: 'SUN', missing: 1, options: ['U', 'A', 'E', 'O'] },
      { full: 'BALL', missing: 1, options: ['A', 'E', 'O', 'I'] },
      { full: 'FISH', missing: 1, options: ['I', 'A', 'E', 'O'] },
      { full: 'BOOK', missing: 1, options: ['O', 'A', 'E', 'U'] },
      { full: 'TREE', missing: 2, options: ['E', 'A', 'O', 'I'] },
      { full: 'STAR', missing: 2, options: ['A', 'E', 'O', 'I'] }
    ];
    return shuffle(words).slice(0, 7).map(w => {
      const display = w.full.split('').map((c, i) => i === w.missing ? '_' : c).join(' ');
      return {
        q: display,
        options: shuffle(w.options),
        answer: w.full[w.missing]
      };
    });
  },

  // ===== FIND PICTURE / PUZZLE simplified as choice =====
  generateFindPic() {
    return this.generateAnimals(); // reuse animal recognition
  },

  generatePuzzle() {
    // Simple sequence puzzle
    return this.generateLogic(8);
  }
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
