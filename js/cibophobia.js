const gameContainer = document.querySelector('.cp-game-container');
const LEVEL_COUNT = 4;
const DIFFICULTIES = {
  easy: { label: 'Easy', lives: 5 },
  medium: { label: 'Medium', lives: 3 },
  hard: { label: 'Hard', lives: 1 },
};
const GAME_OVER_DELAY = 3000;
const MESSAGE_SECONDS = 5;
const LEVELS = {
  1: {
    duration: 30,
    maxWorms: 6,
    maxFish: 2,
    fishLastSeconds: 10,
    story: [
      "Has an owner's incompetence ever killed a pet?",
      "Has Cibophobia ever killed?",
      "Best not find out...",
    ],
    messages: [
      { at: 1, text: 'The worms approach!' },
      { at: 15, text: 'The fish descend too!' },
    ],
  },
  2: {
    duration: 40,
    maxWorms: 8,
    maxFish: 3,
    fishLastSeconds: 25,
    speedMult: 1.15,
    shooting: true,
    boss: true,
    playerSrc: 'media/crab-cannon.png',
    story: [
      'A voice whispers from the Beyond,',
      '"You shall have your revenge..."',
    ],
    messages: [
      { at: 1, text: 'Press space to fire!' },
      { at: 15, text: 'It turns out coconuts are pretty effective bullets.' },
      { at: 35, text: 'A large creature breaks through the surface.' },
    ],
  },
  3: {
    duration: 45,
    maxWorms: 5,
    maxFish: 2,
    maxPrawns: 3,
    prawnFromSeconds: 5,
    fishLastSeconds: 20,
    shooting: true,
    playerSrc: 'media/crab-cannon.png',
    story: [
      'Your vengeance begins!',
      'And a new foe approaches to claim your life!',
    ],
    messages: [
      { at: 1, text: 'Prawns have homing! Beware!' },
      { at: 8, text: 'Best to avoid getting hit!' },
    ],
  },
  4: {
    duration: 120,
    maxWorms: 6,
    maxFish: 2,
    maxPrawns: 3,
    maxCatfish: 2,
    catfishFromSeconds: 10,
    prawnFromSeconds: 20,
    fishLastSeconds: 60,
    shooting: true,
    boss: 'prawn',
    playerSrc: 'media/crab-cannon.png',
    story: [
      'The prawns grow braver.',
      'It looks like they have called in a friend...',
    ],
    messages: [
      { at: 1, text: 'Catfish charge down a single lane.' },
      { at: 70, text: 'Endure, they cannot come forever.' },
      { at: 112, text: 'Is that an earthquake? No... it is something more...' },
    ],
  },
  endless: {
    endless: true,
    shooting: true,
    bossEvery: 90,
    playerSrc: 'media/crab-cannon.png',
    story: [
      "Wait this isn't canonical?",
      "Why is this message even here?",
      "Endure the infinite I guess?",
    ],
    messages: [
      { at: 1, text: 'Goal: Survive.' },
    ],
  },
};
let currentLevel = LEVELS[1];
let currentLevelId = 1;
let selectedDifficulty = 'medium';

const PROGRESS_KEY = 'cibophobiaProgress';
let beatenInMemory = 0;

function getHighestBeaten() {
  let stored = 0;
  try { stored = parseInt(localStorage.getItem(PROGRESS_KEY), 10); } catch {}
  if (!Number.isInteger(stored)) stored = 0;
  return clamp(Math.max(stored, beatenInMemory), 0, LEVEL_COUNT);
}

function isLevelUnlocked(level) {
  if (level === 'endless') return true;
  return level <= getHighestBeaten() + 1;
}

function recordLevelBeaten(level) {
  if (typeof level !== 'number' || level <= getHighestBeaten()) return null;
  beatenInMemory = level;
  try { localStorage.setItem(PROGRESS_KEY, String(level)); } catch {}
  return level < LEVEL_COUNT ? level + 1 : null;
}

let introVideo = null;
let introDone = false;

function startIntro() {
  if (introVideo || introDone) return;

  gameContainer.replaceChildren();

  introVideo = document.createElement('video');
  introVideo.src = 'media/intro-animation.mp4';
  introVideo.autoplay = true;
  introVideo.playsInline = true;
  introVideo.style.width = '100%';
  introVideo.style.height = '100%';
  introVideo.style.objectFit = 'contain';

  introVideo.addEventListener('ended', endIntro);
  introVideo.addEventListener('error', endIntro);

  gameContainer.appendChild(introVideo);
  introVideo.play().catch(endIntro);
}

function endIntro() {
  if (!introVideo) return;
  introVideo.pause();
  introVideo.remove();
  introVideo = null;
  introDone = true;
  showLevelSelect();
}

function showLevelSelect() {
  gameContainer.replaceChildren();
  gameContainer.style.backgroundColor = 'var(--sand-main)';

  const screen = document.createElement('div');
  screen.className = 'cp-level-select';
  screen.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  `;

  const difficultyRow = document.createElement('div');
  difficultyRow.className = 'cp-difficulty';
  difficultyRow.style.cssText = 'display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;';

  const difficultyButtons = {};
  const refreshDifficulty = () => {
    for (const [key, button] of Object.entries(difficultyButtons)) {
      const selected = key === selectedDifficulty;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('cp-bubble-selected', selected);
    }
  };

  for (const [key, difficulty] of Object.entries(DIFFICULTIES)) {
    const button = document.createElement('button');
    button.className = 'cp-difficulty-button cp-bubble';
    button.textContent = `${difficulty.label}\n${difficulty.lives} ${difficulty.lives === 1 ? 'life' : 'lives'}`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      selectedDifficulty = key;
      refreshDifficulty();
    });
    difficultyButtons[key] = button;
    difficultyRow.appendChild(button);
  }
  refreshDifficulty();

  const buttons = document.createElement('div');
  buttons.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: min(280px, 80%);
  `;

  const levelChoices = ['endless'];
  for (let n = 1; n <= LEVEL_COUNT; n++) levelChoices.push(n);

  for (const level of levelChoices) {
    const unlocked = isLevelUnlocked(level);
    const name = level === 'endless' ? 'Endless' : `Level ${level}`;
    const button = document.createElement('button');
    button.textContent = unlocked ? name : `${name} (Locked)`;
    button.className = 'cp-level-button cp-bubble cp-bubble-large';
    if (!unlocked) {
      button.disabled = true;
      button.title = `Beat Level ${level - 1} to unlock`;
    }
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      startLevel(level);
    });
    buttons.appendChild(button);
  }

  screen.append(difficultyRow, buttons);
  gameContainer.appendChild(screen);
}

