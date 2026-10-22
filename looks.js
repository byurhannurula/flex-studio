// Layouts and style presets. Both change only visual values: menus,
// hotkeys, launch behaviour and the screensaver stay as the user set them.
import { DOCK_DEFAULTS, WALL_DEFAULTS, rowGeometry, W, H } from './dock.js';
import { FOCUS_FX } from './icons.js';
import { assetPath } from './export.js';

const mockBar = (inner, plate = true) => `<svg viewBox="0 0 120 54" width="100%" height="54" aria-hidden="true">
  ${plate ? '<rect x="8" y="26" width="104" height="20" rx="7" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>' : ''}${inner}</svg>`;
const dots = (y, r, n, x0, step, sel = -1) => Array.from({ length: n }, (_, i) => `<rect x="${x0 + i * step - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.5}" fill="#fff" opacity="${sel < 0 || i === sel ? 1 : 0.55}"/>`).join('');

// Each layout sets a group of values that together give the look.
export const LAYOUTS = {
  row: {
    label: 'Row',
    mock: mockBar(`${dots(32, 7, 4, 30, 20)}<rect x="21" y="23" width="18" height="24" rx="3" fill="rgba(255,255,255,0.25)"/>`, false),
    apply: (s, st) => {
      st.dock.on = false;
      st.look.labelInSelected = false;
      st.look.dimOthers = false;
      s.Titles.Enabled = true;
    },
  },
  dock: {
    label: 'Glass dock',
    mock: mockBar(`${dots(36, 4, 7, 20, 13.3, 2)}<rect x="40" y="48" width="12" height="2" rx="1" fill="#fff"/>`),
    apply: (s, st) => {
      Object.assign(st.dock, { on: true, padX: 48, padY: 34, radius: 46 });
      Object.assign(st.look, { style: 'glyph', labelInSelected: true, dimOthers: true, glyphScale: 0.56 });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      s.Titles.Enabled = false;
      Object.assign(s.Layout, { MaxButtons: 8, IconSize: 170, IconSpacing: '2%', VCenter: 76 });
    },
  },
  dockLabels: {
    label: 'Dock + labels',
    mock: mockBar(`<rect x="12" y="28" width="22" height="16" rx="4" fill="rgba(255,255,255,0.3)"/>${dots(34, 3.5, 5, 23, 19)}${[23, 42, 61, 80, 99].map((x) => `<rect x="${x - 6}" y="40" width="12" height="2" rx="1" fill="#fff" opacity="0.85"/>`).join('')}`),
    apply: (s, st) => {
      // padX must exceed Highlight.HPadding, or the focus box sticks out of the plate.
      Object.assign(st.dock, { on: true, padX: 52, padY: 24, radius: 40 });
      Object.assign(st.look, { style: 'glyph', labelInSelected: false, dimOthers: false, glyphScale: 0.5 });
      st.focus = 'box';
      Object.assign(s.Highlight, { Enabled: true, FillColor: '#FFFFFF', FillOpacity: 14, OutlineSize: 0, CornerRadius: 30, HPadding: 36, VPadding: 14 });
      Object.assign(s.Titles, { Enabled: true, FontSize: 34, Padding: 6, Shadows: false });
      Object.assign(s.Layout, { MaxButtons: 6, IconSize: 130, IconSpacing: '7%', VCenter: 72 });
    },
  },
  list: {
    label: 'List',
    disabled: true,
    mock: mockBar([12, 22, 32, 42].map((y, i) => `<rect x="14" y="${y - 2}" width="${[38, 30, 44, 34][i]}" height="5" rx="2" fill="#fff" opacity="${i === 1 ? 1 : 0.5}"/>`).join(''), false),
  },
};

const WALL = {
  lake: 'andrew-svk-150fZ07GQqs-unsplash.jpg',
  peaks: 'luca-micheli-ruWkmt3nU58-unsplash.jpg',
  coast: 'zetong-li-cgj91Rb_3SM-unsplash.jpg',
};

