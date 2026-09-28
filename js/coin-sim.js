const container = document.getElementById('coin-game-container');

const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(width, height);
container.appendChild(renderer.domElement);

camera.position.z = 5;

const light = new THREE.DirectionalLight(0xFFAE42, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xFFFFFF, 0.3));

const textureLoader = new THREE.TextureLoader();

const geometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);

const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const topTexture = textureLoader.load('/media/logo.png');
const bottomTexture = textureLoader.load('/media/moon.png');

scene.background = "black";

function fitBackgroundCover(texture, canvasWidth, canvasHeight) {
  const imageAspect = texture.image.width / texture.image.height;
  const canvasAspect = canvasWidth / canvasHeight;

  if (canvasAspect > imageAspect) {
    const scale = imageAspect / canvasAspect;
    texture.repeat.set(1, scale);
    texture.offset.set(0, (1 - scale) / 2);
  } else {
    const scale = canvasAspect / imageAspect;
    texture.repeat.set(scale, 1);
    texture.offset.set((1 - scale) / 2, 0);
  }
}

const materials = [
  sideMaterial,
  new THREE.MeshStandardMaterial({ map: topTexture }),
  new THREE.MeshStandardMaterial({ map: bottomTexture }),
];

const coin = new THREE.Mesh(geometry, materials);
scene.add(coin);

const speedGauge = document.getElementById("speed-gauge");

const minSpeed = 0.01;
const maxSpeed = 5;
const speedDecay = 0.98;
let spinSpeed = 0.01;

let isPaused = false;

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

    speedGauge.textContent = Math.round(spinSpeed * 1000) / 1000;
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

function loadDroppedImage(file, onLoaded) {
  const url = URL.createObjectURL(file);

  textureLoader.load(url, (texture) => {
    onLoaded(texture);
    URL.revokeObjectURL(url);
  });
}

function applyImageToCoin(file, materialIndex) {
  loadDroppedImage(file, (texture) => {
    const material = coin.material[materialIndex];
    if (material.map) material.map.dispose();
    material.map = texture;
    material.needsUpdate = true;
  });
}

function applyImageToBackground(file) {
  loadDroppedImage(file, (texture) => {
    if (scene.background && scene.background.isTexture) {
      scene.background.dispose();
    }
    fitBackgroundCover(texture, width, height);
    scene.background = texture;
  });
}

function setupDropZone(zoneId, onFile) {
  const zone = document.getElementById(zoneId);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    onFile(file);
  }

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;
  zone.appendChild(input);

  zone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    handleFile(input.files[0]);
    input.value = '';
  });

  zone.tabIndex = 0;
  zone.setAttribute('role', 'button');
  zone.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      input.click();
    }
  });
}

setupDropZone('drop-top', (file) => applyImageToCoin(file, 1));
setupDropZone('drop-bottom', (file) => applyImageToCoin(file, 2));
setupDropZone('drop-bg', applyImageToBackground);

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

renderer.domElement.addEventListener('mousemove', onCoinHover);