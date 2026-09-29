const gameContainer = document.querySelector('.cp-game-container');
const LEVEL_COUNT = 1;
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
      'Cibophobia, the fear of food.',
    ],
    messages: [
      { at: 1, text: 'The worms approach!' },
      { at: 15, text: 'The fish descend upon us too!' },
    ],
  },
  endless: {
    endless: true,
    story: [
      'Endure the infinite.',
    ],
    messages: [
      { at: 1, text: 'Goal: Survive.' },
    ],
  },
};
let currentLevel = LEVELS[1];
let selectedDifficulty = 'medium';

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

  const title = document.createElement('h1');
  title.textContent = 'Cibophobia';
  title.style.margin = '0';

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
    button.style.animationDelay = `${-Math.random() * 3}s`;
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
    const button = document.createElement('button');
    button.textContent = level === 'endless' ? 'Endless' : `Level ${level}`;
    button.className = 'cp-level-button cp-bubble cp-bubble-large';
    button.style.animationDelay = `${-Math.random() * 3}s`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      startLevel(level);
    });
    buttons.appendChild(button);
  }

  screen.append(title, difficultyRow, buttons);
  gameContainer.appendChild(screen);
}

const GRID_COLS = 10;
const GRID_ROWS = 10;
const TILE_PATH = 'tiles/';
const TILE_EXT = '.png';
const TILE_NAMES = ['sand-1', 'sand-2', 'sand-3', 'sand-4'];
const EMPTY_TILE = 'sand-empty';

function tileSrc(name) {
  return `${TILE_PATH}${name}${TILE_EXT}`;
}

function buildGrid() {
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
  createPlayer(grid);
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

function createPlayer(grid) {
  playerRow = GRID_ROWS - 1;
  playerCol = Math.floor(GRID_COLS / 2);

  playerEl = document.createElement('img');
  playerEl.className = 'cp-player';
  playerEl.src = PLAYER_SRC;
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
    color: black;
    font-family: 'Courier New', monospace;
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

  hud.append(timer, livesEl);

  const grid = buildGrid();
  gameContainer.append(hud, grid);
  startGame(grid, timer, livesEl, startingLives, LEVELS[level]);
}

const FALLERS = {
  fish: { src: 'media/fish.png', speed: 0.7, sideways: true },
  worm: { src: 'media/worm.gif', speed: 0.7, sideways: false },
};
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
  faller.el.remove();
  fallers = fallers.filter((f) => f !== faller);
}

function getParams(t) {
  if (currentLevel.endless) {
    return {
      maxWorms: Math.min(12, 2 + Math.floor(t / 10)),
      maxFish: t < 20 ? 0 : Math.min(6, 1 + Math.floor((t - 20) / 20)),
      spawnMin: Math.max(0.25, 1.2 - t * 0.012),
      spawnMax: Math.max(0.6, 3 - t * 0.03),
      speedMult: Math.min(2.5, 1 + t / 60),
    };
  }
  return {
    maxWorms: currentLevel.maxWorms,
    maxFish: t >= currentLevel.duration - currentLevel.fishLastSeconds ? currentLevel.maxFish : 0,
    spawnMin: SPAWN_MIN,
    spawnMax: SPAWN_MAX,
    speedMult: 1,
  };
}

function spawnFaller(grid) {
  const params = getParams(gameElapsed);
  const wormCount = fallers.filter((f) => f.type === 'worm').length;
  const fishCount = fallers.filter((f) => f.type === 'fish').length;
  const fishAllowed = fishCount < params.maxFish;
  const wormAllowed = wormCount < params.maxWorms;

  const available = [];
  if (wormAllowed) available.push('worm');
  if (fishAllowed) available.push('fish');
  if (available.length === 0) return;
  const type = available[Math.floor(Math.random() * available.length)];

  const columns = Array.from({ length: GRID_COLS }, (_, i) => i);
  const freeColumns = columns.filter(
    (c) => !fallers.some((f) => f.col === c && f.row < 1.5)
  );
  if (freeColumns.length === 0) return;
  const col = freeColumns[Math.floor(Math.random() * freeColumns.length)];
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
    row: -1,
    speed: config.speed * params.speedMult,
    sideways: config.sideways,
    nextShift: randomBetween(SHIFT_MIN, SHIFT_MAX),
    pendingDir: 0,
    arrowEl: null,
  };

  placeFaller(faller);
  grid.appendChild(el);
  fallers.push(faller);
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
    faller.row += faller.speed * dt;

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

    if (faller.row >= GRID_ROWS) {
      removeFaller(faller);
      continue;
    }

    if (faller.col === playerCol && Math.abs(faller.row - playerRow) < 0.75) {
      removeFaller(faller);
      takeDamage();
      continue;
    }

    placeFaller(faller);
  }
}