// Every style starts from this, so values from the last style do not leak in.
// TimeFormat and DateFormat are personal, so they are not touched.
function baseline(s, st) {
  Object.assign(s.Layout, { MaxButtons: 6, IconSize: 200, IconSpacing: '3%', VCenter: 70 });
  Object.assign(s.Titles, { Enabled: true, FontSize: 30, Color: '#FFFFFF', Opacity: 100, Shadows: false, ShadowColor: '#000000', OversizeMode: 'Shrink', Padding: 18 });
  Object.assign(s.Highlight, { Enabled: true, FillColor: '#FFFFFF', FillOpacity: 20, OutlineSize: 0, CornerRadius: 24, HPadding: 24, VPadding: 20 });
  Object.assign(s['Scroll Indicators'], { Enabled: true, FillColor: '#FFFFFF', OutlineSize: 0, Opacity: 50 });
  Object.assign(s.Clock, { Enabled: true, ShowDate: false, Alignment: 'Left', FontSize: 56, FontColor: '#FFFFFF', Shadows: false, ShadowColor: '#000000', Opacity: 100, Margin: '5%' });
  Object.assign(s.Background, { Overlay: true, OverlayColor: '#000000', OverlayOpacity: 35 });
  s.Titles.Font = assetPath(st, 'fonts', 'Inter-Regular.ttf');
  s.Clock.Font = s.Titles.Font;
  st.look = { style: 'glass', radius: 0.24, glyphScale: 0.42, labelInSelected: false, dimOthers: false, shape: 'rounded', focusFx: 'fill' };
  st.dock = { ...DOCK_DEFAULTS };
  st.wall = { ...WALL_DEFAULTS };
  st.focus = 'box';
}

