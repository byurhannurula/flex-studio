// Flex Launcher cannot draw a panel behind the row, so the "glass dock" is
// drawn into the wallpaper itself. That only lines up when the row geometry
// here matches the launcher, so stage.js uses rowGeometry() too.

export const W = 1920;
export const H = 1080;

export const DOCK_DEFAULTS = { on: false, blur: 28, tint: '#FFFFFF', tintOpacity: 10, radius: 44, padX: 44, padY: 30, border: 20 };

export function dimPx(value, total) {
  const v = String(value ?? '');
  return v.endsWith('%') ? (parseFloat(v) / 100) * total : parseFloat(v) || 0;
}

/** Row layout in 1920x1080 space for a page of `count` buttons. */
export function rowGeometry(settings, count) {
  const L = settings.Layout;
  const T = settings.Titles;
  const size = L.IconSize;
  const spacing = dimPx(L.IconSpacing, W);
  const rowW = count * size + Math.max(0, count - 1) * spacing;
  const titleH = T.Enabled ? T.Padding + T.FontSize * 1.3 : 0;
  const blockH = size + titleH;
  return { size, spacing, rowW, x0: (W - rowW) / 2, y0: (L.VCenter / 100) * H - blockH / 2, blockH };
}

export const WALL_FX = {
  none: 'None', fade: 'Bottom fade', vignette: 'Vignette', blur: 'Blur', mono: 'Black and white', duotone: 'Duotone',
};
export const WALL_DEFAULTS = { fx: 'none', strength: 60, tint: '#3B5BDB' };

const imageBg = (state) => ['Image', 'Slideshow'].includes(state.settings.Background.Mode);
export const dockActive = (state) => Boolean(state.dock?.on) && imageBg(state);
export const wallFxActive = (state) => (state.wall?.fx || 'none') !== 'none' && imageBg(state);
// True when the studio redraws the wallpapers (plate, effect or both).
export const wallsMade = (state) => dockActive(state) || wallFxActive(state);

// One plate for every menu, sized to the widest page, because the same
// wallpaper shows behind all menus.
export function plateRect(state) {
  const per = Math.max(1, state.settings.Layout.MaxButtons);
  const widest = Math.max(1, ...Object.values(state.menus).map((m) => Math.min(per, m.length)));
  const g = rowGeometry(state.settings, widest);
  const d = state.dock;
  const x = Math.max(0, g.x0 - d.padX);
  const y = Math.max(0, g.y0 - d.padY);
  return { x, y, w: Math.min(W - x, g.rowW + d.padX * 2), h: Math.min(H - y, g.blockH + d.padY * 2) };
}

const rgba = (hex, pct) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${pct / 100})`;
};

const images = new Map();
function loadImage(src) {
  if (!images.has(src)) {
    images.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src.slice(0, 60)}`));
      img.src = src;
    }));
  }
  return images.get(src);
}

// Same crop as CSS "background-size: cover", which is how Flex scales it too.
// grow > 1 overscans, which hides the dark rim a blur pulls in from the edges.
function drawCover(ctx, img, grow = 1) {
  const k = Math.max(W / img.width, H / img.height) * grow;
  const w = img.width * k;
  const h = img.height * k;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

function roundRect(ctx, { x, y, w, h }, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
}

function supportsFilter(ctx) {
  ctx.filter = 'blur(2px)';
  const ok = ctx.filter === 'blur(2px)';
  ctx.filter = 'none';
  return ok;
}

// Fallback for browsers without canvas filters: shrink and scale back up.
function blurredCopy(img, blur) {
  const k = Math.max(1, blur / 3);
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(W / k));
  small.height = Math.max(1, Math.round(H / k));
  const sctx = small.getContext('2d');
  sctx.scale(1 / k, 1 / k);
  drawCover(sctx, img);
  return small;
}

function applyWallFx(ctx, img, wall) {
  const k = wall.strength / 100;
  if (wall.fx === 'blur') {
    const blur = Math.round(4 + k * 36);
    if (supportsFilter(ctx)) {
      ctx.filter = `blur(${blur}px)`;
      drawCover(ctx, img, 1.08);
      ctx.filter = 'none';
    } else {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(blurredCopy(img, blur), 0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, W, H);
  } else if (wall.fx === 'fade') {
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.35 + k * 0.6})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (wall.fx === 'vignette') {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.3 + k * 0.6})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (wall.fx === 'mono' || wall.fx === 'duotone') {
    // Blend modes, not ctx.filter, so this also works in Safari.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, W, H);
    if (wall.fx === 'duotone') {
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.25 + k * 0.75;
      ctx.fillStyle = wall.tint;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/** Return a JPEG data URL of the wallpaper with the effect and the glass plate drawn in. */
export async function composite(src, plate, dock, wall) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, img);
  if (wall && wall.fx !== 'none') applyWallFx(ctx, img, wall);
  if (!plate) return canvas.toDataURL('image/jpeg', 0.9);
  // The plate blurs what is under it, effect included.
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  base.getContext('2d').drawImage(canvas, 0, 0);

  ctx.save();
  roundRect(ctx, plate, dock.radius);
  ctx.clip();
  if (dock.blur > 0) {
    if (supportsFilter(ctx)) {
      ctx.filter = `blur(${dock.blur}px)`;
      ctx.drawImage(base, 0, 0);
      ctx.filter = 'none';
    } else {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(blurredCopy(base, dock.blur), 0, 0, W, H);
    }
  }
  ctx.fillStyle = rgba(dock.tint, dock.tintOpacity);
  ctx.fill();
  ctx.restore();

  if (dock.border > 0) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255,255,255,${dock.border / 100})`;
    roundRect(ctx, { x: plate.x + 1, y: plate.y + 1, w: plate.w - 2, h: plate.h - 2 }, Math.max(0, dock.radius - 1));
    ctx.stroke();
  }
  return canvas.toDataURL('image/jpeg', 0.9);
}
