import { BRANDS } from './brands.js';
import { GLYPHS, FILLED_GLYPHS } from './glyphs.js';

// Each style has a normal and a "_selected" look. Flex Launcher shows
// <name>_selected.png for the highlighted entry, which allows a focused tile
// without the highlight box.
export const ICON_STYLES = {
  glass: { label: 'Glass', tile: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.28)', glyph: '#FFFFFF', selTile: '#FFFFFF', selGlyph: '#111111' },
  dark: { label: 'Dark', tile: 'rgba(14,14,18,0.80)', border: 'rgba(255,255,255,0.08)', glyph: '#F4F4F5', selTile: '#FFFFFF', selGlyph: '#111111' },
  light: { label: 'Light', tile: 'rgba(255,255,255,0.66)', border: 'rgba(255,255,255,0.9)', glyph: '#1C1C1E', selTile: '#FFFFFF', selGlyph: '#000000', shadow: true },
  brand: { label: 'Brand', tile: 'brand', border: 'rgba(255,255,255,0.10)', glyph: 'auto', selTile: '#FFFFFF', selGlyph: 'brand' },
  outline: { label: 'Outline', tile: 'rgba(0,0,0,0.14)', border: 'rgba(255,255,255,0.8)', borderW: 0.012, glyph: '#FFFFFF', selTile: '#FFFFFF', selGlyph: '#111111' },
  // The app name in place of a logo.
  label: { label: 'Label only', tile: null, glyph: '#FFFFFF', selTile: null, selGlyph: '#FFFFFF', text: true },
  mono: { label: 'Mono', tile: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.14)', glyph: '#9A9AA2', selTile: '#FFFFFF', selGlyph: '#111111' },
  glyph: { label: 'Glyph only', tile: null, glyph: '#FFFFFF', selTile: null, selGlyph: '#FFFFFF' },
};

function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function brandColour(icon) {
  const hex = icon.kind === 'brand' ? BRANDS[icon.ref]?.hex : '';
  // Simple Icons lists black for many brands; on a tile that reads as empty.
  return hex && hex !== '#000000' ? hex : '#2A2A30';
}

// Wordmark logos fill the width but only a thin band of the 24x24 box, so they
// read as tiny next to square logos.
const WIDE_BRANDS = { primevideo: 1.45, youtubetv: 1.45, hbo: 1.2, appletv: 1.2, plex: 1.2 };

function glyphMarkup(icon, colour, box, offset, title, dy = 0) {
  const grow = icon.kind === 'brand' ? WIDE_BRANDS[icon.ref] || 1 : 1;
  offset -= (box * (grow - 1)) / 2;
  box *= grow;
  const scale = box / 24;
  const t = `translate(${offset} ${offset + dy}) scale(${scale})`;
  if (icon.kind === 'brand' && BRANDS[icon.ref]) {
    return `<path transform="${t}" fill="${colour}" d="${BRANDS[icon.ref].path}"/>`;
  }
  if (icon.kind === 'glyph' && GLYPHS[icon.ref]) {
    const filled = FILLED_GLYPHS.has(icon.ref);
    return filled
      ? `<path transform="${t}" fill="${colour}" d="${GLYPHS[icon.ref]}"/>`
      : `<path transform="${t}" fill="none" stroke="${colour}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="${GLYPHS[icon.ref]}"/>`;
  }
  const letter = esc((title || '?').trim().charAt(0).toUpperCase());
  const mid = offset + box / 2;
  return `<text x="${mid}" y="${mid + dy}" fill="${colour}" font-family="Helvetica, Arial, sans-serif" font-size="${box * 0.9}" font-weight="600" text-anchor="middle" dominant-baseline="central">${letter}</text>`;
}

