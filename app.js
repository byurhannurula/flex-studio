import { SCHEMA, parseIni, defaultSettings } from './ini.js';
import { CATALOG, CATALOG_BY_ID, matchCatalog } from './catalog.js';
import { BRANDS } from './brands.js';
import { GLYPHS } from './glyphs.js';
import { ICON_STYLES, SHAPES, FOCUS_FX, iconSvg, svgUrl } from './icons.js';
import { PRESETS, BOX_FACTS } from './presets.js';
import { runChecks } from './checks.js';
import { configText, exportBundle, download, assetPath } from './export.js';
import { Stage, FONT_FILES, sdlKeycode, keyLabel } from './stage.js';
import { DOCK_DEFAULTS, WALL_DEFAULTS, WALL_FX, dockActive, wallsMade, plateRect, composite } from './dock.js';
import { LAYOUTS, STYLES, applyStyle, styleThumb, styleBackground, styleFilter } from './looks.js';

const STORE = 'flex-studio:v1';
const THEME_STORE = 'flex-studio:theme';
const BUILTIN_WALLS = [
  { file: 'andrew-svk-150fZ07GQqs-unsplash.jpg', name: 'Lake', src: 'assets/bg/andrew-svk-150fZ07GQqs-unsplash.jpg' },
  { file: 'luca-micheli-ruWkmt3nU58-unsplash.jpg', name: 'Peaks', src: 'assets/bg/luca-micheli-ruWkmt3nU58-unsplash.jpg' },
  { file: 'zetong-li-cgj91Rb_3SM-unsplash.jpg', name: 'Coast', src: 'assets/bg/zetong-li-cgj91Rb_3SM-unsplash.jpg' },
];

const svg = (d, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const ICONS = {
  apps: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  look: 'M12 3a9 9 0 1 0 0 18c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.8-.4-1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.3-4-7.9-9-7.9zM7.5 12.5h.01M9 8h.01M14.5 7.5h.01M17.5 11.5h.01',
  wallpaper: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9h.01',
  keys: 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  checks: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
  export: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5 9-9',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5z',
  auto: 'M12 21a9 9 0 1 0 0-18v18z M12 3a9 9 0 0 1 0 18',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  file: 'M14 3H6v18h12V7zM14 3v4h4',
};

const VIEWS = [
  { id: 'apps', label: 'Apps', title: 'Apps and menus', desc: 'What the TV shows, in which order. Click an app on the TV to edit it.' },
  { id: 'look', label: 'Look', title: 'Look', desc: 'Icons, focus, layout, titles and clock.' },
  { id: 'wallpaper', label: 'Wallpaper', title: 'Wallpaper', desc: 'Background, dimming and screensaver.' },
  { id: 'keys', label: 'Remote', title: 'Remote and behaviour', desc: 'Hotkeys, gamepad and what happens on launch.' },
  { id: 'settings', label: 'Settings', title: 'All settings', desc: 'Every Flex Launcher setting. A dot marks a value that is not the default.' },
  { id: 'checks', label: 'Checks', title: 'Checks', desc: 'Problems in this config, tested against your box.' },
  { id: 'export', label: 'Export', title: 'Export', desc: 'config.ini, icons, wallpapers and fonts for the box.' },
];

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidSeq = 0;
const uid = () => `e${Date.now().toString(36)}${(uidSeq++).toString(36)}`;
let ctlSeq = 0;
const nextId = (p) => `${p}-${ctlSeq++}`;

// ---------- state ----------

function guessIcon(entry) {
  const app = matchCatalog(entry);
  if (app) return { appId: app.id, icon: app.brand ? { kind: 'brand', ref: app.brand } : { kind: 'glyph', ref: app.glyph } };
  const t = `${entry.title} ${entry.cmd}`.toLowerCase();
  const rules = [[/iptv|live tv/, 'tv'], [/utilit|tools|apps/, 'grid'], [/system|settings/, 'settings'], [/shut ?down|power/, 'power'],
    [/restart|reboot/, 'restart'], [/sleep|suspend/, 'sleep'], [/back/, 'back'], [/desktop|:quit/, 'desktop'], [/music|radio/, 'music'], [/game/, 'gamepad']];
  const hit = rules.find(([re]) => re.test(t));
  return { appId: null, icon: hit ? { kind: 'glyph', ref: hit[1] } : { kind: 'letter' } };
}

const toEntries = (menus) => Object.fromEntries(Object.entries(menus).map(([name, list]) => [name, list.map((e) => ({ uid: uid(), ...e, ...guessIcon(e) }))]));

const LOOK_EXTRAS = { labelInSelected: false, dimOthers: false, shape: 'rounded', focusFx: 'fill' };

function fromPreset(key) {
  const p = PRESETS[key];
  const parsed = parseIni(p.text);
  return {
    preset: key,
    target: key === 'blank' ? 'generic' : 'box',
    settings: parsed.settings,
    menus: toEntries(parsed.menus),
    hotkeys: parsed.hotkeys,
    gamepad: parsed.gamepad,
    look: { ...LOOK_EXTRAS, ...p.look },
    focus: p.focus,
    layout: 'row',
    dock: { ...DOCK_DEFAULTS },
    wall: { ...WALL_DEFAULTS },
    basePath: BOX_FACTS.basePath,
    uploads: [],
  };
}

function load() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) saved = JSON.parse(raw);
  } catch {
    // Private mode or bad data: start from the box preset.
  }
  if (!saved) return fromPreset('box');
  // Fill fields added after the state was saved.
  saved.layout ??= 'row';
  saved.dock = { ...DOCK_DEFAULTS, ...saved.dock };
  saved.wall = { ...WALL_DEFAULTS, ...saved.wall };
  saved.look = { ...LOOK_EXTRAS, ...saved.look };
  return saved;
}

let state = load();
const DEFAULTS = defaultSettings();
const events = [];
const ui = { view: 'apps', editMenu: state.settings.General.DefaultMenu, editUid: null, iconTab: 'brand', filter: '', open: new Set(['Layout']) };
let saveWarned = false;

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    if (!saveWarned) toast('Browser storage is full. Uploads stay until you reload.');
    saveWarned = true;
  }
}

const wallpapers = () => [...BUILTIN_WALLS, ...state.uploads];

// Wallpapers with the glass plate and the effect drawn in. While a new set is being drawn,
// the old set stays on screen, so a slider drag does not flash.
const composites = { key: '', map: new Map() };
let compositeJob = 0;
let compositeTimer;

const dockKey = () => (wallsMade(state) ? JSON.stringify([dockActive(state) && plateRect(state), state.dock, state.wall]) : '');

function shownWalls() {
  if (!wallsMade(state)) return wallpapers();
  return wallpapers().map((w) => ({ ...w, src: composites.map.get(w.file) || w.src }));
}

async function buildComposites() {
  const key = dockKey();
  if (!key) return wallpapers();
  if (composites.key === key && wallpapers().every((w) => composites.map.has(w.file))) return shownWalls();
  const job = ++compositeJob;
  const plate = dockActive(state) ? plateRect(state) : null;
  const map = new Map();
  for (const w of wallpapers()) {
    map.set(w.file, await composite(w.src, plate, state.dock, state.wall));
    if (job !== compositeJob) return null;
  }
  composites.key = key;
  composites.map = map;
  stage.render();
  return shownWalls();
}

function scheduleComposites() {
  if (!dockKey() || dockKey() === composites.key) return;
  clearTimeout(compositeTimer);
  compositeTimer = setTimeout(() => buildComposites().catch((err) => toast(`Wallpaper failed: ${err.message}`)), 120);
}