export const STYLES = {
  classic: {
    label: 'Classic',
    desc: 'Glass tiles, highlight box, slideshow',
    layout: 'row',
    bg: 'slideshow',
    apply: (s) => {
      s.Clock.ShowDate = true;
      s.Background.OverlayOpacity = 45;
    },
  },
  glassDock: {
    label: 'Glass dock',
    desc: 'Logos on a glass plate, label on focus',
    layout: 'dock',
    bg: WALL.coast,
    apply: (s) => {
      s.Background.OverlayOpacity = 18;
    },
  },
  dockLabels: {
    label: 'Dock + labels',
    desc: 'Logos and names on a plate',
    layout: 'dockLabels',
    bg: WALL.peaks,
    apply: (s) => {
      s.Background.OverlayOpacity = 22;
    },
  },
  bold: {
    label: 'Bold tiles',
    desc: 'Big brand-colour tiles, white focus',
    layout: 'row',
    bg: WALL.lake,
    apply: (s, st) => {
      Object.assign(st.look, { style: 'brand', radius: 0.26, glyphScale: 0.46 });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Layout, { MaxButtons: 5, IconSize: 240, IconSpacing: '3%', VCenter: 62 });
      Object.assign(s.Titles, { FontSize: 32, Shadows: true });
      Object.assign(s.Clock, { Alignment: 'Right', ShowDate: true });
      s.Background.OverlayOpacity = 30;
    },
  },
  minimal: {
    label: 'Minimal',
    desc: 'Logos only, name on focus, low row',
    layout: 'row',
    bg: 'slideshow',
    apply: (s, st) => {
      Object.assign(st.look, { style: 'glyph', glyphScale: 0.6, labelInSelected: true, dimOthers: true });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      s.Titles.Enabled = false;
      Object.assign(s.Layout, { MaxButtons: 7, IconSize: 150, IconSpacing: '4%', VCenter: 80 });
      Object.assign(s.Clock, { Alignment: 'Right', FontSize: 64 });
      s.Background.OverlayOpacity = 50;
    },
  },
  night: {
    label: 'Night',
    desc: 'Dark tiles on a plain dark screen',
    layout: 'row',
    bg: '#0B0D12',
    apply: (s, st) => {
      Object.assign(st.look, { style: 'dark', radius: 0.22 });
      st.focus = 'both';
      Object.assign(s.Highlight, { FillOpacity: 10, CornerRadius: 30, HPadding: 22, VPadding: 18 });
      Object.assign(s.Layout, { IconSize: 190, VCenter: 62 });
      Object.assign(s.Titles, { Opacity: 80, FontSize: 28 });
      s.Clock.ShowDate = true;
      s.Background.Overlay = false;
    },
  },
  daylight: {
    label: 'Daylight',
    desc: 'Light frosted tiles on a bright photo',
    layout: 'row',
    bg: WALL.peaks,
    apply: (s, st) => {
      Object.assign(st.look, { style: 'light', radius: 0.24 });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Titles, { Shadows: true, ShadowColor: '#000000' });
      Object.assign(s.Clock, { ShowDate: true, Shadows: true });
      s.Background.OverlayOpacity = 12;
    },
  },
  neon: {
    label: 'Neon',
    desc: 'Dark tiles, brand-colour glow on focus',
    layout: 'row',
    bg: '#07060C',
    apply: (s, st) => {
      Object.assign(st.look, { style: 'dark', radius: 0.26, glyphScale: 0.46, focusFx: 'glow' });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Layout, { IconSize: 210, IconSpacing: '2.5%', VCenter: 60 });
      Object.assign(s.Titles, { Opacity: 75, FontSize: 28, Padding: 10 });
      s.Clock.ShowDate = true;
      s.Background.Overlay = false;
    },
  },
  circles: {
    label: 'Circles',
    desc: 'Round brand tiles, ring on focus',
    layout: 'row',
    bg: WALL.lake,
    wall: { fx: 'vignette', strength: 55 },
    apply: (s, st) => {
      Object.assign(st.look, { style: 'brand', shape: 'circle', glyphScale: 0.44, focusFx: 'ring' });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Layout, { MaxButtons: 6, IconSize: 200, IconSpacing: '3%', VCenter: 64 });
      Object.assign(s.Titles, { FontSize: 30, Shadows: true, Padding: 12 });
      s.Background.OverlayOpacity = 15;
    },
  },
  cinema: {
    label: 'Cinema',
    desc: 'Dark fade at the bottom, logos grow on focus',
    layout: 'row',
    bg: WALL.coast,
    wall: { fx: 'fade', strength: 85 },
    apply: (s, st) => {
      Object.assign(st.look, { style: 'glyph', glyphScale: 0.5, focusFx: 'grow', labelInSelected: true, dimOthers: true });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      s.Titles.Enabled = false;
      Object.assign(s.Layout, { MaxButtons: 7, IconSize: 180, IconSpacing: '2.5%', VCenter: 80 });
      Object.assign(s.Clock, { Alignment: 'Right', ShowDate: true });
      s.Background.OverlayOpacity = 10;
    },
  },
  mono: {
    label: 'Mono',
    desc: 'Black and white, colour only on focus',
    layout: 'row',
    bg: 'slideshow',
    wall: { fx: 'mono' },
    apply: (s, st) => {
      Object.assign(st.look, { style: 'mono', shape: 'squircle', glyphScale: 0.46, focusFx: 'brand', dimOthers: false });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Layout, { IconSize: 190, IconSpacing: '3%', VCenter: 66 });
      Object.assign(s.Titles, { Color: '#D4D4D8', FontSize: 28 });
      s.Background.OverlayOpacity = 40;
    },
  },
  frosted: {
    label: 'Frosted',
    desc: 'Blurred wallpaper, light tiles, bar on focus',
    layout: 'row',
    bg: WALL.peaks,
    wall: { fx: 'blur', strength: 55 },
    apply: (s, st) => {
      Object.assign(st.look, { style: 'light', shape: 'squircle', glyphScale: 0.44, focusFx: 'bar' });
      st.focus = 'icon';
      s.Highlight.Enabled = false;
      Object.assign(s.Layout, { IconSize: 200, IconSpacing: '3%', VCenter: 62 });
      Object.assign(s.Titles, { Shadows: true, Padding: 26 });
      Object.assign(s.Clock, { ShowDate: true, Shadows: true });
      s.Background.OverlayOpacity = 8;
    },
  },
};