// Split a long title over two lines at the space nearest the middle.
function titleLines(title) {
  const s = String(title || '?').trim();
  if (s.length <= 10 || !s.includes(' ')) return [s];
  let best = -1;
  for (let i = 0; i < s.length; i++) if (s[i] === ' ' && (best < 0 || Math.abs(i - s.length / 2) < Math.abs(best - s.length / 2))) best = i;
  return [s.slice(0, best), s.slice(best + 1)];
}

function textBlock(title, size, width) {
  const lines = titleLines(title);
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fs = Math.min(size * 0.17, width / (longest * 0.56));
  return { lines, fs, w: longest * fs * 0.56, h: lines.length * fs * 1.15 };
}

export const SHAPES = { rounded: 'Rounded', squircle: 'Squircle', circle: 'Circle' };

// What the _selected.png adds. Effects that draw outside the tile (ring, glow)
// need a smaller tile in both icons, so the row does not jump on focus.
export const FOCUS_FX = {
  fill: { label: 'Fill', inset: [0.05, 0.05] },
  brand: { label: 'Brand fill', inset: [0.05, 0.05] },
  grow: { label: 'Grow', inset: [0.13, 0.03] },
  ring: { label: 'Ring', inset: [0.11, 0.11] },
  glow: { label: 'Glow', inset: [0.14, 0.14] },
  bar: { label: 'Bar', inset: [0.1, 0.1] },
  pill: { label: 'Soft box', inset: [0.05, 0.05] },
};

