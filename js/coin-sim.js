const container = document.getElementById('coin-game-container');

const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(width, height);
container.appendChild(renderer.domElement);

function getCssColor(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

scene.background = new THREE.Color(getCssColor('--space-bg'));

const light = new THREE.DirectionalLight(0xFFAE42, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xFFFFFF, 0.3));

const textureLoader = new THREE.TextureLoader();

renderer.setSize(width, height);
container.appendChild(renderer.domElement);

camera.position.z = 5;

const geometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);

const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const topTexture = textureLoader.load('/media/logo.png');
const bottomTexture = textureLoader.load('/media/moon.png');

const materials = [
  sideMaterial,
  new THREE.MeshStandardMaterial({ map: topTexture }),
  new THREE.MeshStandardMaterial({ map: bottomTexture }),
];

const coin = new THREE.Mesh(geometry, materials);
scene.add(coin);

if (getComputedStyle(container).position === 'static') {
  container.style.position = 'relative';
}

const minSpeed = 0.01;
const maxSpeed = 5;
const speedDecay = 0.98;
let spinSpeed = 0.01;

let isPaused = false;

const TOP_SPEED_KEY = 'coinTopSpeed';
const currentSpeedEl = document.getElementById('current-speed');
const topSpeedEl = document.getElementById('top-speed');

function toDisplaySpeed(speed) {
  return Math.round(speed * 1000) / 10;
}

let topSpeed = 0;
try {
  const stored = parseFloat(localStorage.getItem(TOP_SPEED_KEY));
  if (Number.isFinite(stored) && stored > 0) topSpeed = stored;
} catch {}

function updateSpeedDisplays() {
  if (spinSpeed > topSpeed) {
    topSpeed = spinSpeed;
    try { localStorage.setItem(TOP_SPEED_KEY, String(topSpeed)); } catch {}
  }

  const current = toDisplaySpeed(spinSpeed);
  if (currentSpeedEl) currentSpeedEl.textContent = current;
  if (topSpeedEl) topSpeedEl.textContent = toDisplaySpeed(topSpeed);
}

updateSpeedDisplays();

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    isPaused = !isPaused;
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    coin.rotation.y += spinSpeed;
    coin.rotation.x += spinSpeed;

    if (spinSpeed > minSpeed) {
      spinSpeed = minSpeed + (spinSpeed - minSpeed) * speedDecay;
    }

    updateSpeedDisplays();
  }

  renderer.render(scene, camera);
}

animate();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onCoinClick(event) {
  if (isPaused) return;

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(coin);

  if (spinSpeed <= (maxSpeed + 0.25)) {
    if (intersects.length > 0) {
        spinSpeed += 0.06;
        updateSpeedDisplays();
        console.log('Coin clicked!');
        console.log("Current Speed" + spinSpeed)
    }
  }
}

renderer.domElement.addEventListener('click', onCoinClick);

function onCoinHover(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(coin);

  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

renderer.domElement.addEventListener('mousemove', onCoinHover);