const GRID_COLS = 10;
const GRID_ROWS = 5;
const TILE_PATH = 'tiles/';
const TILE_EXT = '.png';
const TILE_NAMES = ['sand-1', 'sand-2', 'sand-3', 'sand-4'];
const EMPTY_TILE = 'sand-empty';

function tileSrc(name) {
  return `${TILE_PATH}${name}${TILE_EXT}`;
}

function buildGrid(playerSrc = PLAYER_SRC) {
  const grid = document.createElement('div');
  grid.className = 'cp-grid';
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${GRID_COLS}, 1fr);
    grid-template-rows: repeat(${GRID_ROWS}, 1fr);
    width: min(95vw, ${(78 * GRID_COLS) / GRID_ROWS}vh);
    aspect-ratio: ${GRID_COLS} / ${GRID_ROWS};
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  `;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const name = TILE_NAMES[Math.floor(Math.random() * TILE_NAMES.length)];
      const tile = document.createElement('img');
      tile.className = 'cp-tile';
      tile.src = tileSrc(name);
      tile.alt = name;
      tile.dataset.row = row;
      tile.dataset.col = col;
      tile.dataset.tile = name;
      tile.draggable = false;
      tile.style.cssText = 'display: block; width: 100%; height: 100%;';
      grid.appendChild(tile);
    }
  }
  createPlayer(grid, playerSrc);
  return grid;
}

const PLAYER_SRC = 'media/crab.png';
let playerEl = null;
let playerRow = 0;
let playerCol = 0;
let levelActive = false;

function placePlayer() {
  playerEl.style.left = `${(playerCol * 100) / GRID_COLS}%`;
  playerEl.style.top = `${(playerRow * 100) / GRID_ROWS}%`;
}

function createPlayer(grid, src = PLAYER_SRC) {
  playerRow = GRID_ROWS - 1;
  playerCol = Math.floor(GRID_COLS / 2);

  playerEl = document.createElement('img');
  playerEl.className = 'cp-player';
  playerEl.src = src;
  playerEl.alt = 'Player';
  playerEl.draggable = false;
  playerEl.style.cssText = `
    position: absolute;
    width: ${100 / GRID_COLS}%;
    height: ${100 / GRID_ROWS}%;
    object-fit: contain;
    pointer-events: none;
    z-index: 2;
    transition: left 0.12s ease-out, top 0.12s ease-out;
  `;

  placePlayer();
  grid.appendChild(playerEl);
}

function movePlayer(rowChange, colChange) {
  const newRow = playerRow + rowChange;
  const newCol = playerCol + colChange;
  if (newRow < 0 || newRow >= GRID_ROWS || newCol < 0 || newCol >= GRID_COLS) return;
  playerRow = newRow;
  playerCol = newCol;
  placePlayer();
}

const MOVE_KEYS = {
  w: [-1, 0],
  arrowup: [-1, 0],
  s: [1, 0],
  arrowdown: [1, 0],
  a: [0, -1],
  arrowleft: [0, -1],
  d: [0, 1],
  arrowright: [0, 1],
};

function startLevel(level) {
  if (!isLevelUnlocked(level)) return;

  const story = LEVELS[level].story;
  if (!story) {
    beginLevel(level);
    return;
  }

  gameContainer.replaceChildren();
  gameContainer.style.backgroundColor = 'var(--sand-main)';

  const screen = document.createElement('div');
  screen.className = 'cp-story';
  screen.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    text-align: center;
  `;

  const title = document.createElement('h1');
  title.textContent = 'The Story Thus Far...';
  title.style.margin = '0';
  screen.appendChild(title);

  for (const paragraph of story) {
    const text = document.createElement('p');
    text.textContent = paragraph;
    text.style.cssText = 'margin: 0; max-width: 36rem; line-height: 1.6; font-size: 1.1rem;';
    screen.appendChild(text);
  }

  const hint = document.createElement('p');
  hint.textContent = 'Click or press any key to continue';
  hint.style.cssText = 'margin: 1rem 0 0; opacity: 0.6; font-size: 0.9rem;';
  screen.appendChild(hint);

  gameContainer.appendChild(screen);

  const shownAt = performance.now();
  const proceed = () => {
    if (performance.now() - shownAt < 500) return;
    gameContainer.removeEventListener('click', proceed);
    document.removeEventListener('keydown', proceed);
    beginLevel(level);
  };
  gameContainer.addEventListener('click', proceed);
  document.addEventListener('keydown', proceed);
}

function beginLevel(level) {
  currentLevelId = level;
  levelActive = true;
  gameContainer.replaceChildren();
  gameContainer.style.backgroundColor = 'var(--sand-main)';
  gameContainer.style.display = 'flex';
  gameContainer.style.flexDirection = 'column';
  gameContainer.style.alignItems = 'center';
  gameContainer.style.justifyContent = 'center';

  const startingLives = DIFFICULTIES[selectedDifficulty].lives;

  const hud = document.createElement('div');
  hud.className = 'cp-hud';
  hud.style.cssText = 'display: flex; gap: 2rem; font-size: 1.75rem; font-weight: bold; margin-bottom: 1rem;';

  const timer = document.createElement('div');
  timer.className = 'cp-timer';
  timer.textContent = formatTime(LEVELS[level].endless ? 0 : LEVELS[level].duration);

  const livesEl = document.createElement('div');
  livesEl.className = 'cp-lives';
  livesEl.textContent = `Lives: ${startingLives}`;

  const scoreEl = document.createElement('div');
  scoreEl.className = 'cp-score';
  scoreEl.textContent = 'Score: 0';
  scoreDisplay = scoreEl;

  hud.append(scoreEl, timer, livesEl);

  bossBar = null;
  if (LEVELS[level].boss || LEVELS[level].bossEvery) {
    const bar = document.createElement('div');
    bar.className = 'cp-boss-bar';
    bar.style.cssText = `
      display: none;
      align-self: center;
      width: 12rem;
      height: 1.2rem;
      box-sizing: border-box;
      border: 3px solid #7a5628;
      border-radius: 6px;
      background: #f3e3bd;
      overflow: hidden;
    `;
    const fill = document.createElement('div');
    fill.style.cssText = 'width: 100%; height: 100%; background: #b8341f; transition: width 0.1s;';
    bar.appendChild(fill);
    hud.appendChild(bar);
    bossBar = { bar, fill };
  }

  const grid = buildGrid(LEVELS[level].playerSrc || PLAYER_SRC);
  gameContainer.append(hud, grid);
  startGame(grid, timer, livesEl, startingLives, LEVELS[level]);
}