function logEvent(text) {
  events.unshift(text);
  if (events.length > 200) events.pop();
  $('#events').innerHTML = events.slice(0, 60).map((e) => `<li>${esc(e)}</li>`).join('');
}

let toastTimer;
function toast(text, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(text)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  t.classList.toggle('has-action', Boolean(action));
  if (action) {
    t.querySelector('button').onclick = () => {
      t.classList.remove('show');
      action.run();
    };
  }
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 6000 : 2200);
}

// panel=false keeps the panel DOM, so the control being used keeps focus.
function commit({ panel = true } = {}) {
  save();
  scheduleComposites();
  stage.render();
  renderChrome();
  if (panel) renderPanel();
  else if (ui.view === 'apps') renderEntryList();
}

// ---------- icons and files ----------

function thumb(icon, title, size = 96, selected = false) {
  if (icon?.kind === 'upload') return icon.data;
  const src = icon?.kind === 'keep' || !icon ? { kind: 'letter' } : icon;
  return svgUrl(iconSvg(src, state.look, { size, selected, title }));
}

function readImage(file, max, type) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(type, 0.86));
      };
      img.onerror = () => reject(new Error('Not an image'));
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function pickFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}

// ---------- control builders ----------
// data-s="Section|Key" binds to state.settings, data-t="path" binds to state.
// data-rerender redraws the panel after the change (for controls that show or hide others).

const bindS = (sec, key) => `data-s="${esc(sec)}|${key}"`;
const bindT = (path) => `data-t="${path}"`;

function segmented(label, options, value, bind, { full = false, rerender = false } = {}) {
  const n = nextId('seg');
  return `<div class="segmented${full ? ' full' : ''}" role="radiogroup" aria-label="${esc(label)}">${options.map(([v, l]) => `
    <input type="radio" id="${n}-${esc(v)}" name="${n}" value="${esc(v)}" ${String(v) === String(value) ? 'checked' : ''} ${bind} ${rerender ? 'data-rerender' : ''}><label for="${n}-${esc(v)}">${esc(l)}</label>`).join('')}</div>`;
}

const sw = (label, checked, bind, rerender = false) => `<input type="checkbox" role="switch" class="switch" aria-label="${esc(label)}" ${checked ? 'checked' : ''} ${bind} ${rerender ? 'data-rerender' : ''}>`;

function slider(label, value, min, max, step, bind, unit = '', extra = '') {
  return `<span class="val"><input type="range" aria-label="${esc(label)}" min="${min}" max="${max}" step="${step}" value="${value ?? min}" ${bind} data-unit="${unit}" ${extra}><output>${value ?? '-'}${unit}</output></span>`;
}

const colour = (label, value, bind) => `<span class="val"><span class="swatch"><input type="color" aria-label="${esc(label)}" value="${esc(String(value).slice(0, 7))}" ${bind}></span><output class="mono">${esc(value)}</output></span>`;

const row = (label, control, sub = '') => `<div class="ctl"><span class="lbl">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${control}</div>`;
const sec = (title, body, extra = '') => `<section class="sec"><h3>${esc(title)}${extra}</h3>${body}</section>`;

function fontSelect(section) {
  const cur = (state.settings[section].Font || '').split('/').pop();
  return `<select data-font="${section}" aria-label="${section} font">${Object.entries(FONT_FILES).map(([f, n]) => `<option value="${f}" ${f === cur ? 'selected' : ''}>${esc(n.replace('FS ', ''))}</option>`).join('')}</select>`;
}