// Superellipse, sampled, because SVG has no squircle primitive.
function squirclePath(x, y, w, n = 5) {
  const r = w / 2;
  const pts = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push(`${(x + r + Math.sign(c) * Math.abs(c) ** (2 / n) * r).toFixed(2)} ${(y + r + Math.sign(s) * Math.abs(s) ** (2 / n) * r).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

function shapeEl(shape, x, y, w, r, attrs) {
  if (shape === 'squircle') return `<path d="${squirclePath(x, y, w)}" ${attrs}/>`;
  const rx = shape === 'circle' ? w / 2 : Math.min(r, w / 2);
  return `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${rx}" ${attrs}/>`;
}

/**
 * Build the SVG for one icon.
 * @param {{kind: string, ref?: string}} icon
 * @param {{style: string, radius: number, glyphScale: number, shape?: string, focusFx?: string, labelInSelected?: boolean, dimOthers?: boolean}} look
 *   radius and glyphScale are fractions of the size. labelInSelected draws the
 *   title inside the _selected icon, because Flex Launcher shows titles for every
 *   entry or for none.
 */
export function iconSvg(icon, look, { size, selected = false, title = '' }) {
  const style = ICON_STYLES[look.style] || ICON_STYLES.glass;
  const shape = look.shape || 'rounded';
  const fxId = FOCUS_FX[look.focusFx] ? look.focusFx : 'fill';
  const fx = selected ? fxId : '';
  const inset = Math.round(size * FOCUS_FX[fxId].inset[selected ? 1 : 0]);
  const tileSize = size - inset * 2;
  // Sizes below were tuned for a tile of 0.9 x size; keep the same proportions.
  const unit = tileSize / 0.9;
  const radius = Math.round(unit * look.radius);
  const withLabel = selected && look.labelInSelected && title;
  const box = Math.round(unit * look.glyphScale * (withLabel ? 0.7 : 1));
  const offset = (size - box) / 2;
  const dy = withLabel ? -unit * 0.13 : 0;
  const brand = brandColour(icon);

  const recolour = fx === 'fill' || fx === 'brand';
  let tileFill = recolour ? style.selTile : style.tile;
  if (fx === 'brand') tileFill = brand;
  if (tileFill === 'brand') tileFill = brand;
  let glyph = recolour ? style.selGlyph : style.glyph;
  if (fx === 'brand') glyph = 'auto';
  if (glyph === 'brand') glyph = brand === '#2A2A30' ? '#111111' : brand;
  if (glyph === 'auto') glyph = tileFill && luminance(tileFill) > 0.55 ? '#111111' : '#FFFFFF';

  const defs = [];
  const shadow = (style.shadow || recolour) && tileFill;
  if (shadow) defs.push(`<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${size * 0.012}" stdDeviation="${size * 0.02}" flood-color="#000" flood-opacity="${recolour ? 0.35 : 0.18}"/></filter>`);
  const parts = [];
  if (fx === 'glow') {
    const glow = brand === '#2A2A30' ? '#FFFFFF' : brand;
    const spread = size * 0.03;
    defs.push(`<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(size * 0.04).toFixed(1)}"/></filter>`);
    // Two passes: one blur alone fades too much under an opaque tile.
    const halo = shapeEl(shape, inset - spread, inset - spread, tileSize + spread * 2, radius + spread, `fill="${glow}" filter="url(#g)"`);
    parts.push(halo, halo);
  }
  if (tileFill) {
    parts.push(shapeEl(shape, inset, inset, tileSize, radius, `fill="${tileFill}"${shadow ? ' filter="url(#s)"' : ''}`));
    if (style.border && !recolour) {
      const bw = Math.max(1.5, size * (style.borderW || 0));
      parts.push(shapeEl(shape, inset + bw / 2, inset + bw / 2, tileSize - bw, Math.max(0, radius - bw / 2), `fill="none" stroke="${style.border}" stroke-width="${bw.toFixed(1)}"`));
    }
  }
  if (fx === 'glow') {
    const glow = brand === '#2A2A30' ? '#FFFFFF' : brand;
    parts.push(shapeEl(shape, inset + 1, inset + 1, tileSize - 2, Math.max(0, radius - 1), `fill="none" stroke="${glow}" stroke-width="2"`));
  }
  if (fx === 'ring') {
    const gap = size * 0.045;
    const sw = size * 0.022;
    parts.push(shapeEl(shape, inset - gap, inset - gap, tileSize + gap * 2, radius + gap, `fill="none" stroke="#FFFFFF" stroke-width="${sw.toFixed(1)}"`));
  }
  const text = style.text ? textBlock(title, size, tileSize * 0.94) : null;
  if (fx === 'pill') {
    const w = text ? Math.min(size * 0.98, text.w + size * 0.14) : tileSize * 0.86;
    const h = text ? text.h + size * 0.1 : tileSize * 0.86;
    parts.push(`<rect x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" rx="${Math.min(h / 2, size * 0.08)}" fill="#FFFFFF" fill-opacity="0.2"/>`);
  }
  if (fx === 'bar') {
    const bw = size * 0.3;
    parts.push(`<rect x="${(size - bw) / 2}" y="${size * 0.93}" width="${bw}" height="${size * 0.035}" rx="${size * 0.0175}" fill="#FFFFFF"/>`);
  }
  let label = '';
  if (withLabel) {
    // Fonts on the page are not visible inside an SVG <img>, so use system fonts.
    const fs = Math.min(unit * 0.19, (tileSize * 0.96) / Math.max(1, title.length * 0.56));
    label = `<text x="${size / 2}" y="${inset + unit * 0.86}" fill="${glyph}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${fs.toFixed(1)}" font-weight="600" text-anchor="middle">${esc(title)}</text>`;
  }
  const mark = text
    ? `<text x="${size / 2}" y="${size / 2 - text.h / 2 + text.fs * 0.88}" fill="${glyph}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${text.fs.toFixed(1)}" font-weight="600" text-anchor="middle">${text.lines.map((l, i) => `<tspan x="${size / 2}" dy="${i ? text.fs * 1.15 : 0}">${esc(l)}</tspan>`).join('')}</text>`
    : glyphMarkup(icon, glyph, box, offset, title, dy);
  const body = `${parts.join('')}${mark}${text ? '' : label}`;
  const dim = !selected && look.dimOthers ? ' opacity="0.5"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}<g${dim}>${body}</g></svg>`;
}

export const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function rasterize(src, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, 0, 0, size, size);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('Could not load icon image'));
    img.src = src;
  });
}