const FALLERS = {
  fish: { src: 'media/fish.png', speed: 0.7, sideways: true, hp: 2, points: 25, dodgePoints: 0 },
  worm: { src: 'media/worm.gif', speed: 0.7, sideways: false, hp: 1, points: 10, dodgePoints: 0 },
  prawn: { src: 'media/prawn.gif', speed: 2.5, sideways: false, homing: true, hp: 1, points: 40, dodgePoints: 0 },
  catfish: { src: 'media/catfish.png', speed: 1.5, sideways: false, charger: true, hp: 3, points: 50, dodgePoints: 0 },
};

const CATFISH_TELEGRAPH = 1.6;
const CATFISH_LOCK_TIME = 0.7;
const CATFISH_SLIDE_SPEED = 8;
const CATFISH_CHARGE_SPEED = 10;

const PRAWN_BOSS_SRC = 'media/prawn.gif';
const PRAWN_BOSS_W = 2;
const PRAWN_BOSS_H = 2;
const PRAWN_BOSS_HP = 30;
const PRAWN_BOSS_SPEED = 6;
const PRAWN_BOSS_SUMMON_TIME = 5;
const PRAWN_BOSS_SUMMON_GAP = 0.5;

const BOSS_HIT_POINTS = 5;
const BOSS_KILL_POINTS = 500;
const SPAWN_MIN = 0.4;
const SPAWN_MAX = 2;
const SHIFT_MIN = 1.5;
const SHIFT_MAX = 3.5;
const SHIFT_WARNING = 0.5;

let gameFrame = null;
let gameLast = 0;
let gameElapsed = 0;
let fallers = [];
let spawnTimer = 0;
let nextMessage = 0;