// Generic control for any SCHEMA setting, used by All settings.
function schemaControl(secName, key, spec) {
  const v = state.settings[secName][key];
  const b = bindS(secName, key);
  switch (spec.type) {
    case 'bool': return sw(key, v, b);
    case 'enum': return spec.options.length <= 3 ? segmented(key, spec.options.map((o) => [o, o]), v, b) : `<select ${b} aria-label="${key}">${spec.options.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    case 'color': return colour(key, v, b);
    case 'pct': return slider(key, v, 0, 100, 1, b, '%');
    case 'int': case 'num': return `<span class="val"><input type="number" aria-label="${key}" step="${spec.type === 'num' ? 0.5 : 1}" value="${v ?? ''}" ${b}><span class="muted">${spec.unit || ''}</span></span>`;
    default: return `<input type="text" aria-label="${key}" value="${esc(v)}" spellcheck="false" ${b}>`;
  }
}

function coerce(spec, el) {
  if (el.type === 'checkbox') return el.checked;
  const raw = el.value;
  switch (spec?.type) {
    case 'int': case 'pct': return raw === '' ? null : parseInt(raw, 10);
    case 'num': return raw === '' ? null : parseFloat(raw);
    case 'color': return raw.toUpperCase();
    case 'dim': return el.type === 'range' ? `${raw}${el.dataset.unit || ''}` : raw;
    default: return el.type === 'range' || el.type === 'number' ? Number(raw) : raw;
  }
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

function applyInput(el) {
  if (el.dataset.s) {
    const [secName, key] = el.dataset.s.split('|');
    const v = coerce(SCHEMA[secName][key], el);
    state.settings[secName][key] = v;
    if (secName === 'Highlight' && key === 'Enabled') state.focus = v ? (state.focus === 'icon' ? 'both' : state.focus) : 'icon';
  } else if (el.dataset.t) {
    setPath(state, el.dataset.t, coerce(null, el));
    if (el.dataset.t === 'focus') state.settings.Highlight.Enabled = state.focus !== 'icon';
  } else if (el.dataset.font) {
    state.settings[el.dataset.font].Font = assetPath(state, 'fonts', el.value);
  } else return false;
  const out = el.closest('.val')?.querySelector('output');
  if (out) out.textContent = el.type === 'range' ? `${el.value}${el.dataset.unit || ''}` : el.value.toUpperCase();
  return true;
}

// ---------- chrome: app bar, rail, TV head, remote ----------

function renderChrome() {
  const checks = runChecks(state);
  const errors = checks.filter((c) => c.level === 'error');
  const warns = checks.filter((c) => c.level === 'warn');
  const top = errors[0] || warns[0];
  const h = $('#health');
  h.className = `health ${errors.length ? 'err' : warns.length ? 'warn' : ''}`;
  h.innerHTML = `<span class="dot"></span><strong>${errors.length ? `${errors.length} error${errors.length > 1 ? 's' : ''}` : warns.length ? `${warns.length} warning${warns.length > 1 ? 's' : ''}` : 'No problems'}</strong>${top ? `<span>${esc(top.where)}: ${esc(top.text)}</span>` : ''}`;
  h.setAttribute('aria-label', `Checks: ${errors.length} errors, ${warns.length} warnings. Open checks.`);

  $('#preset').innerHTML = `${state.preset ? '' : '<option selected>Imported config</option>'}${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}" ${state.preset === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}`;

  $('#rail').innerHTML = VIEWS.map((v) => {
    const count = v.id === 'checks' && (errors.length || warns.length) ? `<span class="count ${errors.length ? '' : 'warn'}">${errors.length || warns.length}</span>` : '';
    const spacer = v.id === 'checks' ? '<span class="spacer"></span>' : '';
    return `${spacer}<button type="button" data-view="${v.id}" ${ui.view === v.id ? 'aria-current="page"' : ''}>${svg(ICONS[v.id], 21)}<span>${v.label}</span>${count}</button>`;
  }).join('');

  const scr = stage.sim.screen;
  const status = scr === 'launcher' ? 'Launcher' : scr === 'app' ? `App running: ${stage.sim.app?.title || ''}` : scr === 'desktop' ? 'Stranded on the desktop' : 'Power off';
  $('#tv-head').innerHTML = `<div class="crumbs" role="group" aria-label="Go to menu"><span class="label">Menu</span>${Object.keys(state.menus).map((m) =>
    `<button type="button" class="chip" data-goto="${esc(m)}" aria-pressed="${scr === 'launcher' && stage.menuName === m}">${esc(m)}</button>`).join('')}</div>
    <span class="grow"></span><span class="screen-state"><span class="led ${scr === 'launcher' || scr === 'app' ? '' : 'off'}"></span>${esc(status)}</span>`;

  const mode = document.documentElement.dataset.theme || 'auto';
  $('#theme').innerHTML = svg(ICONS[mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'auto'], 18);
  $('#theme').setAttribute('aria-label', `Theme: ${mode}. Change theme.`);
}

function renderRemote() {
  const b = (key, label, aria, cls = '') => `<button type="button" class="${cls}" data-key="${key}" aria-label="${aria}">${label}</button>`;
  $('#remote').innerHTML = [
    b('ArrowLeft', svg('M15 6l-6 6 6 6', 16), 'Left'), b('Enter', 'OK', 'OK', 'ok'), b('ArrowRight', svg('M9 6l6 6-6 6', 16), 'Right'),
    b('Backspace', 'Back', 'Back'), '<span class="sep"></span>',
    b('Escape', 'Esc', 'Escape'), b('F10', 'F10', 'F10, close app'), b('Home', 'Home', 'Home'), '<span class="sep"></span>',
    b('F1', 'F1', 'F1'), b('F2', 'F2', 'F2'), b('F3', 'F3', 'F3'), '<span class="sep"></span>',
    '<button type="button" class="more" data-sim="idle">Idle</button><button type="button" class="more" data-sim="slide">Next wallpaper</button><button type="button" class="more" data-sim="reset">Reset</button>',
  ].join('');
}

// ---------- panel ----------

// A redraw replaces the DOM; find the same control again so keyboard focus stays.
const FOCUS_ATTRS = ['data-s', 'data-t', 'data-font', 'data-style', 'data-style-preset', 'data-layout', 'data-wall', 'data-clock', 'data-menu-pick', 'data-icon-tab', 'data-pick', 'data-move', 'data-remove', 'data-hk', 'data-icon', 'data-edit'];
function focusSelector(el) {
  if (!el || !$('#panel').contains(el)) return null;
  const attr = FOCUS_ATTRS.find((a) => el.hasAttribute(a));
  if (attr) return `[${attr}="${CSS.escape(el.getAttribute(attr))}"]${el.type === 'radio' ? `[value="${CSS.escape(el.value)}"]` : ''}`;
  return el.id ? `#${CSS.escape(el.id)}` : null;
}
function keepFocus(redraw) {
  const sel = focusSelector(document.activeElement);
  redraw();
  if (sel) $(`#panel ${sel}`)?.focus();
}

function renderPanel() {
  const v = VIEWS.find((x) => x.id === ui.view);
  $('#panel-title').textContent = v.title;
  $('#panel-desc').textContent = v.desc;
  const body = $('#panel');
  const scroll = body.scrollTop;
  const views = { apps: viewApps, look: viewLook, wallpaper: viewWallpaper, keys: viewKeys, settings: viewSettings, checks: viewChecks, export: viewExport };
  keepFocus(() => {
    body.innerHTML = views[ui.view]();
    if (ui.view === 'apps') renderEntryList();
  });
  body.scrollTop = scroll;
}

function go(view) {
  ui.view = view;
  $('#panel').scrollTop = 0;
  renderChrome();
  renderPanel();
}

// --- Apps ---

function currentEntries() {
  if (!state.menus[ui.editMenu]) ui.editMenu = Object.keys(state.menus)[0];
  return state.menus[ui.editMenu] || [];
}

function renderEntryList() {
  const list = $('#entries');
  if (!list) return;
  const entries = currentEntries();
  const onTv = stage.menuName === ui.editMenu && stage.sim.screen === 'launcher' ? stage.focus : -1;
  const sel = focusSelector(document.activeElement);
  list.innerHTML = entries.map((e, i) => `
    <li class="entry ${e.uid === ui.editUid ? 'sel' : ''}" draggable="true" data-uid="${e.uid}">
      <span class="grip" aria-hidden="true">${svg(ICONS.grip, 14)}</span>
      <button type="button" class="pick" data-pick="${e.uid}" aria-expanded="${e.uid === ui.editUid}" aria-label="Edit ${esc(e.title)}">
        <img alt="" src="${thumb(e.icon, e.title, 76)}">
        <span class="txt"><span class="name">${esc(e.title || '(no title)')}${i === onTv ? '<span class="on-tv">ON TV</span>' : ''}</span><span class="cmd">${esc(e.cmd || 'no command')}</span></span>
      </button>
      <span class="tools">
        <button type="button" class="icon-btn" data-move="${e.uid}:-1" aria-label="Move ${esc(e.title)} left" ${i === 0 ? 'disabled' : ''}>${svg(ICONS.up, 16)}</button>
        <button type="button" class="icon-btn" data-move="${e.uid}:1" aria-label="Move ${esc(e.title)} right" ${i === entries.length - 1 ? 'disabled' : ''}>${svg(ICONS.down, 16)}</button>
        <button type="button" class="icon-btn" data-remove="${e.uid}" aria-label="Remove ${esc(e.title)}">${svg(ICONS.trash, 16)}</button>
      </span>
    </li>`).join('') || '<li class="empty">No apps in this menu yet.</li>';
  const ed = $('#editor-slot');
  const editing = sel && /^\[data-edit/.test(sel);
  if (ed && !editing) ed.innerHTML = editorHtml(entries.find((e) => e.uid === ui.editUid));
  if (sel) $(`#panel ${sel}`)?.focus();
}

function viewApps() {
  const menus = Object.keys(state.menus);
  const per = state.settings.Layout.MaxButtons;
  const n = currentEntries().length;
  return `
    ${sec('Menu', `<div class="menu-tabs">${segmented('Menu to edit', menus.map((m) => [m, m]), ui.editMenu, 'data-menu-pick')}
      <button type="button" class="btn sm ghost" id="menu-add">${svg(ICONS.plus, 14)}New</button>
      ${ui.editMenu !== state.settings.General.DefaultMenu ? '<button type="button" class="btn sm ghost danger" id="menu-del">Delete</button>' : ''}</div>
      <p class="hint">${n} app${n === 1 ? '' : 's'} · ${per} fit on one page${n > per ? ` · ${Math.ceil(n / per)} pages` : ''}. Drag to reorder.</p>
      <ol class="entries" id="entries"></ol>
      <div class="add-row"><button type="button" class="btn primary sm" id="open-catalog">${svg(ICONS.plus, 14)}Add app</button>
      <button type="button" class="btn sm" data-add="custom">Custom command</button></div>`)}
    <div id="editor-slot"></div>`;
}

function editorHtml(e) {
  if (!e) return '';
  const app = e.appId ? CATALOG_BY_ID[e.appId] : null;
  const pressed = (icon) => e.icon?.kind === icon.kind && (icon.ref === undefined || e.icon.ref === icon.ref);
  const opt = (icon, label) => `<button type="button" data-icon='${esc(JSON.stringify(icon))}' aria-label="${esc(label)}" aria-pressed="${pressed(icon)}"><img alt="" src="${thumb(icon, e.title, 80)}"></button>`;
  let grid = '';
  if (ui.iconTab === 'brand') grid = `<div class="icon-grid" role="group" aria-label="Brand logos">${Object.entries(BRANDS).map(([k, b]) => opt({ kind: 'brand', ref: k }, b.title)).join('')}</div>`;
  else if (ui.iconTab === 'glyph') grid = `<div class="icon-grid" role="group" aria-label="Generic icons">${Object.keys(GLYPHS).map((k) => opt({ kind: 'glyph', ref: k }, k)).join('')}${opt({ kind: 'letter' }, 'First letter')}</div>`;
  else grid = `<p class="hint">PNG or WebP. The export scales it to ${state.settings.Layout.IconSize} px.</p>
    <div class="export-row"><button type="button" class="btn sm" data-upload-icon>${svg(ICONS.upload, 14)}Choose file</button>
    ${e.iconPath ? '<button type="button" class="btn sm" data-keep-icon>Use the file on the box</button>' : ''}</div>
    ${e.icon?.kind === 'keep' ? `<p class="hint mono">${esc(e.iconPath)}</p>` : ''}`;
  return `<div class="editor">
    <div class="editor-head"><img alt="" src="${thumb(e.icon, e.title, 96)}"><strong>${esc(e.title || 'Entry')}</strong><span class="grow"></span>
      <button type="button" class="icon-btn" data-pick="${e.uid}" aria-label="Close editor">${svg('M6 6l12 12M18 6L6 18', 16)}</button></div>
    ${app?.note ? `<p class="note">${esc(app.note)}</p>` : ''}
    <label class="field"><span>Title</span><input class="field-input" type="text" data-edit="title" value="${esc(e.title)}"></label>
    <label class="field"><span>Command</span><textarea class="field-input" data-edit="cmd" rows="2" spellcheck="false">${esc(e.cmd)}</textarea></label>
    ${e.cmd.endsWith('.desktop') || e.action ? `<label class="field"><span>Desktop action (optional)</span><input class="field-input" type="text" data-edit="action" value="${esc(e.action)}"></label>` : ''}
    <div class="field"><span>Icon</span>${segmented('Icon source', [['brand', 'Logos'], ['glyph', 'Generic'], ['file', 'File']], ui.iconTab, 'data-icon-tab', { full: true })}${grid}</div>
  </div>`;
}

function renderCatalog() {
  const q = ui.filter.trim().toLowerCase();
  const groups = [...new Set(CATALOG.map((a) => a.group))];
  $('#catalog-body').innerHTML = groups.map((g) => {
    const apps = CATALOG.filter((a) => a.group === g && (!q || a.title.toLowerCase().includes(q) || a.cmd.toLowerCase().includes(q)));
    if (!apps.length) return '';
    return `<h3>${esc(g)}</h3><div class="catalog">${apps.map((a) => `
      <button type="button" data-add="${a.id}"><img alt="" src="${thumb(a.brand ? { kind: 'brand', ref: a.brand } : { kind: 'glyph', ref: a.glyph }, a.title, 60)}">
      <span class="t"><b>${esc(a.title)}</b><small>${esc(a.note || a.cmd)}</small></span></button>`).join('')}</div>`;
  }).join('') || '<p class="empty">No app matches. Use Custom command.</p>';
}

function addEntry(id) {
  const app = CATALOG_BY_ID[id];
  const entry = app
    ? { uid: uid(), title: app.title, cmd: app.cmd, action: '', iconPath: '', appId: app.id, icon: app.brand ? { kind: 'brand', ref: app.brand } : { kind: 'glyph', ref: app.glyph } }
    : { uid: uid(), title: 'New app', cmd: '', action: '', iconPath: '', appId: null, icon: { kind: 'letter' } };
  const sub = entry.cmd.match(/^:submenu\s+(.+)$/);
  if (sub && !state.menus[sub[1]]) state.menus[sub[1]] = [backEntry()];
  currentEntries().push(entry);
  ui.editUid = entry.uid;
  logEvent(`Added ${entry.title} to ${ui.editMenu}`);
  toast(`${entry.title} added to ${ui.editMenu}`);
  commit();
}

const backEntry = () => ({ uid: uid(), title: 'Back', cmd: ':back', action: '', iconPath: '', appId: 'back', icon: { kind: 'glyph', ref: 'back' } });

// --- Look ---

const VISUAL_KEYS = ['settings', 'look', 'dock', 'wall', 'focus', 'layout', 'style'];

function pickStyle(id) {
  const before = structuredClone(Object.fromEntries(VISUAL_KEYS.map((k) => [k, state[k]])));
  applyStyle(state, id);
  logEvent(`Style: ${STYLES[id].label}`);
  commit();
  toast(`Style: ${STYLES[id].label}`, {
    label: 'Undo',
    run: () => {
      Object.assign(state, before);
      logEvent(`Undo style ${STYLES[id].label}`);
      commit();
    },
  });
}

// Each card is drawn from the real settings the style would give.
function styleCards() {
  return Object.entries(STYLES).map(([id, p]) => {
    const preview = structuredClone(state);
    applyStyle(preview, id);
    return `<button type="button" class="style-card" data-style-preset="${id}" aria-pressed="${state.style === id}">
      <span class="st-pv"><span class="st-bg" style='background:${styleBackground(preview)};filter:${styleFilter(preview)}'></span>${styleThumb(preview)}</span>
      <span class="nm">${esc(p.label)}<small>${esc(p.desc)}</small></span></button>`;
  }).join('');
}

function openStyles(open) {
  const pop = $('#styles-pop');
  const btn = $('#styles-btn');
  open ??= pop.hidden;
  if (open) $('#styles-grid').innerHTML = styleCards();
  pop.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  if (open) pop.querySelector('[aria-pressed="true"], .style-card')?.focus();
}


function applyLayout(id) {
  const l = LAYOUTS[id];
  if (!l || l.disabled) return;
  l.apply(state.settings, state);
  state.layout = id;
  state.style = null;
  if (state.dock.on && !['Image', 'Slideshow'].includes(state.settings.Background.Mode)) {
    state.settings.Background.Mode = 'Slideshow';
    state.settings.Background.SlideshowDirectory = assetPath(state, 'bg');
  }
  logEvent(`Layout: ${l.label}`);
  commit();
}

function viewLook() {
  const s = state.settings;
  const sample = ['kodi', 'youtube', 'jellyfin'];
  const cards = Object.entries(ICON_STYLES).map(([k, v]) => `
    <button type="button" class="card" data-style="${k}" aria-pressed="${state.look.style === k}">
      <span class="pv">${sample.map((b, i) => `<img alt="" src="${svgUrl(iconSvg({ kind: 'brand', ref: b }, { ...state.look, style: k, labelInSelected: false }, { size: 64, selected: i === 0 && state.focus !== 'box', title: b }))}">`).join('')}</span>
      <span class="nm">${esc(v.label)}</span></button>`).join('');
  const layouts = Object.entries(LAYOUTS).map(([k, v]) => `
    <button type="button" class="card layout" data-layout="${k}" aria-pressed="${state.layout === k}" ${v.disabled ? 'disabled aria-describedby="list-why"' : ''}>
      <span class="pv mock">${v.mock}</span><span class="nm">${esc(v.label)}${v.disabled ? '<small>Needs own launcher</small>' : ''}</span></button>`).join('');
  const d = state.dock;
  const bgOk = ['Image', 'Slideshow'].includes(s.Background.Mode);
  const spacing = parseFloat(s.Layout.IconSpacing);
  const clock = !s.Clock.Enabled ? 'off' : s.Clock.ShowDate ? 'date' : 'time';
  return [
    sec('Styles', `<div class="style-grid">${styleCards()}</div>
      <p class="hint">A style changes only how the TV looks. Your apps, hotkeys and behaviour stay.</p>`),
    sec('Layout', `<div class="cards">${layouts}</div>
      <p class="hint" id="list-why">A layout card sets many values at once. You can change each value after. Flex Launcher has only one horizontal row, so a list needs its own launcher.</p>`),
    sec('Glass plate', `${row('Draw a plate', sw('Glass plate', d.on, bindT('dock.on'), true), 'Drawn into the wallpaper')}
      ${d.on && !bgOk ? `<p class="note">The plate needs an image background. <button type="button" class="btn sm" data-use-wallpaper>Use the slideshow</button></p>` : ''}
      ${d.on ? `${row('Blur', slider('Blur', d.blur, 0, 80, 1, bindT('dock.blur'), 'px'))}
      ${row('Tint', colour('Tint colour', d.tint, bindT('dock.tint')))}
      ${row('Tint strength', slider('Tint strength', d.tintOpacity, 0, 80, 1, bindT('dock.tintOpacity'), '%'))}
      ${row('Edge', slider('Edge line', d.border, 0, 60, 1, bindT('dock.border'), '%'))}
      ${row('Corners', slider('Plate corners', d.radius, 0, 120, 1, bindT('dock.radius'), 'px'))}
      ${row('Side padding', slider('Side padding', d.padX, 0, 160, 2, bindT('dock.padX'), 'px'))}
      ${row('Top padding', slider('Top padding', d.padY, 0, 120, 2, bindT('dock.padY'), 'px'))}
      <p class="hint">One plate fits the widest menu. It lines up on a 1920x1080 screen.</p>` : ''}`),
    sec('Wallpaper effect', `${row('Effect', `<select aria-label="Wallpaper effect" ${bindT('wall.fx')} data-rerender>${Object.entries(WALL_FX).map(([k, v]) => `<option value="${k}" ${k === state.wall.fx ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`, 'Drawn into the wallpaper')}
      ${state.wall.fx !== 'none' && !bgOk ? `<p class="note">Effects need an image background. <button type="button" class="btn sm" data-use-wallpaper>Use the slideshow</button></p>` : ''}
      ${state.wall.fx !== 'none' && state.wall.fx !== 'mono' ? row('Strength', slider('Effect strength', state.wall.strength, 0, 100, 1, bindT('wall.strength'), '%')) : ''}
      ${state.wall.fx === 'duotone' ? row('Tint', colour('Duotone colour', state.wall.tint, bindT('wall.tint'))) : ''}`),
    sec('Icon style', `<div class="cards">${cards}</div>
      ${row('Shape', segmented('Tile shape', Object.entries(SHAPES), state.look.shape, bindT('look.shape'), { rerender: true }))}
      ${state.look.shape === 'rounded' ? row('Tile corners', slider('Tile corners', state.look.radius, 0, 0.5, 0.01, bindT('look.radius'))) : ''}
      ${row('Logo size', slider('Logo size', state.look.glyphScale, 0.2, 0.8, 0.01, bindT('look.glyphScale')))}
      ${row('Label on focus', sw('Label inside the selected icon', state.look.labelInSelected, bindT('look.labelInSelected')), 'Title only on the selected app')}
      ${row('Dim others', sw('Dim the other icons', state.look.dimOthers, bindT('look.dimOthers')), 'Needs Selected tile focus')}`),
    sec('Focus', `${segmented('Focus style', [['box', 'Highlight box'], ['icon', 'Selected tile'], ['both', 'Both']], state.focus, bindT('focus'), { full: true, rerender: true })}
      <p class="hint">"Selected tile" exports an extra <span class="mono">_selected.png</span> for each icon and turns the box off.</p>
      ${state.focus !== 'box' ? `${row('Focus effect', `<select aria-label="Focus effect" ${bindT('look.focusFx')}>${Object.entries(FOCUS_FX).map(([k, v]) => `<option value="${k}" ${k === state.look.focusFx ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`, 'Drawn into the selected icon')}
      <p class="hint">Flex Launcher swaps the icon at once. It cannot animate the change.</p>` : ''}
      ${s.Highlight.Enabled ? `${row('Fill', colour('Highlight fill', s.Highlight.FillColor, bindS('Highlight', 'FillColor')))}
      ${row('Fill opacity', slider('Fill opacity', s.Highlight.FillOpacity, 0, 100, 1, bindS('Highlight', 'FillOpacity'), '%'))}
      ${row('Corner radius', slider('Corner radius', s.Highlight.CornerRadius, 0, 80, 1, bindS('Highlight', 'CornerRadius'), 'px'), s.Highlight.OutlineSize > 0 ? 'Off while outline > 0' : '')}
      ${row('Side padding', slider('Highlight side padding', s.Highlight.HPadding, 0, 80, 1, bindS('Highlight', 'HPadding'), 'px'))}
      ${row('Top padding', slider('Highlight top padding', s.Highlight.VPadding, 0, 80, 1, bindS('Highlight', 'VPadding'), 'px'))}` : ''}`),
    sec('Layout', `${row('Apps per page', slider('Apps per page', s.Layout.MaxButtons, 1, 10, 1, bindS('Layout', 'MaxButtons')))}
      ${row('Icon size', slider('Icon size', s.Layout.IconSize, 96, 360, 4, bindS('Layout', 'IconSize'), 'px'))}
      ${row('Spacing', Number.isNaN(spacing) || !String(s.Layout.IconSpacing).endsWith('%') ? `<input type="text" value="${esc(s.Layout.IconSpacing)}" ${bindS('Layout', 'IconSpacing')}>` : slider('Spacing', spacing, 0, 15, 0.5, bindS('Layout', 'IconSpacing'), '%'), '% of screen width')}
      ${row('Height', slider('Vertical position', s.Layout.VCenter, 10, 90, 1, bindS('Layout', 'VCenter'), '%'), 'Row centre on screen')}`),
    sec('Titles', `${row('Show titles', sw('Show titles', s.Titles.Enabled, bindS('Titles', 'Enabled'), true))}
      ${s.Titles.Enabled ? `${row('Font', fontSelect('Titles'))}
      ${row('Size', slider('Title size', s.Titles.FontSize, 12, 80, 1, bindS('Titles', 'FontSize'), 'px'))}
      ${row('Colour', colour('Title colour', s.Titles.Color, bindS('Titles', 'Color')))}
      ${row('Long titles', segmented('Long titles', [['Shrink', 'Shrink'], ['Truncate', 'Cut'], ['None', 'Overflow']], s.Titles.OversizeMode, bindS('Titles', 'OversizeMode')))}
      ${row('Shadow', sw('Title shadow', s.Titles.Shadows, bindS('Titles', 'Shadows')))}` : ''}`),
    sec('Clock', `${segmented('Clock', [['off', 'Off'], ['time', 'Time'], ['date', 'Time and date']], clock, 'data-clock', { full: true, rerender: true })}
      ${s.Clock.Enabled ? `<div style="height:8px"></div>${row('Side', segmented('Clock side', [['Left', 'Left'], ['Right', 'Right']], s.Clock.Alignment, bindS('Clock', 'Alignment')))}
      ${row('Format', segmented('Time format', [['24hr', '24 h'], ['12hr', '12 h'], ['Auto', 'Auto']], s.Clock.TimeFormat, bindS('Clock', 'TimeFormat')))}
      ${row('Font', fontSelect('Clock'))}
      ${row('Size', slider('Clock size', s.Clock.FontSize, 20, 140, 1, bindS('Clock', 'FontSize'), 'px'))}` : ''}`),
  ].join('');
}

// --- Wallpaper ---

function viewWallpaper() {
  const bg = state.settings.Background;
  const sc = state.settings.Screensaver;
  const file = (bg.Image || '').split('/').pop();
  const tiles = bg.Mode === 'Image' || bg.Mode === 'Slideshow'
    ? `<div class="walls">${wallpapers().map((w) => {
      const on = bg.Mode === 'Slideshow' || file === w.file;
      return `<button type="button" class="wall" data-wall="${esc(w.file)}" aria-pressed="${on}" style="background-image:url('${w.src}')" aria-label="${esc(w.name)}">
        ${on ? `<span class="tick">${svg(ICONS.check, 13)}</span>` : ''}<span class="tag">${esc(w.name)}</span></button>`;
    }).join('')}<button type="button" class="wall add" id="bg-upload">${svg(ICONS.plus, 18)} Upload</button></div>
      ${bg.Mode === 'Slideshow' ? '<p class="hint">Slideshow uses every image in the folder. Click an image to show only that one.</p>' : ''}`
    : '';
  return [
    sec('Background', `${segmented('Background', [['Image', 'Image'], ['Slideshow', 'Slideshow'], ['Color', 'Colour'], ['Transparent', 'None']], bg.Mode, bindS('Background', 'Mode'), { full: true, rerender: true })}
      <div style="height:10px"></div>${tiles}
      ${bg.Mode === 'Color' ? row('Colour', colour('Background colour', bg.Color, bindS('Background', 'Color'))) : ''}
      ${bg.Mode === 'Slideshow' ? `${row('Each image', slider('Image duration', bg.SlideshowImageDuration, 5, 300, 5, bindS('Background', 'SlideshowImageDuration'), 's'))}
      ${row('Fade', slider('Fade time', bg.SlideshowTransitionTime, 0, 10, 0.5, bindS('Background', 'SlideshowTransitionTime'), 's'))}` : ''}`),
    sec('Dim the background', `${row('Overlay', sw('Overlay', bg.Overlay, bindS('Background', 'Overlay'), true), 'Makes icons and text easier to read')}
      ${bg.Overlay ? `${row('Strength', slider('Overlay strength', bg.OverlayOpacity, 0, 100, 1, bindS('Background', 'OverlayOpacity'), '%'))}
      ${row('Colour', colour('Overlay colour', bg.OverlayColor, bindS('Background', 'OverlayColor')))}` : ''}`),
    sec('Screensaver', `${row('Dim when idle', sw('Screensaver', sc.Enabled, bindS('Screensaver', 'Enabled'), true))}
      ${sc.Enabled ? `${row('After', slider('Idle time', sc.IdleTime, 30, 1800, 30, bindS('Screensaver', 'IdleTime'), 's'))}
      ${row('Darkness', slider('Darkness', sc.Intensity, 0, 100, 1, bindS('Screensaver', 'Intensity'), '%'))}
      ${row('Pause slideshow', sw('Pause slideshow', sc.PauseSlideshow, bindS('Screensaver', 'PauseSlideshow')))}
      <p class="hint">Press Idle under the TV to see it now.</p>` : ''}`),
  ].join('');
}

// --- Remote ---

function viewKeys() {
  const g = state.settings.General;
  return [
    sec('Hotkeys', `${state.hotkeys.map((h, i) => `<div class="hk"><kbd title="${esc(h.key)}">${esc(keyLabel(h.key))}</kbd>
      <input class="field-input" aria-label="Command for ${esc(keyLabel(h.key))}" data-hk="${i}" value="${esc(h.cmd)}" spellcheck="false">
      <button type="button" class="icon-btn" data-hk-del="${i}" aria-label="Remove hotkey ${esc(keyLabel(h.key))}">${svg(ICONS.trash, 16)}</button></div>`).join('') || '<p class="hint">No hotkeys.</p>'}
      <button type="button" class="btn sm" id="hk-record">${svg(ICONS.plus, 14)}Record a key</button>
      <p class="hint">Flex Launcher cannot close apps. Bind a window-manager key (for example F10 = close window) on the box.</p>`),
    sec('When an app starts', `${segmented('On launch', [['Blank', 'Blank launcher'], ['None', 'Keep drawing'], ['Quit', 'Quit launcher']], g.OnLaunch, bindS('General', 'OnLaunch'), { full: true })}
      <p class="hint">Quit saves memory, but when the app closes you are on the desktop.</p>`),
    sec('Navigation', `${row('Wrap around', sw('Wrap around', g.WrapEntries, bindS('General', 'WrapEntries')), 'Right on the last app goes to the first')}
      ${row('Reset on back', sw('Reset on back', g.ResetOnBack, bindS('General', 'ResetOnBack')), 'Submenus open on the first app')}
      ${row('Mouse select', sw('Mouse select', g.MouseSelect, bindS('General', 'MouseSelect')))}
      ${row('Block OS screensaver', sw('Block OS screensaver', g.InhibitOSScreensaver, bindS('General', 'InhibitOSScreensaver')))}`),
    sec('Gamepad', `<label class="field"><span>Input=command, one per line</span><textarea class="field-input" id="gamepad" rows="6" spellcheck="false">${esc(state.gamepad.map((x) => `${x.input}=${x.cmd}`).join('\n'))}</textarea></label>`),
  ].join('');
}

// --- All settings ---

function viewSettings() {
  const q = ui.filter.trim().toLowerCase();
  const groups = Object.entries(SCHEMA).map(([secName, keys]) => {
    const rows = Object.entries(keys).filter(([k]) => !q || k.toLowerCase().includes(q) || secName.toLowerCase().includes(q));
    if (!rows.length) return '';
    const changed = rows.filter(([k]) => JSON.stringify(state.settings[secName][k]) !== JSON.stringify(DEFAULTS[secName][k])).length;
    const open = q || ui.open.has(secName);
    return `<details class="group" data-group="${esc(secName)}" ${open ? 'open' : ''}><summary>${esc(secName)} <span class="n">${rows.length}${changed ? ` · ${changed} changed` : ''}</span></summary>
      <div class="body">${rows.map(([k, spec]) => {
        const dot = JSON.stringify(state.settings[secName][k]) !== JSON.stringify(DEFAULTS[secName][k]) ? '<span class="changed" title="Not the default"></span>' : '';
        return `<div class="ctl"><span class="lbl">${k}${dot}${spec.hint ? `<small>${esc(spec.hint)}</small>` : ''}</span>${schemaControl(secName, k, spec)}</div>`;
      }).join('')}</div></details>`;
  }).join('');
  return `<div class="search"><input class="field-input" type="search" id="settings-search" placeholder="Search settings" aria-label="Search settings" value="${esc(ui.filter)}"></div>
    <div class="ctl stack"><span class="lbl">Flex Launcher folder on the box</span><input type="text" id="base-path" value="${esc(state.basePath)}" spellcheck="false"></div>
    ${groups || '<p class="empty">No setting matches.</p>'}`;
}

// --- Checks ---

function viewChecks() {
  const checks = runChecks(state);
  const order = { error: 0, warn: 1, info: 2 };
  checks.sort((a, b) => order[a.level] - order[b.level]);
  const mark = { error: '!', warn: '!', info: 'i' };
  return `${sec('Test against', row('My box (21 Oct)', sw('Check commands against my box', state.target === 'box', 'id="target-box"'), 'Installed Flatpaks and commands'))}
    ${sec(`${checks.length} result${checks.length === 1 ? '' : 's'}`, `<ul class="checks">${checks.map((c) => `<li class="${c.level}"><span class="ic" aria-label="${c.level}">${mark[c.level]}</span>
      <span><span class="where">${esc(c.where)}</span>${esc(c.text)}</span></li>`).join('')}</ul>`)}`;
}

// --- Export ---

function viewExport() {
  const icons = Object.values(state.menus).flat().filter((e) => e.icon && e.icon.kind !== 'keep').length;
  const sel = state.focus !== 'box';
  return [
    sec('Download', `<div class="export-hero">
      <button type="button" class="btn primary" id="zip-dl">${svg(ICONS.export, 16)}Download bundle (.zip)</button>
      <p class="hint">config.ini, ${icons} icons at ${state.settings.Layout.IconSize} px${sel ? ` plus ${icons} _selected icons` : ''}, wallpapers and fonts. Copy the folder to <span class="mono">${esc(state.basePath)}</span>.</p>
      <div class="export-row"><button type="button" class="btn sm" id="ini-dl">${svg(ICONS.file, 14)}config.ini only</button>
      <button type="button" class="btn sm" id="ini-copy">${svg(ICONS.copy, 14)}Copy</button>
      <button type="button" class="btn sm" id="ini-import">${svg(ICONS.upload, 14)}Import…</button></div></div>`),
    sec('config.ini', `<pre class="ini" tabindex="0" aria-label="config.ini">${esc(configText(state))}</pre>`),
  ].join('');
}

// ---------- events ----------

$('#rail').addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (b) go(b.dataset.view);
});
$('#health').addEventListener('click', () => go('checks'));
$('#styles-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  openStyles();
});
$('#styles-grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-style-preset]');
  if (!b) return;
  openStyles(false);
  pickStyle(b.dataset.stylePreset);
  $('#styles-btn').focus();
});
document.addEventListener('click', (e) => {
  if (!$('#styles-pop').hidden && !e.target.closest('#styles-pop')) openStyles(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#styles-pop').hidden) {
    openStyles(false);
    $('#styles-btn').focus();
  }
});
$('#export-quick').addEventListener('click', () => go('export'));
$('#theme').addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  const cur = document.documentElement.dataset.theme || 'auto';
  const next = order[(order.indexOf(cur) + 1) % 3];
  if (next === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_STORE, next); } catch { /* per-browser convenience only */ }
  renderChrome();
});
$('#preset').addEventListener('change', (e) => {
  const key = e.target.value;
  if (!PRESETS[key]) return;
  if (!confirm(`Load "${PRESETS[key].label}"? This replaces your menus and settings.`)) return renderChrome();
  state = { ...fromPreset(key), uploads: state.uploads };
  ui.editMenu = state.settings.General.DefaultMenu;
  ui.editUid = null;
  stage.reset();
  logEvent(`Preset: ${PRESETS[key].label}`);
  commit();
});