let lives = 0;
let livesDisplay = null;
let gameRunning = false;

function takeDamage() {
  if (!gameRunning) return;
  lives -= 1;
  livesDisplay.textContent = `Lives: ${lives}`;
  if (lives <= 0) endGame();
}

function showEndScreen(headingText, messageText) {
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
  gameContainer.appendChild(screen);

  setTimeout(showLevelSelect, GAME_OVER_DELAY);
}

function endGame() {
  if (!gameRunning) return;
  showEndScreen('Game Over', `You survived ${formatTime(gameElapsed)}`);
}

function finishLevel() {
  if (!gameRunning) return;
  showEndScreen('Level Complete!', `Lives left: ${lives}`);
}

function startGame(grid, timerEl, livesEl, startingLives, level) {
  cancelAnimationFrame(gameFrame);
  currentLevel = level;
  fallers = [];
  gameElapsed = 0;
  lives = startingLives;
  livesDisplay = livesEl;
  gameRunning = true;
  spawnTimer = randomBetween(0.3, 1.5);
  nextMessage = 0;
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
    } else {
      const remaining = Math.max(currentLevel.duration - gameElapsed, 0);
      timerEl.textContent = formatTime(Math.ceil(remaining));
      if (remaining <= 0) {
        finishLevel();
        return;
      }
    }

    updateSpawners(grid, dt);
    updateFallers(dt);
    if (gameRunning) gameFrame = requestAnimationFrame(loop);
  };
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
    .cp-bubble {
      --cp-pixel-circle: polygon(
        30% 0, 70% 0, 70% 10%, 85% 10%, 85% 20%, 90% 20%, 90% 30%, 100% 30%,
        100% 70%, 90% 70%, 90% 80%, 85% 80%, 85% 90%, 70% 90%, 70% 100%, 30% 100%,
        30% 90%, 15% 90%, 15% 80%, 10% 80%, 10% 70%, 0 70%, 0 30%, 10% 30%,
        10% 20%, 15% 20%, 15% 10%, 30% 10%
      );
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 100px;
      height: 100px;
      padding: 0.5rem;
      border: none;
      border-radius: 0;
      background: #0b3a5b;
      clip-path: var(--cp-pixel-circle);
      color: #0b3a5b;
      font: 700 0.8rem/1.25 'Courier New', monospace;
      text-align: center;
      white-space: pre-line;
      cursor: pointer;
      animation: cp-bob 1.6s steps(4, end) infinite alternate;
    }
    .cp-bubble::before {
      content: '';
      position: absolute;
      inset: 8%;
      z-index: -1;
      background:
        linear-gradient(#fff, #fff) 20% 18% / 16% 6% no-repeat,
        linear-gradient(#fff, #fff) 20% 18% / 6% 16% no-repeat,
        #7ccbff;
      clip-path: var(--cp-pixel-circle);
    }
    .cp-bubble-large {
      width: 130px;
      height: 130px;
      font-size: 1rem;
    }
    .cp-bubble:hover {
      filter: brightness(1.12);
    }
    .cp-bubble:active {
      scale: 0.92;
    }
    .cp-bubble-selected::before {
      background:
        linear-gradient(#fff, #fff) 20% 18% / 16% 6% no-repeat,
        linear-gradient(#fff, #fff) 20% 18% / 6% 16% no-repeat,
        #ffe27a;
    }
    @keyframes cp-bob {
      from { translate: 0 -6px; }
      to { translate: 0 6px; }
    }
    .cp-message {
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      z-index: 10;
      max-width: min(420px, 60vw);
      padding: 0.6rem 0.9rem;
      background: rgba(11, 58, 91, 0.9);
      border: 3px solid #fff;
      color: #fff;
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
    @media (prefers-reduced-motion: reduce) {
      .cp-bubble { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

injectStyles();
showPlayButton();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') endIntro();

  if (!levelActive) return;
  const move = MOVE_KEYS[event.key.toLowerCase()];
  if (!move) return;
  event.preventDefault();
  movePlayer(move[0], move[1]);
});