function showMessage(text) {
  const existing = gameContainer.querySelector('.cp-message');
  if (existing) existing.remove();

  const message = document.createElement('div');
  message.className = 'cp-message';
  message.textContent = text;
  message.style.animationDuration = `${MESSAGE_SECONDS}s`;
  message.addEventListener('animationend', () => message.remove());
  gameContainer.appendChild(message);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function lockOnPlayer(faller, grid) {
  faller.targetCol = playerCol;
  faller.targetRow = playerRow;

  const dx = faller.targetCol - faller.col;
  const dy = faller.targetRow - faller.row;
  const dist = Math.hypot(dx, dy) || 1;
  faller.vx = (dx / dist) * faller.speed;
  faller.vy = (dy / dist) * faller.speed;

  const outline = 'fill="none" stroke-linecap="round"';
  const parts =
    '<circle cx="50" cy="50" r="30"/>' +
    '<path d="M50 8V32M50 68V92M8 50H32M68 50H92"/>';
  const marker = document.createElement('div');
  marker.className = 'cp-target-marker';
  marker.innerHTML =
    '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
    `<g ${outline} stroke="white" stroke-width="11">${parts}</g>` +
    `<g ${outline} stroke="red" stroke-width="6">${parts}</g>` +
    '</svg>';
  marker.style.cssText = `
    position: absolute;
    left: ${(faller.targetCol * 100) / GRID_COLS}%;
    top: ${(faller.targetRow * 100) / GRID_ROWS}%;
    width: ${100 / GRID_COLS}%;
    height: ${100 / GRID_ROWS}%;
    pointer-events: none;
    z-index: 3;
    animation: cp-target-pulse 0.35s ease-in-out infinite alternate;
  `;
  grid.appendChild(marker);
  faller.targetEl = marker;
}

function clearTargetMarker(faller) {
  if (faller.targetEl) {
    faller.targetEl.remove();
    faller.targetEl = null;
  }
}

function showLaneWarning(faller) {
  const warn = document.createElement('div');
  warn.className = 'cp-catfish-warning';
  warn.style.cssText = `
    position: absolute;
    top: 0;
    height: 100%;
    left: ${(faller.lockCol * 100) / GRID_COLS}%;
    width: ${100 / GRID_COLS}%;
    box-sizing: border-box;
    background: rgba(200, 40, 20, 0.22);
    border-left: 3px solid rgba(200, 40, 20, 0.7);
    border-right: 3px solid rgba(200, 40, 20, 0.7);
    pointer-events: none;
    z-index: 0;
    animation: cp-warn-flash 0.2s steps(2) infinite alternate;
  `;
  faller.el.parentNode.appendChild(warn);
  faller.warnEl = warn;
}

function clearLaneWarning(faller) {
  if (faller.warnEl) {
    faller.warnEl.remove();
    faller.warnEl = null;
  }
}

function updateCharger(faller, dt) {
  if (faller.phase === 'enter') {
    faller.row += faller.speed * dt;
    if (faller.row >= 0) {
      faller.row = 0;
      faller.phase = 'telegraph';
      faller.phaseTimer = CATFISH_TELEGRAPH;
    }
  } else if (faller.phase === 'telegraph') {
    faller.phaseTimer -= dt;
    const step = CATFISH_SLIDE_SPEED * dt;

    if (faller.lockCol === null) {
      faller.col += clamp(playerCol - faller.col, -step, step);
      if (faller.phaseTimer <= CATFISH_LOCK_TIME) {
        faller.lockCol = playerCol;
        showLaneWarning(faller);
      }
    } else {
      faller.col += clamp(faller.lockCol - faller.col, -step, step);
      faller.el.style.translate = `${(Math.random() - 0.5) * 6}px 0`;
    }

    if (faller.lockCol !== null && faller.phaseTimer <= 0 && Math.abs(faller.col - faller.lockCol) < 0.05) {
      faller.col = faller.lockCol;
      faller.el.style.translate = '';
      clearLaneWarning(faller);
      faller.phase = 'charge';
    }
  } else if (faller.phase === 'charge') {
    faller.row += CATFISH_CHARGE_SPEED * dt;
  }
}

function showShiftArrow(faller) {
  const arrow = document.createElement('div');
  arrow.className = 'cp-shift-arrow';
  arrow.innerHTML =
    '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
    '<polygon points="15,50 55,12 55,36 88,36 88,64 55,64 55,88" fill="red" stroke="white" stroke-width="3"/>' +
    '</svg>';
  arrow.style.cssText = `
    position: absolute;
    width: ${100 / GRID_COLS}%;
    height: ${100 / GRID_ROWS}%;
    pointer-events: none;
    z-index: 3;
    ${faller.pendingDir > 0 ? 'transform: scaleX(-1);' : ''}
  `;
  faller.el.parentNode.appendChild(arrow);
  faller.arrowEl = arrow;
}

function clearShiftArrow(faller) {
  if (faller.arrowEl) {
    faller.arrowEl.remove();
    faller.arrowEl = null;
  }
}

function placeFaller(faller) {
  faller.el.style.left = `${(faller.col * 100) / GRID_COLS}%`;
  faller.el.style.top = `${(faller.row * 100) / GRID_ROWS}%`;

  if (faller.arrowEl) {
    faller.arrowEl.style.left = `${((faller.col + faller.pendingDir) * 100) / GRID_COLS}%`;
    faller.arrowEl.style.top = `${(faller.row * 100) / GRID_ROWS}%`;
  }
}

function removeFaller(faller) {
  clearShiftArrow(faller);
  clearTargetMarker(faller);
  clearLaneWarning(faller);
  faller.el.remove();
  fallers = fallers.filter((f) => f !== faller);
}

function getParams(t) {
  if (currentLevel.endless) {
    return {
      maxWorms: Math.min(12, 2 + Math.floor(t / 10)),
      maxFish: t < 20 ? 0 : Math.min(6, 1 + Math.floor((t - 20) / 20)),
      maxPrawns: t < 30 ? 0 : Math.min(5, 1 + Math.floor((t - 30) / 30)),
      maxCatfish: t < 45 ? 0 : Math.min(4, 1 + Math.floor((t - 45) / 45)),
      spawnMin: Math.max(0.25, 1.2 - t * 0.012),
      spawnMax: Math.max(0.6, 3 - t * 0.03),
      speedMult: Math.min(2.5, 1 + t / 60),
    };
  }
  return {
    maxWorms: currentLevel.maxWorms,
    maxFish: t >= currentLevel.duration - currentLevel.fishLastSeconds ? currentLevel.maxFish : 0,
    maxPrawns: t >= (currentLevel.prawnFromSeconds || 0) ? (currentLevel.maxPrawns || 0) : 0,
    maxCatfish: t >= (currentLevel.catfishFromSeconds || 0) ? (currentLevel.maxCatfish || 0) : 0,
    spawnMin: SPAWN_MIN,
    spawnMax: SPAWN_MAX,
    speedMult: currentLevel.speedMult || 1,
  };
}

function spawnFaller(grid) {
  const params = getParams(gameElapsed);
  const count = (type) => fallers.filter((f) => f.type === type).length;

  const available = [];
  if (count('worm') < params.maxWorms) available.push('worm');
  if (count('fish') < params.maxFish) available.push('fish');
  if (count('prawn') < params.maxPrawns) available.push('prawn');
  if (count('catfish') < params.maxCatfish) available.push('catfish');
  if (available.length === 0) return;
  const type = available[Math.floor(Math.random() * available.length)];

  const columns = Array.from({ length: GRID_COLS }, (_, i) => i);
  const freeColumns = columns.filter(
    (c) => !fallers.some((f) => Math.abs(f.col - c) < 1 && f.row < 1.5)
  );
  if (freeColumns.length === 0) return;
  const col = freeColumns[Math.floor(Math.random() * freeColumns.length)];
  createFaller(grid, type, col, -1, params.speedMult);
}

function createFaller(grid, type, col, row, speedMult) {
  const config = FALLERS[type];

  const el = document.createElement('img');
  el.className = `cp-faller cp-${type}`;
  el.src = config.src;
  el.alt = type;
  el.draggable = false;
  el.style.cssText = `
    position: absolute;
    width: ${100 / GRID_COLS}%;
    height: ${100 / GRID_ROWS}%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
    ${config.sideways ? 'transition: left 0.15s ease-out;' : ''}
  `;

  const faller = {
    el,
    type,
    col,
    row,
    hp: config.hp,
    points: config.points,
    dodgePoints: config.dodgePoints,
    speed: config.speed * speedMult,
    sideways: config.sideways,
    nextShift: randomBetween(SHIFT_MIN, SHIFT_MAX),
    pendingDir: 0,
    arrowEl: null,
    homing: !!config.homing,
    vx: 0,
    vy: 0,
    targetCol: 0,
    targetRow: 0,
    targetEl: null,
    charger: !!config.charger,
    phase: 'enter',
    phaseTimer: 0,
    lockCol: null,
    warnEl: null,
  };

  placeFaller(faller);
  grid.appendChild(el);
  fallers.push(faller);

  if (faller.homing) lockOnPlayer(faller, grid);

  return faller;
}

function updateSpawners(grid, dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnFaller(grid);
    const params = getParams(gameElapsed);
    spawnTimer = randomBetween(params.spawnMin, params.spawnMax);
  }
}