$('#tv-head').addEventListener('click', (e) => {
  const b = e.target.closest('[data-goto]');
  if (!b) return;
  const m = b.dataset.goto;
  const def = state.settings.General.DefaultMenu;
  stage.sim.screen = 'launcher';
  stage.sim.stack = m === def ? [m] : [def, m];
  ui.editMenu = m;
  ui.editUid = null;
  commit();
});

$('#remote').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.key) stage.handleKey({ key: b.dataset.key });
  else if (b.dataset.sim === 'idle') stage.idleNow();
  else if (b.dataset.sim === 'slide') stage.nextSlide();
  else if (b.dataset.sim === 'reset') { stage.reset(); logEvent('TV reset'); }
  renderChrome();
});

const panel = $('#panel');

panel.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.edit) {
    const entry = currentEntries().find((x) => x.uid === ui.editUid);
    entry[el.dataset.edit] = el.value;
    if (el.dataset.edit === 'cmd') entry.appId = matchCatalog(entry)?.id ?? null;
    save();
    stage.render();
    renderChrome();
    const row = $(`.entry[data-uid="${entry.uid}"]`);
    if (row) {
      row.querySelector('.name').firstChild.textContent = entry.title || '(no title)';
      row.querySelector('.cmd').textContent = entry.cmd || 'no command';
    }
    return;
  }
  if (el.id === 'settings-search') {
    ui.filter = el.value;
    renderPanel();
    const s = $('#settings-search');
    s.focus();
    s.setSelectionRange(s.value.length, s.value.length);
    return;
  }
  if (el.dataset.hk !== undefined) {
    state.hotkeys[Number(el.dataset.hk)].cmd = el.value;
    return commit({ panel: false });
  }
  if (el.id === 'gamepad') {
    state.gamepad = el.value.split('\n').map((l) => l.trim()).filter((l) => l.includes('=')).map((l) => ({ input: l.slice(0, l.indexOf('=')), cmd: l.slice(l.indexOf('=') + 1) }));
    return commit({ panel: false });
  }
  if (el.id === 'base-path') {
    const old = state.basePath.replace(/\/$/, '');
    const next = el.value.replace(/\/$/, '');
    const s = state.settings;
    for (const [a, b] of [['Background', 'Image'], ['Background', 'SlideshowDirectory'], ['Titles', 'Font'], ['Clock', 'Font']]) {
      if (s[a][b]?.startsWith(old)) s[a][b] = next + s[a][b].slice(old.length);
    }
    state.basePath = el.value;
    return commit({ panel: false });
  }
  if (el.hasAttribute('data-clock')) {
    state.settings.Clock.Enabled = el.value !== 'off';
    state.settings.Clock.ShowDate = el.value === 'date';
    return commit();
  }
  if (el.hasAttribute('data-menu-pick')) {
    ui.editMenu = el.value;
    ui.editUid = null;
    return renderPanel();
  }
  if (el.hasAttribute('data-icon-tab')) {
    ui.iconTab = el.value;
    return renderEntryList();
  }
  if (el.id === 'target-box') {
    state.target = el.checked ? 'box' : 'generic';
    return commit();
  }
  if (applyInput(el)) {
    // A hand-made change means the look no longer is the named style.
    state.style = null;
    if (el.dataset.t === 'dock.on' && !state.dock.on) state.layout = 'row';
    commit({ panel: el.hasAttribute('data-rerender') });
  }
});

