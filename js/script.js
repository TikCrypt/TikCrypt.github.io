//To change the background and font colours
const STORAGE_KEY = 'themeOverrides';
const THEME_NAMES = ['space', 'desert', 'water', 'underground'];
const root = document.documentElement;

function toHex(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillStyle = color.trim();
  return ctx.fillStyle;
}

function getOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function setThemeVars(theme, { bg, text }) {
  root.style.setProperty(`--${theme}-bg`, bg);
  root.style.setProperty(`--${theme}-bg-text`, text);
}

function clearThemeVars(theme) {
  root.style.removeProperty(`--${theme}-bg`);
  root.style.removeProperty(`--${theme}-bg-text`);
}

const defaults = {};
const cs = getComputedStyle(root);
THEME_NAMES.forEach(theme => {
  defaults[theme] = {
    bg: toHex(cs.getPropertyValue(`--${theme}-bg`)),
    text: toHex(cs.getPropertyValue(`--${theme}-bg-text`))
  };
});

const overrides = getOverrides();
THEME_NAMES.forEach(theme => {
  if (overrides[theme]) setThemeVars(theme, overrides[theme]);
});

const themeSelect = document.getElementById('bg-page-selector');
const bgInput     = document.getElementById('bg-color-selector');
const fontInput   = document.getElementById('font-color-selector');
const saveButton  = document.getElementById('s-save-button');
const resetButton = document.getElementById('s-reset-button');

if (themeSelect && bgInput && fontInput) {
  function syncPickers() {
    const theme = themeSelect.value;
    const current = getOverrides()[theme] || defaults[theme];
    bgInput.value = current.bg;
    fontInput.value = current.text;
  }

  function preview() {
    setThemeVars(themeSelect.value, { bg: bgInput.value, text: fontInput.value });
  }

  let previousTheme = themeSelect.value;
  themeSelect.addEventListener('change', () => {
    const saved = getOverrides()[previousTheme];
    if (saved) setThemeVars(previousTheme, saved);
    else clearThemeVars(previousTheme);
    previousTheme = themeSelect.value;
    syncPickers();
  });

  bgInput.addEventListener('input', preview);
  fontInput.addEventListener('input', preview);

  saveButton?.addEventListener('click', () => {
    const all = getOverrides();
    all[themeSelect.value] = { bg: bgInput.value, text: fontInput.value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setThemeVars(themeSelect.value, all[themeSelect.value]);
  });

  resetButton?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    THEME_NAMES.forEach(clearThemeVars);
    syncPickers();
  });

  syncPickers();
}