function updateFallers(dt) {
  for (const faller of [...fallers]) {
    if (faller.homing) {
      faller.col += faller.vx * dt;
      faller.row += faller.vy * dt;

      const toCol = faller.targetCol - faller.col;
      const toRow = faller.targetRow - faller.row;
      if (faller.targetEl && toCol * faller.vx + toRow * faller.vy <= 0) {
        clearTargetMarker(faller);
      }
    } else if (faller.charger) {
      updateCharger(faller, dt);
    } else {
      faller.row += faller.speed * dt;
    }

    if (faller.sideways) {
      faller.nextShift -= dt;

      if (faller.pendingDir === 0 && faller.nextShift <= SHIFT_WARNING) {
        const options = [];
        if (faller.col > 0) options.push(-1);
        if (faller.col < GRID_COLS - 1) options.push(1);
        faller.pendingDir = options[Math.floor(Math.random() * options.length)];
        showShiftArrow(faller);
      }

      if (faller.nextShift <= 0) {
        faller.col += faller.pendingDir;
        faller.pendingDir = 0;
        clearShiftArrow(faller);
        faller.nextShift = randomBetween(SHIFT_MIN, SHIFT_MAX);
      }
    }

    const offscreen = faller.homing
      ? faller.row > GRID_ROWS || faller.row < -1 || faller.col > GRID_COLS || faller.col < -1
      : faller.row >= GRID_ROWS || faller.col < -1 || faller.col > GRID_COLS;
    if (offscreen) {
      addScore(faller.dodgePoints);
      removeFaller(faller);
      continue;
    }

    if (Math.abs(faller.col - playerCol) < 0.75 && Math.abs(faller.row - playerRow) < 0.75) {
      removeFaller(faller);
      takeDamage();
      continue;
    }

    placeFaller(faller);
  }
}

const PROJECTILE_SPEED = 11;
const FIRE_COOLDOWN = 300;

let projectiles = [];
let lastShot = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function flashHit(el) {
  el.style.filter = 'brightness(2)';
  setTimeout(() => {
    el.style.filter = '';
  }, 80);
}

function placeProjectile(projectile) {
  projectile.el.style.left = `${((projectile.col + 0.4) * 100) / GRID_COLS}%`;
  projectile.el.style.top = `${(projectile.row * 100) / GRID_ROWS}%`;
}

function removeProjectile(projectile) {
  projectile.el.remove();
  projectiles = projectiles.filter((p) => p !== projectile);
}

function fireProjectile() {
  if (!gameRunning || !playerEl || !currentLevel.shooting) return;

  const now = performance.now();
  if (now - lastShot < FIRE_COOLDOWN) return;
  lastShot = now;

  const el = document.createElement('div');
  el.className = 'cp-projectile';
  el.style.cssText = `
    position: absolute;
    width: ${20 / GRID_COLS}%;
    height: ${40 / GRID_ROWS}%;
    box-sizing: border-box;
    background: #3b2a14;
    border: 2px solid #fff6e0;
    border-radius: 40%;
    pointer-events: none;
    z-index: 2;
  `;

  const startRow = playerRow - 0.4;
  const projectile = { el, col: playerCol, row: startRow, prevRow: startRow };
  placeProjectile(projectile);
  playerEl.parentNode.appendChild(el);
  projectiles.push(projectile);
}

function damageFaller(faller) {
  faller.hp -= 1;
  flashHit(faller.el);
  if (faller.hp <= 0) {
    addScore(faller.points);
    removeFaller(faller);
  }
}

function updateProjectiles(dt) {
  for (const projectile of [...projectiles]) {
    projectile.prevRow = projectile.row;
    projectile.row -= PROJECTILE_SPEED * dt;

    if (projectile.row < -0.5) {
      removeProjectile(projectile);
      continue;
    }

    const target = fallers.find(
      (f) =>
        Math.abs(f.col - projectile.col) < 0.6 &&
        f.row < projectile.prevRow + 0.4 &&
        f.row + 1 > projectile.row
    );
    if (target) {
      removeProjectile(projectile);
      damageFaller(target);
      continue;
    }

    if (
      boss &&
      boss.phase !== 'enter' &&
      boss.phase !== 'dead' &&
      projectile.col + 0.6 > boss.x &&
      projectile.col + 0.4 < boss.x + boss.w &&
      boss.row < projectile.prevRow + 0.4 &&
      boss.row + boss.h > projectile.row
    ) {
      removeProjectile(projectile);
      damageBoss();
      if (!gameRunning) return;
      continue;
    }

    placeProjectile(projectile);
  }
}

const BOSS_SRC = 'media/fish.png';
const BOSS_W = 3;
const BOSS_H = 3;
const BOSS_HP = 40;
const BOSS_ENTER_SPEED = 1.5;
const BOSS_SWAY_SPEED = 0.8;
const BOSS_SLIDE_SPEED = 8;
const BOSS_TELEGRAPH = 1.8;
const BOSS_LOCK_TIME = 0.8;
const BOSS_CHARGE_SPEED = 9;
const BOSS_RETURN_SPEED = 2.5;
const BOSS_CONTACT_COOLDOWN = 1.2;

let boss = null;
let bossBar = null;
let bossesDefeated = 0;
let nextBossAt = Infinity;

function scaledHp(base) {
  return Math.round(base * (currentLevel.bossEvery ? 1 + 0.25 * bossesDefeated : 1));
}

function placeBoss() {
  boss.el.style.left = `${(boss.x * 100) / GRID_COLS}%`;
  boss.el.style.top = `${(boss.row * 100) / GRID_ROWS}%`;
}

function startBoss(grid, kind = currentLevel.boss) {
  if (kind === 'prawn') {
    startPrawnBoss(grid);
    return;
  }

  const el = document.createElement('img');
  el.className = 'cp-boss';
  el.src = BOSS_SRC;
  el.alt = 'Boss';
  el.draggable = false;
  el.style.cssText = `
    position: absolute;
    width: ${(BOSS_W * 100) / GRID_COLS}%;
    height: ${(BOSS_H * 100) / GRID_ROWS}%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
  `;

  boss = {
    el,
    w: BOSS_W,
    h: BOSS_H,
    x: (GRID_COLS - BOSS_W) / 2,
    row: -BOSS_H,
    hp: scaledHp(BOSS_HP),
    maxHp: scaledHp(BOSS_HP),
    phase: 'enter',
    phaseTimer: 0,
    chargeTimer: 0,
    waveTimer: 0,
    swayT: 0,
    lockX: null,
    warnEl: null,
    contactCooldown: 0,
  };

  placeBoss();
  grid.appendChild(el);

  if (bossBar) {
    bossBar.bar.style.display = 'block';
    bossBar.fill.style.width = '100%';
  }
  showMessage('Something huge approaches!');
}

