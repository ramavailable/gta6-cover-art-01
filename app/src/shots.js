// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// requested export size; ?shot=editor shows the page with photos loaded.
// `photo`, `photo2`, `photo3` name files under samples/ (with extension),
// `caption` and `sub` the words, `size` one of square/post/story/wide,
// `theme` one of sunset/neon/golden. window.__shotReady is set once painted;
// with &export=1 the shot also runs the PNG export and records
// window.__exportInfo, so the export path can be verified headlessly.
import { SIZES } from './cover.js';

export async function runShot(shot, query, state, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const sizeKey = query.get('size');
  if (sizeKey && SIZES[sizeKey]) {
    api.setSize(sizeKey);
    document.getElementById('size').value = sizeKey;
  }
  const themeKey = query.get('theme');
  if (themeKey) {
    api.setTheme(themeKey);
    document.getElementById('theme').value = themeKey;
  }
  const names = [query.get('photo') ?? 'pier.jpg', query.get('photo2'), query.get('photo3')];
  const loaded = await Promise.all(
    names.map((n) => (n ? api.loadImage(`samples/${n}`).catch(() => null) : Promise.resolve(null))),
  );
  state.photos = loaded;
  const caption = query.get('caption');
  if (caption !== null) {
    state.caption = caption;
    document.getElementById('caption').value = caption;
  }
  const sub = query.get('sub');
  if (sub !== null) {
    state.sub = sub;
    document.getElementById('sub').value = sub;
  }
  await api.drawReady();
  if (query.get('export') === '1') api.exportPng();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