panel.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.dataset?.group || ui.filter) return;
  if (d.open) ui.open.add(d.dataset.group);
  else ui.open.delete(d.dataset.group);
}, true);

panel.addEventListener('click', async (ev) => {
  const t = ev.target.closest('button');
  if (!t) return;
  const entries = currentEntries();
  if (t.dataset.pick) {
    ui.editUid = ui.editUid === t.dataset.pick ? null : t.dataset.pick;
    renderEntryList();
  } else if (t.dataset.move) {
    const [id, d] = t.dataset.move.split(':');
    const i = entries.findIndex((e) => e.uid === id);
    const j = i + Number(d);
    [entries[i], entries[j]] = [entries[j], entries[i]];
    commit();
  } else if (t.dataset.remove) {
    const gone = entries.find((e) => e.uid === t.dataset.remove);
    state.menus[ui.editMenu] = entries.filter((e) => e.uid !== t.dataset.remove);
    if (ui.editUid === t.dataset.remove) ui.editUid = null;
    toast(`${gone.title} removed`);
    commit();
  } else if (t.id === 'open-catalog') {
    ui.filter = '';
    $('#catalog-search').value = '';
    renderCatalog();
    $('#catalog').showModal();
    $('#catalog-search').focus();
  } else if (t.dataset.add) {
    addEntry(t.dataset.add);
  } else if (t.dataset.icon) {
    entries.find((x) => x.uid === ui.editUid).icon = JSON.parse(t.dataset.icon);
    commit({ panel: false });
  } else if (t.hasAttribute('data-upload-icon')) {
    const file = await pickFile('image/png,image/webp,image/jpeg,image/svg+xml');
    if (!file) return;
    entries.find((x) => x.uid === ui.editUid).icon = { kind: 'upload', data: await readImage(file, 512, 'image/png') };
    commit({ panel: false });
  } else if (t.hasAttribute('data-keep-icon')) {
    entries.find((x) => x.uid === ui.editUid).icon = { kind: 'keep' };
    commit({ panel: false });
  } else if (t.id === 'menu-add') {
    const name = prompt('Name of the new menu:', 'Utilities');
    if (!name || state.menus[name] || /[[\]]/.test(name)) return;
    state.menus[name] = [backEntry()];
    ui.editMenu = name;
    commit();
  } else if (t.id === 'menu-del') {
    if (!confirm(`Delete menu "${ui.editMenu}"?`)) return;
    delete state.menus[ui.editMenu];
    ui.editMenu = state.settings.General.DefaultMenu;
    stage.reset();
    commit();
  } else if (t.dataset.stylePreset) {
    pickStyle(t.dataset.stylePreset);
  } else if (t.dataset.layout) {
    applyLayout(t.dataset.layout);
  } else if (t.hasAttribute('data-use-wallpaper')) {
    state.settings.Background.Mode = 'Slideshow';
    state.settings.Background.SlideshowDirectory = assetPath(state, 'bg');
    commit();
  } else if (t.dataset.style) {
    state.look.style = t.dataset.style;
    commit();
  } else if (t.dataset.wall) {
    state.settings.Background.Mode = 'Image';
    state.settings.Background.Image = assetPath(state, 'bg', t.dataset.wall);
    commit();
  } else if (t.id === 'bg-upload') {
    const file = await pickFile('image/*');
    if (!file) return;
    const src = await readImage(file, 1920, 'image/jpeg');
    const name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Upload';
    const safe = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
    state.uploads = state.uploads.filter((u) => u.file !== safe).concat({ file: safe, name, src });
    if (state.settings.Background.Mode !== 'Slideshow') {
      state.settings.Background.Mode = 'Image';
      state.settings.Background.Image = assetPath(state, 'bg', safe);
    }
    toast(`${safe} added`);
    commit();
  } else if (t.dataset.hkDel !== undefined) {
    state.hotkeys.splice(Number(t.dataset.hkDel), 1);
    commit();
  } else if (t.id === 'hk-record') {
    t.textContent = 'Press a key now (Tab cancels)';
    const onKey = (e) => {
      e.preventDefault();
      window.removeEventListener('keydown', onKey, true);
      const code = e.key === 'Tab' ? null : sdlKeycode(e);
      if (code === null) return renderPanel();
      const key = `#${code.toString(16).toUpperCase()}`;
      state.hotkeys.push({ key, cmd: '' });
      logEvent(`Hotkey ${keyLabel(key)} (${key}) added`);
      commit();
      panel.querySelector(`[data-hk="${state.hotkeys.length - 1}"]`)?.focus();
    };
    window.addEventListener('keydown', onKey, true);
  } else if (t.id === 'ini-copy') {
    try {
      await navigator.clipboard.writeText(configText(state));
      toast('config.ini copied');
    } catch {
      toast('Copy is blocked. Select the text instead.');
    }
  } else if (t.id === 'ini-dl') {
    download(new Blob([configText(state)], { type: 'text/plain' }), 'config.ini');
  } else if (t.id === 'zip-dl') {
    const label = t.innerHTML;
    t.textContent = 'Building…';
    t.disabled = true;
    try {
      let walls = await buildComposites();
      while (walls === null) walls = await buildComposites();
      download(await exportBundle(state, walls), 'flex-launcher.zip');
      logEvent('Bundle downloaded');
      toast('flex-launcher.zip downloaded');
    } catch (err) {
      toast(`Export failed: ${err.message}`);
    }
    t.innerHTML = label;
    t.disabled = false;
  } else if (t.id === 'ini-import') {
    const file = await pickFile('.ini,text/plain');
    if (!file) return;
    const parsed = parseIni(await file.text());
    state = { ...state, preset: null, settings: parsed.settings, menus: toEntries(parsed.menus), hotkeys: parsed.hotkeys, gamepad: parsed.gamepad };
    ui.editMenu = state.settings.General.DefaultMenu;
    ui.editUid = null;
    stage.reset();
    logEvent(`Imported ${file.name}${parsed.unknown.length ? `; unknown keys: ${parsed.unknown.join(', ')}` : ''}`);
    toast(`${file.name} imported`);
    commit();
  }
});