function showBossWarning(grid) {
  const warn = document.createElement('div');
  warn.className = 'cp-boss-warning';
  warn.style.cssText = `
    position: absolute;
    top: 0;
    height: 100%;
    left: ${(boss.lockX * 100) / GRID_COLS}%;
    width: ${(BOSS_W * 100) / GRID_COLS}%;
    box-sizing: border-box;
    background: rgba(200, 40, 20, 0.22);
    border-left: 3px solid rgba(200, 40, 20, 0.7);
    border-right: 3px solid rgba(200, 40, 20, 0.7);
    pointer-events: none;
    z-index: 0;
    animation: cp-warn-flash 0.2s steps(2) infinite alternate;
  `;
  grid.appendChild(warn);
  boss.warnEl = warn;
}

function clearBossWarning() {
  if (boss && boss.warnEl) {
    boss.warnEl.remove();
    boss.warnEl = null;
  }
}

function slideBoss(targetX, dt) {
  const step = BOSS_SLIDE_SPEED * dt;
  boss.x += clamp(targetX - boss.x, -step, step);
}

function spawnFishWave(grid) {
  const fishCount = fallers.filter((f) => f.type === 'fish').length;
  if (fishCount >= 6) return;

  const rage = boss.hp / boss.maxHp;
  const count = 3 + (rage < 0.5 ? 1 : 0) + (rage < 0.25 ? 1 : 0);
  const columns = Array.from({ length: GRID_COLS }, (_, i) => i).sort(() => Math.random() - 0.5);

  for (const col of columns.slice(0, count)) {
    createFaller(grid, 'fish', col, -1, 1.3);
  }
}

function bossTouchesPlayer() {
  return (
    playerCol + 1 > boss.x + 0.2 &&
    playerCol < boss.x + boss.w - 0.2 &&
    playerRow + 1 > boss.row + 0.2 &&
    playerRow < boss.row + boss.h - 0.2
  );
}

function damageBoss() {
  boss.hp -= 1;
  addScore(BOSS_HIT_POINTS);
  flashHit(boss.el);
  if (bossBar) bossBar.fill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;

  if (boss.hp <= 0) {
    boss.phase = 'dead';
    clearBossWarning();
    addScore(BOSS_KILL_POINTS);
    if (currentLevel.bossEvery) defeatBoss();
    else finishLevel();
  }
}

function defeatBoss() {
  boss.el.remove();
  boss = null;
  bossesDefeated += 1;
  nextBossAt = gameElapsed + currentLevel.bossEvery;
  if (bossBar) bossBar.bar.style.display = 'none';
  showMessage('The boss is down. Survive!');
}

function updateBoss(dt, grid) {
  if (boss.kind === 'prawn') {
    updatePrawnBoss(dt, grid);
    return;
  }

  boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);
  const maxX = GRID_COLS - BOSS_W;
  const rage = boss.hp / boss.maxHp;

  if (boss.phase === 'enter') {
    boss.row += BOSS_ENTER_SPEED * dt;
    if (boss.row >= 0) {
      boss.row = 0;
      boss.phase = 'idle';
      boss.chargeTimer = randomBetween(3, 4);
      boss.waveTimer = 1.5;
    }
  } else if (boss.phase === 'idle') {
    boss.swayT += dt * BOSS_SWAY_SPEED;
    slideBoss((maxX / 2) * (1 + Math.sin(boss.swayT)), dt);

    boss.waveTimer -= dt;
    boss.chargeTimer -= dt;

    if (boss.waveTimer <= 0) {
      spawnFishWave(grid);
      boss.waveTimer = randomBetween(4, 6) * (0.6 + 0.4 * rage);
    }
    if (boss.chargeTimer <= 0) {
      boss.phase = 'telegraph';
      boss.phaseTimer = BOSS_TELEGRAPH;
      boss.lockX = null;
    }
  } else if (boss.phase === 'telegraph') {
    boss.phaseTimer -= dt;

    if (boss.lockX === null) {
      slideBoss(clamp(playerCol - 1, 0, maxX), dt);
      if (boss.phaseTimer <= BOSS_LOCK_TIME) {
        boss.lockX = clamp(playerCol - 1, 0, maxX);
        showBossWarning(grid);
      }
    } else {
      slideBoss(boss.lockX, dt);
      boss.el.style.translate = `${(Math.random() - 0.5) * 6}px 0`;
    }

    if (boss.lockX !== null && boss.phaseTimer <= 0 && Math.abs(boss.x - boss.lockX) < 0.05) {
      boss.x = boss.lockX;
      boss.el.style.translate = '';
      clearBossWarning();
      boss.phase = 'charge';
    }
  } else if (boss.phase === 'charge') {
    boss.row += BOSS_CHARGE_SPEED * dt;
    if (boss.row >= GRID_ROWS - BOSS_H + 0.5) boss.phase = 'return';
  } else if (boss.phase === 'return') {
    boss.row -= BOSS_RETURN_SPEED * dt;
    if (boss.row <= 0) {
      boss.row = 0;
      boss.phase = 'idle';
      boss.chargeTimer = randomBetween(4, 6) * (0.55 + 0.45 * rage);
      boss.waveTimer = randomBetween(1, 2);
    }
  }

  const dangerous = boss.phase === 'idle' || boss.phase === 'telegraph' || boss.phase === 'charge';
  if (dangerous && boss.contactCooldown <= 0 && bossTouchesPlayer()) {
    boss.contactCooldown = BOSS_CONTACT_COOLDOWN;
    takeDamage();
    if (!gameRunning) return;
  }

  placeBoss();
}

function startPrawnBoss(grid) {
  const el = document.createElement('img');
  el.className = 'cp-boss cp-prawn-boss';
  el.src = PRAWN_BOSS_SRC;
  el.alt = 'Prawn Boss';
  el.draggable = false;
  el.style.cssText = `
    position: absolute;
    width: ${(PRAWN_BOSS_W * 100) / GRID_COLS}%;
    height: ${(PRAWN_BOSS_H * 100) / GRID_ROWS}%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
  `;

  const angle = randomBetween(0.5, 1.0);
  boss = {
    kind: 'prawn',
    el,
    w: PRAWN_BOSS_W,
    h: PRAWN_BOSS_H,
    x: (GRID_COLS - PRAWN_BOSS_W) / 2,
    row: -PRAWN_BOSS_H,
    hp: scaledHp(PRAWN_BOSS_HP),
    maxHp: scaledHp(PRAWN_BOSS_HP),
    phase: 'enter',
    dirX: Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1),
    dirY: Math.sin(angle),
    summonTimer: 4,
    summonLeft: 0,
    spawnTimer: 0,
    contactCooldown: 0,
    warnEl: null,
  };

  placeBoss();
  grid.appendChild(el);

  if (bossBar) {
    bossBar.bar.style.display = 'block';
    bossBar.fill.style.width = '100%';
  }
  showMessage('A colossal prawn bursts in!');
}