/** Apply a style to state in place. */
export function applyStyle(state, id) {
  const p = STYLES[id];
  const s = state.settings;
  baseline(s, state);
  LAYOUTS[p.layout].apply(s, state);
  state.layout = p.layout;
  p.apply(s, state);
  Object.assign(state.wall, p.wall);
  if (p.bg === 'slideshow') {
    s.Background.Mode = 'Slideshow';
    s.Background.SlideshowDirectory = assetPath(state, 'bg');
  } else if (p.bg.startsWith('#')) {
    s.Background.Mode = 'Color';
    s.Background.Color = p.bg;
  } else {
    s.Background.Mode = 'Image';
    s.Background.Image = assetPath(state, 'bg', p.bg);
  }
  state.style = id;
}

const TILE = {
  glass: 'rgba(255,255,255,0.22)', dark: 'rgba(12,12,16,0.85)', light: 'rgba(255,255,255,0.78)', mono: 'rgba(255,255,255,0.12)', glyph: null,
};
const BRAND_FILLS = ['#17B2E7', '#FF0000', '#AA5CC3', '#E50914', '#00A8E1', '#1DB954', '#9146FF'];

/** Small SVG drawing of what a style looks like, from its real settings. */
export function styleThumb(st) {
  const s = st.settings;
  const k = 160 / W;
  const n = Math.min(s.Layout.MaxButtons, 6);
  const g = rowGeometry(s, n);
  const sz = g.size * k;
  const out = [];
  const defs = [];
  const fxWall = st.wall?.fx || 'none';
  if (fxWall === 'fade') {
    defs.push('<linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>');
    out.push('<rect width="160" height="90" fill="url(#fd)"/>');
  } else if (fxWall === 'vignette') {
    defs.push('<radialGradient id="vg" cx="0.5" cy="0.5" r="0.7"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>');
    out.push('<rect width="160" height="90" fill="url(#vg)"/>');
  } else if (fxWall === 'duotone') {
    out.push(`<rect width="160" height="90" fill="${st.wall.tint}" opacity="0.4"/>`);
  }
  if (s.Background.Overlay) out.push(`<rect width="160" height="90" fill="${s.Background.OverlayColor}" opacity="${s.Background.OverlayOpacity / 100}"/>`);
  if (st.dock.on) {
    const d = st.dock;
    out.push(`<rect x="${(g.x0 - d.padX) * k}" y="${(g.y0 - d.padY) * k}" width="${(g.rowW + d.padX * 2) * k}" height="${(g.blockH + d.padY * 2) * k}" rx="${d.radius * k}" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>`);
  }
  if (s.Clock.Enabled) {
    const cw = s.Clock.ShowDate ? 26 : 14;
    const m = 7;
    out.push(`<rect x="${s.Clock.Alignment === 'Right' ? 160 - m - cw : m}" y="${m}" width="${cw}" height="${Math.max(2.5, s.Clock.FontSize * k * 0.8)}" rx="1" fill="#fff" opacity="0.9"/>`);
  }
  const sel = 0;
  const fx = FOCUS_FX[st.look.focusFx] ? st.look.focusFx : 'fill';
  const shapeR = (w) => (st.look.shape === 'circle' ? w / 2 : st.look.shape === 'squircle' ? w * 0.3 : w * st.look.radius / 0.9);
  for (let i = 0; i < n; i++) {
    const x = (g.x0 + i * (g.size + g.spacing)) * k;
    const y = g.y0 * k;
    const on = i === sel;
    if (on && s.Highlight.Enabled) {
      out.push(`<rect x="${x - s.Highlight.HPadding * k}" y="${y - s.Highlight.VPadding * k}" width="${sz + s.Highlight.HPadding * 2 * k}" height="${g.blockH * k + s.Highlight.VPadding * 2 * k}" rx="${s.Highlight.CornerRadius * k}" fill="${s.Highlight.FillColor}" opacity="${s.Highlight.FillOpacity / 100}"/>`);
    }
    const iconSel = on && st.focus !== 'box';
    const ins = FOCUS_FX[fx].inset[iconSel ? 1 : 0];
    const tw = sz * (1 - ins * 2);
    const tx = x + sz * ins;
    const ty = y + sz * ins;
    const brandFill = BRAND_FILLS[i % BRAND_FILLS.length];
    let tile = st.look.style === 'brand' ? brandFill : TILE[st.look.style];
    if (iconSel && fx === 'fill' && st.look.style !== 'glyph') tile = '#fff';
    if (iconSel && fx === 'brand') tile = brandFill;
    const dim = !on && st.look.dimOthers ? 0.5 : 1;
    if (iconSel && fx === 'glow') out.push(`<rect x="${tx - 1.5}" y="${ty - 1.5}" width="${tw + 3}" height="${tw + 3}" rx="${shapeR(tw + 3)}" fill="${brandFill}" opacity="0.6"/>`);
    if (tile) out.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${tw}" rx="${shapeR(tw)}" fill="${tile}" opacity="${dim}"/>`);
    if (iconSel && fx === 'ring') out.push(`<rect x="${tx - 1.2}" y="${ty - 1.2}" width="${tw + 2.4}" height="${tw + 2.4}" rx="${shapeR(tw + 2.4)}" fill="none" stroke="#fff" stroke-width="0.7"/>`);
    if (iconSel && fx === 'bar') out.push(`<rect x="${x + sz * 0.35}" y="${y + sz * 0.93}" width="${sz * 0.3}" height="1" rx="0.5" fill="#fff"/>`);
    const gs = (tw / 0.9) * st.look.glyphScale;
    const darkGlyph = (iconSel && fx === 'fill' && st.look.style !== 'glyph') || (st.look.style === 'light' && !(iconSel && fx === 'brand'));
    const glyph = darkGlyph ? '#111' : st.look.style === 'mono' && !iconSel ? '#9A9AA2' : '#fff';
    const lift = iconSel && st.look.labelInSelected ? sz * 0.12 : 0;
    out.push(`<rect x="${x + (sz - gs) / 2}" y="${y + (sz - gs) / 2 - lift}" width="${gs}" height="${gs}" rx="${gs * 0.3}" fill="${glyph}" opacity="${dim}"/>`);
    if (iconSel && st.look.labelInSelected) out.push(`<rect x="${x + sz * 0.25}" y="${y + sz * 0.84}" width="${sz * 0.5}" height="1.4" rx="0.7" fill="${glyph}"/>`);
    if (s.Titles.Enabled) out.push(`<rect x="${x + sz * 0.2}" y="${y + sz + s.Titles.Padding * k}" width="${sz * 0.6}" height="${Math.max(1.4, s.Titles.FontSize * k * 0.6)}" rx="0.7" fill="${s.Titles.Color}" opacity="${(s.Titles.Opacity / 100) * 0.9}"/>`);
  }
  return `<svg viewBox="0 0 160 90" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${out.join('')}</svg>`;
}

/** CSS filter for the thumbnail wallpaper, to match blur and black-and-white effects. */
export const styleFilter = (st) => ({ blur: 'blur(3px)', mono: 'grayscale(1)', duotone: 'grayscale(1)' }[st.wall?.fx] || 'none');

export const styleBackground = (st) => {
  const b = st.settings.Background;
  if (b.Mode === 'Color') return b.Color;
  const file = b.Mode === 'Image' ? (b.Image || '').split('/').pop() : WALL.lake;
  return `center / cover no-repeat url("assets/bg/${file}")`;
};