//This is the hide function and all its saving stuffs.
(function () {
  const ACTIVE_KEY = 'hideEffectActive';
  const SETTINGS = {
    color:   { key: 'hideEffectColor',   default: '#000000' },
    size:    { key: 'hideEffectSize',    default: '60' },
    opacity: { key: 'hideEffectOpacity', default: '1' }
  };

  function readSetting(name) {
    const cfg = SETTINGS[name];
    const stored = localStorage.getItem(cfg.key);
    return stored === null ? cfg.default : stored;
  }

  function writeSetting(name, value) {
    localStorage.setItem(SETTINGS[name].key, value);
  }

  const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';
  const settingsChannel = hasBroadcastChannel ? new BroadcastChannel('hide-effect-settings') : null;

  function initHideEffect() {
    let hideEl = document.getElementById('hide-button');
    if (!hideEl) {
      hideEl = Array.from(document.querySelectorAll('a, li')).find(el =>
        el.textContent.trim().toLowerCase() === 'hide'
      );
    }
    if (!hideEl) return;

    if (!document.getElementById('hide-effect-style')) {
      const style = document.createElement('style');
      style.id = 'hide-effect-style';
      style.textContent = `
        #desaturate-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: var(--hide-color, #000000);
          opacity: var(--hide-opacity, 1);
          display: none;
          z-index: 9999;
          -webkit-mask-image: radial-gradient(circle var(--hide-size, 60px) at var(--mx, 60%) var(--my, 60%), transparent 0%, transparent 60%, black 100%);
          mask-image: radial-gradient(circle var(--hide-size, 60px) at var(--mx, 60%) var(--my, 60%), transparent 0%, transparent 60%, black 100%);
          transition: opacity 0.15s ease;
        }
        #desaturate-overlay.active { display: block; }
        .hide-effect-exempt { position: relative; z-index: 10000; }
      `;
      document.head.appendChild(style);
    }

    let overlay = document.getElementById('desaturate-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'desaturate-overlay';
      document.body.appendChild(overlay);
    }

    function applySettingsToOverlay() {
      overlay.style.setProperty('--hide-color', readSetting('color'));
      overlay.style.setProperty('--hide-size', readSetting('size') + 'px');
      overlay.style.setProperty('--hide-opacity', readSetting('opacity'));
    }
    applySettingsToOverlay();

    window.applyHideEffect = applySettingsToOverlay;

    window.addEventListener('pageshow', (e) => {
      if (e.persisted) applySettingsToOverlay();
    });

    const exemptTarget = document.getElementById('nav-bar');
    if (exemptTarget) exemptTarget.classList.add('hide-effect-exempt');

    function moveHandler(e) {
      overlay.style.setProperty('--mx', e.clientX + 'px');
      overlay.style.setProperty('--my', e.clientY + 'px');
    }

    function setActive(active) {
      overlay.classList.toggle('active', active);
      if (active) {
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('click', moveHandler);
      } else {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('click', moveHandler);
      }
      localStorage.setItem(ACTIVE_KEY, active ? '1' : '0');
    }

    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      const watched = Object.values(SETTINGS).map(s => s.key);
      if (watched.includes(e.key)) applySettingsToOverlay();
    });

    if (settingsChannel) {
      settingsChannel.onmessage = (e) => {
        if (e.data === 'settings-updated') applySettingsToOverlay();
      };
    }

    setActive(localStorage.getItem(ACTIVE_KEY) === '1');

    hideEl.addEventListener('click', (e) => {
      e.preventDefault();
      setActive(!overlay.classList.contains('active'));
    });
  }

  function initSettingsPage() {
    const colorEl = document.getElementById('s-color-selector');
    const sizeEl = document.getElementById('s-size-selector');
    const opacityEl = document.getElementById('s-opacity-selector');
    if (!colorEl || !sizeEl || !opacityEl) return;

    const sizeVal = document.getElementById('sizeVal');
    const opacityVal = document.getElementById('opacityVal');
    const previewOverlay = document.getElementById('preview-overlay');
    const saveButton = document.getElementById('s-save-button');
    const resetButton = document.getElementById('s-reset-button');

    function load() {
      colorEl.value = readSetting('color');
      sizeEl.value = readSetting('size');
      opacityEl.value = readSetting('opacity');
    }

    function updatePreview() {
      const size = sizeEl.value;
      const opacity = opacityEl.value;
      if (sizeVal) sizeVal.textContent = size + 'px';
      if (opacityVal) opacityVal.textContent = Math.round(opacity * 100) + '%';
      if (!previewOverlay) return;
      previewOverlay.style.background = colorEl.value;
      previewOverlay.style.opacity = opacity;
      const mask = `radial-gradient(circle ${size}px at 50% 50%, transparent 0%, transparent 60%, black 100%)`;
      previewOverlay.style.webkitMaskImage = mask;
      previewOverlay.style.maskImage = mask;
    }

    function saveSettings() {
      writeSetting('color', colorEl.value);
      writeSetting('size', sizeEl.value);
      writeSetting('opacity', opacityEl.value);
      if (settingsChannel) settingsChannel.postMessage('settings-updated');
      if (window.applyHideEffect) window.applyHideEffect();
    }

    [colorEl, sizeEl, opacityEl].forEach(el => {
      el.addEventListener('input', updatePreview);
    });

    if (saveButton) {
      saveButton.addEventListener('click', saveSettings);
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        colorEl.value = SETTINGS.color.default;
        sizeEl.value = SETTINGS.size.default;
        opacityEl.value = SETTINGS.opacity.default;
        updatePreview();
        saveSettings();
      });
    }

    load();
    updatePreview();
  }

  function init() {
    initHideEffect();
    initSettingsPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

//This function helps with expanding the text field
function autoExpand(field) {
  field.style.height = "inherit";
  field.style.height = `${field.scrollHeight}px`;
}

//This is the function that gets a random key.
function getKey() {
  const list_key = [];
  for (let i = 0; i < 256; i++) {
    var bit = Math.floor(Math.random() * 2);
    list_key.push(bit);
  }
  const key = list_key.join("");

  const key_display = document.getElementById("key-display");
  key_display.textContent = key;

  console.log("Key got!");

  return key;
}

//TikCryption encryption and decryption
(function () {
  "use strict";

  const KEY_BITS = 256;
  const DECOY_PROBABILITY = 0.25;
  const LAST_KEY_STORAGE_KEY = "tikcryption_last_key";

  //Supporting functions
  function generateRandomKey(bits) {
    let out = "";
    for (let i = 0; i < bits; i++) {
      out += Math.random() < 0.5 ? "0" : "1";
    }
    return out;
  }

  function validateKey(keyStr) {
    if (!keyStr || typeof keyStr !== "string") {
      throw new Error("Missing key.");
    }
    if (!/^[01]+$/.test(keyStr)) {
      throw new Error("Key must contain only 0s and 1s.");
    }
    if (keyStr.length < 32) {
      throw new Error("Key must be at least 32 bits long.");
    }
    return keyStr;
  }

  function keyBitsAt(keyStr, offset, count) {
    let bits = "";
    for (let i = 0; i < count; i++) {
      bits += keyStr[(offset + i) % keyStr.length];
    }
    return bits;
  }

  //Byte converter
  function rotl8(byte, n) {
    n = n % 8;
    return ((byte << n) | (byte >>> (8 - n))) & 0xff;
  }
  function rotr8(byte, n) {
    n = n % 8;
    return ((byte >>> n) | (byte << (8 - n))) & 0xff;
  }

  function transformByte(byte, keyByte, opBits, encrypting) {
    switch (opBits) {
      case "00":
        return encrypting
          ? (byte + keyByte) % 256
          : ((byte - keyByte) % 256 + 256) % 256;
      case "01":
        return encrypting
          ? ((byte - keyByte) % 256 + 256) % 256
          : (byte + keyByte) % 256;
      case "10":
        return byte ^ keyByte;
      case "11":
        return encrypting
          ? rotl8(byte, keyByte % 8)
          : rotr8(byte, keyByte % 8);
      default:
        throw new Error("Unreachable operation selector: " + opBits);
    }
  }

  function walkBytes(bytes, keyStr, encrypting) {
    const keyLen = keyStr.length;
    let keyOffset = 0;
    let opOffset = 0;
    const out = new Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      const keyByte = parseInt(keyBitsAt(keyStr, keyOffset, 8), 2);
      keyOffset = (keyOffset + 8) % keyLen;

      const opBits = keyBitsAt(keyStr, opOffset, 2);
      opOffset = (opOffset + 2) % keyLen;

      out[i] = transformByte(bytes[i], keyByte, opBits, encrypting);
    }
    return out;
  }

  //Decoy insertion and removal
  function hashKeyToSeed(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 ^ h2) >>> 0;
  }

  function mulberry32(seed) {
    let a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  //Decoy generator
  function decoyRng(keyStr) {
    return mulberry32(hashKeyToSeed(keyStr + ":decoy"));
  }

  //Decoy encryption
  function insertDecoys(bytes, keyStr) {
    const rng = decoyRng(keyStr);
    const out = [];
    let real = 0;
    while (real < bytes.length) {
      if (rng() < DECOY_PROBABILITY) {
        out.push(Math.floor(rng() * 256));
      } else {
        out.push(bytes[real]);
        real++;
      }
    }
    return out;
  }

  //Decoy  decryption
  function removeDecoys(bytes, keyStr) {
    const rng = decoyRng(keyStr);
    const out = [];
    for (let i = 0; i < bytes.length; i++) {
      if (rng() < DECOY_PROBABILITY) {
        rng();
      } else {
        out.push(bytes[i]);
      }
    }
    return out;
  }

  //Converter
  function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  //Key persistence helpers
  function saveLastKey(keyStr) {
    try {
      localStorage.setItem(LAST_KEY_STORAGE_KEY, keyStr);
    } catch (e) {
      console.warn("Could not save key to localStorage:", e.message);
    }
  }

  function loadLastKey() {
    try {
      return localStorage.getItem(LAST_KEY_STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  //Implementation of the encrypt function
  function encryptMessage(message, keyStr) {
    validateKey(keyStr);
    if (!message) throw new Error("Enter a message to encrypt.");
    const bytes = Array.from(new TextEncoder().encode(message));
    const transformed = walkBytes(bytes, keyStr, true);
    const withDecoys = insertDecoys(transformed, keyStr);
    return bytesToBase64(withDecoys);
  }

  function decryptMessage(ciphertextB64, keyStr) {
    validateKey(keyStr);
    if (!ciphertextB64) throw new Error("Enter ciphertext to decrypt.");
    let bytes;
    try {
      bytes = base64ToBytes(ciphertextB64.trim());
    } catch (e) {
      throw new Error("Ciphertext isn't valid base64.");
    }
    const stripped = removeDecoys(bytes, keyStr);
    const original = walkBytes(stripped, keyStr, false);
    return new TextDecoder().decode(Uint8Array.from(original));
  }

  //It allows the variables to persist
  window.TikCryption = {
    generateRandomKey,
    encryptMessage,
    decryptMessage,
    saveLastKey,
    loadLastKey,
  };

  //Encrypt function
  window.encryptionFunction = function () {
    const input = document.getElementById("encrypt-input");
    const keyDisplay = document.getElementById("key-display");
    if (!input) return;

    const message = input.value;
    if (!message || message.trim() === "" || message === "Enter text here...") {
      return;
    }

    try {
      const keyStr = generateRandomKey(KEY_BITS);
      const ciphertext = encryptMessage(message, keyStr);

      input.value = ciphertext;
      window.autoExpand(input);

      if (keyDisplay) keyDisplay.textContent = keyStr;

      //Saves the key for later
      saveLastKey(keyStr);
    } catch (err) {
      if (keyDisplay) keyDisplay.textContent = "Error: " + err.message;
    }
  };

  //Decrypt function
  window.decryptionFunction = function () {
    const input = document.getElementById("decrypt-input");
    const keyInput = document.getElementById("key-input");
    if (!input || !keyInput) return;

    const ciphertext = input.value;
    if (!ciphertext || ciphertext.trim() === "" || ciphertext === "Enter ciphertext here...") {
      return;
    }

    const keyStr = keyInput.value.trim();
    if (!keyStr) {
      input.value = "Error: paste the key from Encrypt first.";
      return;
    }

    try {
      const message = decryptMessage(ciphertext, keyStr);
      input.value = message;
      window.autoExpand(input);
    } catch (err) {
      input.value = "Error: " + err.message;
    }
  };

  // This autofills the decryption page's key holder.
  window.addEventListener("DOMContentLoaded", function () {
    const keyInput = document.getElementById("key-input");
    if (keyInput && !keyInput.value.trim()) {
      const last = loadLastKey();
      if (last) keyInput.value = last;
    }
  });

  //Allows the last key to be saved as a text file.
  window.downloadLastKey = function () {
    const keyStr = loadLastKey();
    if (!keyStr) {
      alert("No saved key found yet — encrypt a message first.");
      return;
    }
    const blob = new Blob([keyStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tikcryption-last-key.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

})();

//This is the dropdown code.
const dropdownParents = document.querySelectorAll('nav li:has(.dropdown)');

dropdownParents.forEach((item) => {
  const link = item.querySelector('a');

  link.addEventListener('click', (e) => {
    e.preventDefault();

    const isOpen = item.classList.contains('open');

    dropdownParents.forEach((other) => other.classList.remove('open'));

    if (!isOpen) {
      item.classList.add('open');
    }
  });
});

//Closes the dropdown if the user clicks anywhere outside the nav
document.addEventListener('click', (e) => {
  if (!e.target.closest('nav')) {
    dropdownParents.forEach((item) => item.classList.remove('open'));
  }
});

//The function to copy stuff
function copyText(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        console.error("copyText: no element found with id '" + elementId + "'");
        return;
    }

    const text = "value" in el ? el.value : el.textContent;

    navigator.clipboard.writeText(text)
        .then(() => {
            console.log("Text copied successfully.");
            alert(text + " has been copied");
        })
        .catch(err => {
            console.error("Failed to copy: ", err);
        });
}