function spawnTopPrawn(grid) {
  const col = Math.floor(Math.random() * GRID_COLS);
  createFaller(grid, 'prawn', col, -1, 1);
}

function setPrawnBossDirection() {
  const angle = randomBetween(0.5, 1.0);
  boss.dirX = Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1);
  boss.dirY = Math.sin(angle);
}

function updatePrawnBoss(dt, grid) {
  boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);
  const rage = boss.hp / boss.maxHp;
  const speed = PRAWN_BOSS_SPEED * (1 + 0.5 * (1 - rage));

  if (boss.phase === 'enter') {
    boss.row += BOSS_ENTER_SPEED * dt;
    if (boss.row >= 0) {
      boss.row = 0;
      boss.phase = 'bounce';
    }
  } else if (boss.phase === 'bounce') {
    boss.x += boss.dirX * speed * dt;
    boss.row += boss.dirY * speed * dt;

    const maxX = GRID_COLS - boss.w;
    const maxY = GRID_ROWS - boss.h;
    if (boss.x <= 0) {
      boss.x = 0;
      boss.dirX = Math.abs(boss.dirX);
    } else if (boss.x >= maxX) {
      boss.x = maxX;
      boss.dirX = -Math.abs(boss.dirX);
    }
    if (boss.row <= 0) {
      boss.row = 0;
      boss.dirY = Math.abs(boss.dirY);
    } else if (boss.row >= maxY) {
      boss.row = maxY;
      boss.dirY = -Math.abs(boss.dirY);
    }

    boss.summonTimer -= dt;
    if (boss.summonTimer <= 0) boss.phase = 'toCenter';
  } else if (boss.phase === 'toCenter') {
    const targetX = (GRID_COLS - boss.w) / 2;
    const dx = targetX - boss.x;
    const dy = -boss.row;
    const dist = Math.hypot(dx, dy);
    const step = speed * 1.5 * dt;

    if (dist <= step) {
      boss.x = targetX;
      boss.row = 0;
      boss.phase = 'summon';
      boss.summonLeft = PRAWN_BOSS_SUMMON_TIME;
      boss.spawnTimer = 0.2;
      showMessage('The prawn calls for backup!');
    } else {
      boss.x += (dx / dist) * step;
      boss.row += (dy / dist) * step;
    }
  } else if (boss.phase === 'summon') {
    boss.summonLeft -= dt;
    boss.spawnTimer -= dt;

    if (boss.spawnTimer <= 0) {
      const prawnCount = fallers.filter((f) => f.type === 'prawn').length;
      if (prawnCount < 8) spawnTopPrawn(grid);
      boss.spawnTimer = PRAWN_BOSS_SUMMON_GAP * (0.6 + 0.4 * rage);
    }

    if (boss.summonLeft <= 0) {
      boss.phase = 'bounce';
      boss.summonTimer = randomBetween(6, 9) * (0.6 + 0.4 * rage);
      setPrawnBossDirection();
    }
  }

  if (boss.phase !== 'enter' && boss.contactCooldown <= 0 && bossTouchesPlayer()) {
    boss.contactCooldown = BOSS_CONTACT_COOLDOWN;
    takeDamage();
    if (!gameRunning) return;
  }

  placeBoss();
}

let lives = 0;
let livesDisplay = null;
let gameRunning = false;
let score = 0;
let scoreDisplay = null;

function addScore(points) {
  if (!gameRunning) return;
  score += points;
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
}

let paused = false;
let settingsEl = null;
let gameLoop = null;