// Drag to reorder entries. The arrow buttons do the same from the keyboard.
let dragUid = null;
panel.addEventListener('dragstart', (e) => {
  const li = e.target.closest('.entry');
  if (!li) return;
  dragUid = li.dataset.uid;
  e.dataTransfer.effectAllowed = 'move';
});
panel.addEventListener('dragover', (e) => {
  const li = e.target.closest('.entry');
  if (!li || !dragUid) return;
  e.preventDefault();
  panel.querySelectorAll('.entry.drop').forEach((x) => x.classList.remove('drop'));
  li.classList.add('drop');
});
panel.addEventListener('drop', (e) => {
  const li = e.target.closest('.entry');
  if (!li || !dragUid) return;
  e.preventDefault();
  const entries = currentEntries();
  const from = entries.findIndex((x) => x.uid === dragUid);
  const to = entries.findIndex((x) => x.uid === li.dataset.uid);
  const [moved] = entries.splice(from, 1);
  // Moving right lands after the target, moving left lands before it.
  entries.splice(to, 0, moved);
  dragUid = null;
  commit();
});
panel.addEventListener('dragend', () => {
  dragUid = null;
  panel.querySelectorAll('.entry.drop').forEach((x) => x.classList.remove('drop'));
});

$('#catalog-search').addEventListener('input', (e) => {
  ui.filter = e.target.value;
  renderCatalog();
});
$('#catalog-body').addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  $('#catalog').close();
  ui.filter = '';
  addEntry(b.dataset.add);
});

// ---------- boot ----------

try {
  const theme = localStorage.getItem(THEME_STORE);
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch { /* per-browser convenience only */ }

const stage = new Stage($('#stage'), {
  getState: () => state,
  getWallpapers: shownWalls,
  onEvent: (t) => {
    logEvent(t);
    renderChrome();
  },
  onFocusChange: () => {
    if (ui.view === 'apps') renderEntryList();
  },
});

$('#stage').addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (stage.handleKey(e)) e.preventDefault();
  renderChrome();
});
$('#stage').addEventListener('click', (e) => {
  $('#stage').focus();
  const idx = stage.entryAt(e.clientX, e.clientY);
  if (idx === null) return;
  const entry = stage.entries[idx];
  stage.focus = idx;
  stage.render();
  ui.view = 'apps';
  ui.editMenu = stage.menuName;
  ui.editUid = entry.uid;
  renderChrome();
  renderPanel();
  $(`.entry[data-uid="${entry.uid}"]`)?.scrollIntoView({ block: 'nearest' });
});

renderRemote();
stage.reset();
scheduleComposites();
renderChrome();
renderPanel();
logEvent(`Loaded ${PRESETS[state.preset]?.label || 'saved config'}`);
document.fonts?.ready.then(() => stage.render());
