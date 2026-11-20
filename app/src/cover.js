// Vice Cover Studio — the cover renderer.
// Draws a GTA-poster-style multi-panel cover entirely in code: a gradient
// sunset sky, a striped sun, halftone dots, a skyline and palm silhouettes,
// photo panels with bold comic frames, and big condensed caption lettering.
// Every visual except the user's own photos is drawn here; no image, font
// or other asset is fetched from the network.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  post: { label: 'Post 1080 x 1350', w: 1080, h: 1350 },
  story: { label: 'Story 1080 x 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export const THEMES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#1d0b3d', '#6d1a63', '#d92b6a', '#ff7a3d', '#ffc93d'],
    sunCore: '#fff3b0',
    sunEdge: '#ff7b3d',
    skyline: '#221036',
    palm: '#150826',
    band: 'rgba(20, 6, 34, 0.72)',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#05031a', '#1c0b4d', '#4a148c', '#a4138e', '#ff2e88'],
    sunCore: '#c8fff4',
    sunEdge: '#2ee6ff',
    skyline: '#0d0524',
    palm: '#05021a',
    band: 'rgba(6, 2, 26, 0.78)',
    accent: '#2ee6ff',
  },
  golden: {
    label: 'Golden Hour',
    sky: ['#3d1503', '#8a2f10', '#e05e1f', '#ffab2e', '#ffe066'],
    sunCore: '#fffbe0',
    sunEdge: '#ff9e2e',
    skyline: '#33150a',
    palm: '#220d04',
    band: 'rgba(43, 18, 2, 0.72)',
    accent: '#ffe066',
  },
};

/** Rounded-rectangle path helper. */
function rrect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

/** The sunset sky: vertical gradient bands. */
function drawSky(ctx, w, h, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  theme.sky.forEach((c, i) => g.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Retro striped sun: a glowing disc with horizontal cuts in its lower half. */
function drawSun(ctx, cx, cy, r, theme) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, theme.sunCore);
  g.addColorStop(1, theme.sunEdge);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Cut horizontal slots out of the lower half, widening toward the bottom.
  ctx.fillStyle = theme.sky[2];
  let y = cy + r * 0.08;
  let gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap *= 1.5;
  }
  ctx.restore();
}