function makeMenuButton(label, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'cp-bubble cp-bubble-large';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function openSettings() {
  if (!gameRunning || paused) return;
  paused = true;
  cancelAnimationFrame(gameFrame);

  if (getComputedStyle(gameContainer).position === 'static') {
    gameContainer.style.position = 'relative';
  }

  settingsEl = document.createElement('div');
  settingsEl.className = 'cp-settings';
  settingsEl.style.cssText = `
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
  `;
  settingsEl.addEventListener('click', (event) => event.stopPropagation());

  const panel = document.createElement('div');
  panel.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: min(300px, 80%);
    box-sizing: border-box;
    padding: 1.5rem;
    background: #f3e3bd;
    border: 3px solid #7a5628;
    border-radius: 6px;
    box-shadow: 0 4px 0 #7a5628;
  `;

  const heading = document.createElement('h2');
  heading.textContent = 'Settings';
  heading.style.margin = '0';

  const hint = document.createElement('p');
  hint.textContent = 'Press Esc to resume';
  hint.style.cssText = 'margin: 0; opacity: 0.6; font-size: 0.85rem;';

  panel.append(
    heading,
    makeMenuButton('Resume', closeSettings),
    makeMenuButton('Leave Level', leaveLevel),
    hint
  );
  settingsEl.appendChild(panel);
  gameContainer.appendChild(settingsEl);
}

function closeSettings() {
  if (!paused) return;
  paused = false;
  if (settingsEl) {
    settingsEl.remove();
    settingsEl = null;
  }
  gameLast = performance.now();
  gameFrame = requestAnimationFrame(gameLoop);
}

function toggleSettings() {
  if (paused) closeSettings();
  else openSettings();
}

function leaveLevel() {
  paused = false;
  gameRunning = false;
  levelActive = false;
  cancelAnimationFrame(gameFrame);
  settingsEl = null;
  boss = null;
  showLevelSelect();
}

function takeDamage() {
  if (!gameRunning) return;
  lives -= 1;
  livesDisplay.textContent = `Lives: ${lives}`;
  if (lives <= 0) endGame();
}

function showEndScreen(headingText, messageText, extraText) {
  gameRunning = false;
  levelActive = false;
  cancelAnimationFrame(gameFrame);

  gameContainer.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'cp-end-screen';
  screen.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  `;

  const heading = document.createElement('h1');
  heading.textContent = headingText;
  heading.style.margin = '0';

  const message = document.createElement('p');
  message.textContent = messageText;
  message.style.margin = '0';

  screen.append(heading, message);

  if (extraText) {
    const extra = document.createElement('p');
    extra.textContent = extraText;
    extra.style.margin = '0';
    screen.appendChild(extra);
  }

  gameContainer.appendChild(screen);

  setTimeout(showLevelSelect, GAME_OVER_DELAY);
}

function endGame() {
  if (!gameRunning) return;
  showEndScreen('Game Over', `You survived ${formatTime(gameElapsed)} | Score: ${score}`);
}

function finishLevel() {
  if (!gameRunning) return;
  const nextLevel = recordLevelBeaten(currentLevelId);
  showEndScreen(
    'Level Complete!',
    `Lives left: ${lives} | Score: ${score}`,
    nextLevel ? `Level ${nextLevel} unlocked!` : ''
  );
}

function startGame(grid, timerEl, livesEl, startingLives, level) {
  cancelAnimationFrame(gameFrame);
  currentLevel = level;
  fallers = [];
  gameElapsed = 0;
  lives = startingLives;
  livesDisplay = livesEl;
  score = 0;
  paused = false;
  settingsEl = null;
  gameRunning = true;
  spawnTimer = randomBetween(0.3, 1.5);
  nextMessage = 0;
  boss = null;
  bossesDefeated = 0;
  nextBossAt = currentLevel.bossEvery || Infinity;
  projectiles = [];
  lastShot = 0;
  gameLast = performance.now();

  const loop = (now) => {
    const dt = Math.min(Math.max((now - gameLast) / 1000, 0), 0.1);
    gameLast = now;
    gameElapsed += dt;

    const messages = currentLevel.messages || [];
    while (nextMessage < messages.length && gameElapsed >= messages[nextMessage].at) {
      showMessage(messages[nextMessage].text);
      nextMessage += 1;
    }

    if (currentLevel.endless) {
      timerEl.textContent = formatTime(gameElapsed);
      if (!boss && gameElapsed >= nextBossAt) {
        startBoss(grid, bossesDefeated % 2 === 0 ? 'fish' : 'prawn');
      }
    } else if (boss) {
      timerEl.textContent = 'BOSS';
    } else {
      const remaining = Math.max(currentLevel.duration - gameElapsed, 0);
      timerEl.textContent = formatTime(Math.ceil(remaining));
      if (remaining <= 0) {
        if (currentLevel.boss) {
          startBoss(grid);
          timerEl.textContent = 'BOSS';
        } else {
          finishLevel();
          return;
        }
      }
    }

    if (!boss) updateSpawners(grid, dt);
    updateFallers(dt);
    if (gameRunning) updateProjectiles(dt);
    if (gameRunning && boss) updateBoss(dt, grid);
    if (gameRunning) gameFrame = requestAnimationFrame(loop);
  };
  gameLoop = loop;
  gameFrame = requestAnimationFrame(loop);
}

function showPlayButton() {
  gameContainer.style.display = 'flex';
  gameContainer.style.alignItems = 'center';
  gameContainer.style.justifyContent = 'center';

  const playButton = document.createElement('button');
  playButton.className = 'cp-play-button';
  playButton.setAttribute('aria-label', 'Play');
  playButton.style.cssText = `
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  `;

  const logo = document.createElement('img');
  logo.src = '/media/logo.png';
  logo.alt = 'Play Cibophobia';
  logo.draggable = false;
  logo.style.cssText = 'display: block; width: min(300px, 60vw); height: auto;';

  playButton.appendChild(logo);
  playButton.addEventListener('click', startIntro);
  gameContainer.appendChild(playButton);
}

function injectStyles() {
  if (document.getElementById('cp-styles')) return;

  const style = document.createElement('style');
  style.id = 'cp-styles';
  style.textContent = `
    .cp-game-container {
      color: #3b2a14;
      font-family: 'Courier New', monospace;
      font-weight: 700;
    }
    .cp-bubble {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-width: 100px;
      padding: 0.6rem 1.1rem;
      background: #d9b779;
      border: 3px solid #7a5628;
      border-radius: 6px;
      box-shadow: 0 4px 0 #7a5628;
      color: #3b2a14;
      font: 700 0.9rem/1.25 'Courier New', monospace;
      text-align: center;
      white-space: pre-line;
      cursor: pointer;
      transition: background 0.1s, translate 0.05s, box-shadow 0.05s;
    }
    .cp-bubble-large {
      width: 100%;
      font-size: 1.1rem;
      padding: 0.8rem 1.2rem;
    }
    .cp-bubble:hover {
      background: #e6c98f;
    }
    .cp-bubble:active {
      translate: 0 3px;
      box-shadow: 0 1px 0 #7a5628;
    }
    .cp-bubble-selected {
      background: #b8822f;
      color: #fff6e0;
    }
    .cp-bubble-selected:hover {
      background: #c48c36;
    }
    .cp-bubble:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .cp-bubble:disabled:hover {
      background: #d9b779;
    }
    .cp-bubble:disabled:active {
      translate: none;
      box-shadow: 0 4px 0 #7a5628;
    }
    .cp-message {
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      z-index: 10;
      max-width: min(420px, 60vw);
      padding: 0.6rem 0.9rem;
      background: #d9b779;
      border: 3px solid #7a5628;
      border-radius: 6px;
      box-shadow: 0 4px 0 #7a5628;
      color: #3b2a14;
      font: 700 1rem/1.3 'Courier New', monospace;
      pointer-events: none;
      opacity: 0;
      animation-name: cp-message-life;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
    @keyframes cp-message-life {
      0% { opacity: 0; }
      6% { opacity: 1; }
      90% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes cp-warn-flash {
      from { opacity: 0.4; }
      to { opacity: 1; }
    }
    @keyframes cp-target-pulse {
      from { transform: scale(0.7); opacity: 0.6; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

injectStyles();
showPlayButton();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    endIntro();
    if (levelActive && gameRunning) toggleSettings();
    return;
  }

  if (!levelActive || paused) return;

  if (event.code === 'Space') {
    if (currentLevel.shooting) {
      event.preventDefault();
      fireProjectile();
    }
    return;
  }

  const move = MOVE_KEYS[event.key.toLowerCase()];
  if (!move) return;
  event.preventDefault();
  movePlayer(move[0], move[1]);
});