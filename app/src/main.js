// Vice Cover Studio — wires the page: photo uploads, per-panel crop controls,
// caption, theme and export size, PNG export, and the ?shot= scenes used for
// screenshots. Photos are read on this machine and never uploaded anywhere.
import { drawCover, SIZES, THEMES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');
const sizeSelect = document.getElementById('size');
const themeSelect = document.getElementById('theme');
const statusEl = document.getElementById('status');
const exportBtn = document.getElementById('export');

// One slot per panel: hero, left small, right small.
const state = {
  photos: [null, null, null],
  crops: [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
  ],
  caption: 'Vice Nights',
  sub: 'Est. 2026',
  theme: 'sunset',
  size: 'square',
};

const SAMPLES = {
  portrait: 'samples/portrait.webp',
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Waits for the Anton display face, then draws once. */
async function drawReady() {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch {
    // Fall back to the system sans if the local font cannot load.
  }
  redraw();
}

function redraw() {
  drawCover(canvas, state);
}

function setSize(key) {
  state.size = key;
  const { w, h } = SIZES[key];
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w} / ${h}`;
  exportBtn.textContent = `Export PNG ${w} x ${h}`;
  redraw();
}

function setTheme(key) {
  state.theme = key;
  document.body.dataset.theme = key;
  redraw();
}

/** Builds the per-slot controls (file input, sample picker, zoom and pan). */
function buildSlotControls() {
  const wrap = document.getElementById('slots');
  const labels = ['Hero photo', 'Second photo', 'Third photo'];
  state.photos.forEach((_, i) => {
    const box = document.createElement('fieldset');
    box.className = 'slot';
    const legend = document.createElement('legend');
    legend.textContent = labels[i];
    box.appendChild(legend);

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Upload';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      state.photos[i] = await loadImage(URL.createObjectURL(f));
      redraw();
    });
    fileLabel.appendChild(file);
    box.appendChild(fileLabel);

    const sampleRow = document.createElement('div');
    sampleRow.className = 'samples';
    Object.entries(SAMPLES).forEach(([name, path]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sample';
      b.textContent = name;
      b.addEventListener('click', async () => {
        state.photos[i] = await loadImage(path);
        redraw();
      });
      sampleRow.appendChild(b);
    });
    box.appendChild(sampleRow);

    const mkSlider = (label, min, max, step, value, onInput) => {
      const lab = document.createElement('label');
      lab.textContent = label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = value;
      input.addEventListener('input', () => onInput(Number(input.value)));
      lab.appendChild(input);
      box.appendChild(lab);
    };
    mkSlider('Zoom', 1, 2.5, 0.05, 1, (v) => { state.crops[i].zoom = v; redraw(); });
    mkSlider('Pan left / right', -0.4, 0.4, 0.02, 0, (v) => { state.crops[i].dx = v; redraw(); });
    mkSlider('Pan up / down', -0.4, 0.4, 0.02, 0, (v) => { state.crops[i].dy = v; redraw(); });
    wrap.appendChild(box);
  });
}

/** Renders the current cover at full export size and downloads the PNG. */
function exportPng() {
  const { w, h } = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    const kb = Math.round(blob.size / 1024);
    statusEl.textContent = `Saved vice-cover-${w}x${h}.png (${kb} KB)`;
    window.__exportInfo = { name: a.download, bytes: blob.size };
  }, 'image/png');
}

exportBtn.addEventListener('click', exportPng);
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });
sizeSelect.addEventListener('change', () => setSize(sizeSelect.value));
themeSelect.addEventListener('change', () => setTheme(themeSelect.value));

document.getElementById('demo').addEventListener('click', async () => {
  const [a, b, c] = await Promise.all([
    loadImage(SAMPLES.portrait),
    loadImage(SAMPLES.boulevard),
    loadImage(SAMPLES.pier),
  ]);
  state.photos = [a, b, c];
  state.caption = 'Vice Nights';
  captionInput.value = 'Vice Nights';
  redraw();
});

Object.entries(SIZES).forEach(([key, s]) => {
  const o = document.createElement('option');
  o.value = key;
  o.textContent = s.label;
  sizeSelect.appendChild(o);
});
Object.entries(THEMES).forEach(([key, t]) => {
  const o = document.createElement('option');
  o.value = key;
  o.textContent = t.label;
  themeSelect.appendChild(o);
});

buildSlotControls();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, { loadImage, setSize, setTheme, redraw, drawReady, exportPng });
} else {
  setSize('square');
  setTheme('sunset');
  drawReady();
}