/** Halftone dots: rows of dots whose radius grows toward the bottom. */
function drawHalftone(ctx, x, y, w, h, color, maxR, step) {
  ctx.fillStyle = color;
  const rows = Math.floor(h / step);
  for (let row = 0; row <= rows; row++) {
    const yy = y + row * step;
    const t = row / Math.max(1, rows);
    const r = Math.max(0.6, maxR * t);
    const off = (row % 2) * step * 0.5;
    for (let xx = x + off; xx <= x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A jagged city skyline along the horizon, with a few lit windows. */
function drawSkyline(ctx, w, yBase, h, theme, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.fillStyle = theme.skyline;
  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.04 + rnd() * 0.07);
    const bh = h * (0.25 + rnd() * 0.75);
    ctx.fillRect(x, yBase - bh, bw, bh + 2);
    // Antenna on some towers.
    if (rnd() > 0.6) ctx.fillRect(x + bw / 2 - 1.5, yBase - bh - h * 0.12, 3, h * 0.12);
    x += bw + w * 0.008;
  }
  // Lit windows: tiny warm dots scattered on the towers.
  ctx.fillStyle = 'rgba(255, 214, 110, 0.85)';
  for (let i = 0; i < 90; i++) {
    const wx = rnd() * w;
    const wy = yBase - rnd() * h * 0.85;
    ctx.fillRect(wx, wy, 3, 4);
  }
}

/** One palm silhouette: a leaning trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, scale, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a leaning curve, thicker at the base.
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 40, -90, lean * 70, -165);
  ctx.stroke();
  const topX = lean * 70;
  const topY = -165;
  // Fronds: arcs fanning out from the crown, each a tapered leaf shape.
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = 95 - Math.abs(i - 3) * 12;
    const fx = topX + Math.cos(a) * len;
    const fy = topY - Math.sin(a) * len * 0.55 + 34;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.55, topY - Math.sin(a) * len * 0.75, fx, fy);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - 8, topY + 6, 7, 0, Math.PI * 2);
  ctx.arc(topX + 9, topY + 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fills a panel with a photo using cover-fit plus the user's zoom and pan. */
function drawPhotoIn(ctx, photo, rect, crop) {
  const { x, y, w, h } = rect;
  ctx.save();
  rrect(ctx, x, y, w, h, 8);
  ctx.clip();
  if (!photo) {
    // No photo yet: diagonal sunset stripes over a dark fill.
    ctx.fillStyle = '#2a1245';
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-Math.PI / 5);
    const stripes = ['#ff7a3d', '#d92b6a', '#ffd166'];
    for (let i = -6; i < 7; i++) {
      ctx.fillStyle = stripes[((i % 3) + 3) % 3];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(i * 46, -h, 24, h * 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    drawHalftone(ctx, x, y + h * 0.55, w, h * 0.45, 'rgba(255,255,255,0.25)', 5, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `700 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }
  const zoom = crop?.zoom ?? 1;
  const dx = crop?.dx ?? 0;
  const dy = crop?.dy ?? 0;
  const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * base;
  const ph = photo.naturalHeight * base;
  ctx.drawImage(photo, x + (w - pw) / 2 + dx * w, y + (h - ph) / 2 + dy * h, pw, ph);
  // A warm grade over the photo so the panels sit in the same sunset world.
  const grade = ctx.createLinearGradient(0, y, 0, y + h);
  grade.addColorStop(0, 'rgba(255, 122, 61, 0.05)');
  grade.addColorStop(1, 'rgba(217, 43, 106, 0.28)');
  ctx.fillStyle = grade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Comic frame: white keyline, then a thick black border, slight rotation. */
function framePanel(ctx, rect, rot, theme) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(rot);
  ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  rrect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#12061f';
  rrect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.stroke();
  ctx.restore();
}

/**
 * Panel layout for a canvas of w x h.
 * Portrait/square: hero on top, two small panels in a row, caption band at foot.
 * Landscape: hero left, two small panels stacked right, caption band at foot.
 */
function layout(w, h) {
  const m = Math.round(w * 0.033);
  const band = Math.round(h * 0.155);
  const bodyH = h - band - m * 2;
  const panels = [];
  if (w <= h) {
    const heroH = Math.round(bodyH * 0.64);
    const smallH = bodyH - heroH - m;
    const smallW = Math.round((w - m * 3) / 2);
    panels.push({ x: m, y: m, w: w - m * 2, h: heroH, rot: 0 });
    panels.push({ x: m, y: m + heroH + m, w: smallW, h: smallH, rot: -0.018 });
    panels.push({ x: m * 2 + smallW, y: m + heroH + m, w: smallW, h: smallH, rot: 0.016 });
  } else {
    const heroW = Math.round((w - m * 3) * 0.6);
    const rightW = w - m * 3 - heroW;
    const smallH = Math.round((bodyH - m) / 2);
    panels.push({ x: m, y: m, w: heroW, h: bodyH, rot: 0 });
    panels.push({ x: m * 2 + heroW, y: m, w: rightW, h: smallH, rot: 0.014 });
    panels.push({ x: m * 2 + heroW, y: m + smallH + m, w: rightW, h: smallH, rot: -0.013 });
  }
  return { panels, bandY: h - band, bandH: band, margin: m };
}

/** Big condensed caption with a black outline, slightly tilted. */
function drawCaption(ctx, w, h, bandY, bandH, caption, sub, theme) {
  const text = (caption || '').trim().toUpperCase();
  const m = Math.round(w * 0.033);
  ctx.save();
  // Dark band so the words read on any sky.
  const bg = ctx.createLinearGradient(0, bandY, 0, h);
  bg.addColorStop(0, 'rgba(18, 6, 31, 0)');
  bg.addColorStop(0.25, theme.band);
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, w, h - bandY);
  if (!text) { ctx.restore(); return; }
  const cx = w / 2;
  const cy = bandY + bandH * 0.52;
  let size = Math.round(bandH * 0.52);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = () => { ctx.font = `${size}px Anton, 'Arial Black', sans-serif`; };
  setFont();
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '2px';
  while (ctx.measureText(text).width > w - m * 3 && size > 20) {
    size -= 3;
    setFont();
  }
  ctx.translate(cx, cy);
  ctx.rotate(-0.022);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(6, size / 9);
  ctx.strokeStyle = '#12061f';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // Sub-caption: small letterspaced line in the accent colour.
  const subText = (sub || '').trim();
  if (subText) {
    ctx.save();
    ctx.font = `700 ${Math.max(18, Math.round(bandH * 0.16))}px system-ui, sans-serif`;
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accent;
    ctx.fillText(subText.toUpperCase(), w / 2, bandY + bandH * 0.85);
    ctx.restore();
  }
}

/** Small brand tag in the top-left corner, my own mark, not a game logo. */
function drawTag(ctx, w, theme) {
  const label = 'VICE COVER STUDIO';
  ctx.save();
  ctx.translate(26, 30);
  ctx.rotate(-0.03);
  ctx.font = `${Math.round(w * 0.016) + 14}px Anton, 'Arial Black', sans-serif`;
  const tw = ctx.measureText(label).width + 28;
  const th = Math.round(w * 0.016) + 30;
  ctx.fillStyle = '#12061f';
  rrect(ctx, 0, 0, tw, th, 6);
  ctx.fill();
  ctx.fillStyle = theme.accent;
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 14, th / 2 + 1);
  ctx.restore();
}

/**
 * Draws the whole cover.
 * `state`: { photos: [img|null, img|null, img|null],
 *   crops: [{zoom, dx, dy} x3], caption, sub, theme }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const { panels, bandY, bandH } = layout(w, h);

  drawSky(ctx, w, h, theme);
  // Sun sits behind the hero panel, peeking out top-right.
  drawSun(ctx, w * 0.74, h * 0.16, Math.min(w, h) * 0.17, theme);
  drawHalftone(ctx, 0, h * 0.42, w, h * 0.2, 'rgba(255,255,255,0.16)', 6, 22);
  // Skyline along the bottom, behind the caption band.
  drawSkyline(ctx, w, h - bandH * 0.35, bandH, theme, 1234567);
  // Palms frame the sky at the edges, behind the panels.
  drawPalm(ctx, w * 0.02, h * 0.42, Math.min(w, h) / 620, 0.5, theme.palm);
  drawPalm(ctx, w * 0.99, h * 0.38, Math.min(w, h) / 700, -0.6, theme.palm);

  // Panels: photo first, then the frame on top (rotation applied to both).
  panels.forEach((p, i) => {
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(p.rot);
    ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
    drawPhotoIn(ctx, state.photos[i] ?? null, p, state.crops[i]);
    ctx.restore();
    framePanel(ctx, p, p.rot, theme);
  });

  drawTag(ctx, w, theme);
  drawCaption(ctx, w, h, bandY, bandH, state.caption, state.sub, theme);
}
