// Draws a 1920x1080 approximation of Flex Launcher and simulates its input.
// The layout follows the documented settings; small details (clock and date
// placement, arrow size) are estimates, not measured from the C source.
import { iconSvg, svgUrl } from './icons.js';
import { CATALOG_BY_ID } from './catalog.js';
import { W, H, dimPx, rowGeometry } from './dock.js';

export const FONT_FILES = {
  'Inter-Regular.ttf': 'FS Inter',
  'NotoSans-Regular.ttf': 'FS Noto Sans',
  'OpenSans-Regular.ttf': 'FS Open Sans',
  'Roboto-Regular.ttf': 'FS Roboto',
  'SourceSansPro-Regular.ttf': 'FS Source Sans Pro',
};

export function fontFamily(path) {
  const file = (path || '').split('/').pop();
  // Single quotes: the value goes inside a double-quoted style attribute.
  return `'${FONT_FILES[file] || 'FS Open Sans'}', sans-serif`;
}

const rgba = (hex, pct) => {
  const n = parseInt((hex || '#000000').replace('#', '').padEnd(6, '0'), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${(pct ?? 100) / 100})`;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let measureCtx;
function textWidth(text, size, family) {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx.font = `${size}px ${family}`;
  return measureCtx.measureText(text).width;
}

// SDL keycodes for browser keys: wiki.libsdl.org/SDL2/SDLKeycodeLookup
export function sdlKeycode(e) {
  const named = {
    Escape: 0x1b, Enter: 0x0d, Backspace: 0x08, Tab: 0x09, ' ': 0x20, Delete: 0x7f,
    Home: 0x4000004a, End: 0x4000004d, PageUp: 0x4000004b, PageDown: 0x4000004e,
    ArrowRight: 0x4000004f, ArrowLeft: 0x40000050, ArrowDown: 0x40000051, ArrowUp: 0x40000052,
    AudioVolumeUp: 0x40000080, AudioVolumeDown: 0x40000081, MediaPlayPause: 0x40000102,
  };
  if (named[e.key] !== undefined) return named[e.key];
  const f = e.key.match(/^F(\d{1,2})$/);
  if (f) {
    const n = Number(f[1]);
    return n <= 12 ? 0x4000003a + n - 1 : 0x40000068 + n - 13;
  }
  if (e.key.length === 1) return e.key.toLowerCase().charCodeAt(0);
  return null;
}

export const keyLabel = (hex) => {
  const code = parseInt(String(hex).replace(/^#|^0x/i, ''), 16);
  if (code === 0x1b) return 'Esc';
  if (code >= 0x4000003a && code <= 0x40000045) return `F${code - 0x4000003a + 1}`;
  if (code === 0x4000004a) return 'Home';
  if (code === 0x7f) return 'Delete';
  if (code >= 0x20 && code < 0x7f) return String.fromCharCode(code).toUpperCase();
  return String(hex);
};

export class Stage {
  constructor(root, { getState, getWallpapers, onEvent, onFocusChange }) {
    this.root = root;
    this.getState = getState;
    this.getWallpapers = getWallpapers;
    this.onEvent = onEvent;
    this.onFocusChange = onFocusChange;
    this.sim = { stack: [], index: {}, screen: 'launcher', app: null, power: null, saver: false, slide: 0 };
    this.lastInput = Date.now();
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    root.innerHTML = `
      <div class="screen" aria-hidden="true">
        <div class="bg bg-a"></div><div class="bg bg-b"></div>
        <div class="overlay"></div>
        <div class="launcher"></div>
        <div class="app-screen" hidden></div>
        <div class="saver"></div>
      </div>
      <p class="sr-only" aria-live="polite"></p>`;
    this.screen = root.querySelector('.screen');
    this.bgA = root.querySelector('.bg-a');
    this.bgB = root.querySelector('.bg-b');
    this.overlay = root.querySelector('.overlay');
    this.launcher = root.querySelector('.launcher');
    this.appScreen = root.querySelector('.app-screen');
    this.saverEl = root.querySelector('.saver');
    this.live = root.querySelector('[aria-live]');

    new ResizeObserver(() => this.fit()).observe(root);
    this.fit();
    setInterval(() => this.tick(), 1000);
  }

  fit() {
    const k = this.root.clientWidth / W;
    this.screen.style.transform = `scale(${k})`;
  }

  reset() {
    const s = this.getState().settings;
    this.sim.stack = [s.General.DefaultMenu];
    this.sim.index = {};
    this.sim.screen = 'launcher';
    this.sim.app = null;
    this.sim.power = null;
    this.render();
  }

  get menuName() {
    return this.sim.stack[this.sim.stack.length - 1];
  }

  get entries() {
    return this.getState().menus[this.menuName] || [];
  }

  get focus() {
    return Math.min(this.sim.index[this.menuName] || 0, Math.max(0, this.entries.length - 1));
  }

  set focus(i) {
    this.sim.index[this.menuName] = i;
  }

  // Returns true when the key was used, so the page does not scroll.
  handleKey(e) {
    const st = this.getState();
    const code = sdlKeycode(e);
    this.lastInput = Date.now();
    if (this.sim.saver) {
      this.sim.saver = false;
      this.log('Input wakes the screensaver');
      this.render();
      return true;
    }
    if (this.sim.screen === 'app') {
      if (e.key === 'Escape' || e.key === 'F10') {
        this.closeApp(e.key === 'F10' ? 'F10 (window manager: close window)' : 'Esc (the app closes itself)');
        return true;
      }
      this.log(`${e.key} goes to the app, not to the launcher`);
      return true;
    }
    if (this.sim.screen === 'desktop') {
      if (e.key === 'Home') {
        this.sim.screen = 'launcher';
        this.sim.stack = [st.settings.General.DefaultMenu];
        this.log('Home: launcher started again (needs a desktop shortcut on the box)');
        this.render();
      } else {
        this.log(`${e.key} on the desktop does nothing`);
      }
      return true;
    }
    if (this.sim.screen === 'power') {
      this.sim.screen = 'launcher';
      this.sim.power = null;
      this.log('Simulated power-on');
      this.render();
      return true;
    }

    const hotkey = code !== null && st.hotkeys.find((h) => h.key.startsWith('#') && parseInt(h.key.slice(1), 16) === code);
    if (hotkey) {
      this.log(`Hotkey ${keyLabel(hotkey.key)}: ${hotkey.cmd}`);
      this.run(hotkey.cmd, { title: keyLabel(hotkey.key), cmd: hotkey.cmd });
      return true;
    }
    const ignored = code !== null && st.hotkeys.find((h) => !h.key.startsWith('#') && parseInt(h.key.replace(/^0x/i, ''), 16) === code);
    if (ignored) {
      this.log(`${e.key}: hotkey "${ignored.key}" has no # prefix, so Flex Launcher ignores it`);
      return true;
    }

    switch (e.key) {
      case 'ArrowLeft': this.move(-1); return true;
      case 'ArrowRight': this.move(1); return true;
      case 'Enter': this.select(); return true;
      case 'Backspace': this.run(':back'); return true;
      default: return false;
    }
  }

  move(d) {
    const n = this.entries.length;
    if (!n) return;
    const wrap = this.getState().settings.General.WrapEntries;
    let i = this.focus + d;
    if (i < 0) i = wrap ? n - 1 : 0;
    if (i >= n) i = wrap ? 0 : n - 1;
    if (i === this.focus) return;
    this.focus = i;
    this.render();
    this.announce();
  }

  select() {
    const entry = this.entries[this.focus];
    if (!entry) return;
    this.log(`Enter: ${entry.title}`);
    this.run(entry.cmd, entry);
  }

  run(cmd, entry) {
    const st = this.getState();
    const c = cmd.trim();
    const sub = c.match(/^:submenu\s+(.+)$/);
    if (sub) {
      const name = sub[1].trim();
      if (!st.menus[name]) return this.log(`Submenu "${name}" does not exist; nothing happens`);
      this.sim.stack.push(name);
      if (st.settings.General.ResetOnBack) this.sim.index[name] = 0;
      this.log(`Open menu ${name}${st.menus[name].length ? '' : ' (empty)'}`);
    } else if (c === ':back') {
      if (this.sim.stack.length > 1) {
        const left = this.sim.stack.pop();
        if (st.settings.General.ResetOnBack) this.sim.index[left] = 0;
        this.log(`Back to ${this.menuName}`);
      } else return this.log('Back: already on the default menu');
    } else if (c === ':home') {
      this.sim.stack = [st.settings.General.DefaultMenu];
      this.log('Home menu');
    } else if (c === ':quit') {
      this.sim.screen = 'desktop';
      this.log('Flex Launcher quits: you are on the Xfce desktop');
    } else if (c === ':left' || c === ':right') {
      return this.move(c === ':left' ? -1 : 1);
    } else if (c === ':shutdown' || c === ':restart' || c === ':sleep') {
      this.sim.screen = 'power';
      this.sim.power = c.slice(1);
      this.log(`System ${c.slice(1)}`);
    } else if (!c) {
      return this.log('Entry has no command');
    } else {
      this.sim.screen = 'app';
      this.sim.app = entry;
      this.log(`Launch: ${c}`);
    }
    this.render();
    this.announce();
  }

  closeApp(how) {
    const onLaunch = this.getState().settings.General.OnLaunch;
    this.log(`${how}: ${this.sim.app?.title || 'app'} closed`);
    this.sim.app = null;
    if (onLaunch === 'Quit') {
      this.sim.screen = 'desktop';
      this.log('OnLaunch=Quit: the launcher had quit, so you are on the desktop');
    } else {
      this.sim.screen = 'launcher';
    }
    this.render();
  }

  idleNow() {
    const s = this.getState().settings.Screensaver;
    if (!s.Enabled) return this.log('Screensaver is off in settings');
    this.sim.saver = true;
    this.log(`Idle for ${s.IdleTime} s: screensaver dims to ${s.Intensity}%`);
    this.render();
  }

  /** Return the entry index under a client point, or null. */
  entryAt(clientX, clientY) {
    if (this.sim.screen !== 'launcher' || !this.hits) return null;
    const r = this.root.getBoundingClientRect();
    const k = r.width / W;
    const x = (clientX - r.left) / k;
    const y = (clientY - r.top) / k;
    const pad = 20;
    const hit = this.hits.find((h) => x >= h.x - pad && x <= h.x + h.w + pad && y >= h.y - pad && y <= h.y + h.h + pad);
    return hit ? hit.idx : null;
  }

  log(text) {
    this.onEvent?.(text);
  }

  announce() {
    const e = this.entries[this.focus];
    const msg = this.sim.screen === 'launcher' ? `${this.menuName}: ${e ? e.title : 'empty'}` : this.sim.screen;
    this.live.textContent = msg;
    this.onFocusChange?.(this.menuName, this.focus);
  }

  tick() {
    const st = this.getState();
    const s = st.settings;
    if (s.Screensaver.Enabled && !this.sim.saver && this.sim.screen === 'launcher' && Date.now() - this.lastInput > s.Screensaver.IdleTime * 1000) {
      this.sim.saver = true;
      this.render();
    }
    this.renderClock();
    const pause = this.sim.saver && s.Screensaver.PauseSlideshow;
    if (s.Background.Mode === 'Slideshow' && !pause) {
      this.slideClock = (this.slideClock || 0) + 1;
      if (this.slideClock >= s.Background.SlideshowImageDuration) {
        this.slideClock = 0;
        this.sim.slide += 1;
        this.renderBackground(true);
      }
    }
  }

  nextSlide() {
    this.slideClock = 0;
    this.sim.slide += 1;
    this.renderBackground(true);
  }

  // slideChange: only a slideshow step fades; edits in the studio swap at once.
  renderBackground(slideChange = false) {
    const s = this.getState().settings.Background;
    const walls = this.getWallpapers();
    let css = s.Color;
    let src = null;
    if (s.Mode === 'Image') {
      const file = (s.Image || '').split('/').pop();
      src = walls.find((w) => w.file === file)?.src || null;
    } else if (s.Mode === 'Slideshow' && walls.length) {
      src = walls[this.sim.slide % walls.length].src;
    } else if (s.Mode === 'Transparent') {
      css = 'repeating-conic-gradient(#2a2a2a 0 25%, #333 0 50%) 0 0 / 60px 60px';
    }
    const value = src ? `center / cover no-repeat url("${src}")` : css;
    const fade = this.reducedMotion.matches ? 0 : s.SlideshowTransitionTime;
    // Two layers cross-fade like the slideshow transition.
    const [front, back] = this.bgFront === this.bgA ? [this.bgB, this.bgA] : [this.bgA, this.bgB];
    if (this.lastBg === value) return;
    this.lastBg = value;
    front.style.transition = `opacity ${slideChange ? fade : 0}s ease`;
    back.style.transition = front.style.transition;
    front.style.background = value;
    front.style.opacity = '1';
    back.style.opacity = '0';
    this.bgFront = front;
  }

  renderClock() {
    const c = this.getState().settings.Clock;
    const el = this.launcher.querySelector('.clock');
    if (!el || !c.Enabled) return;
    const now = new Date();
    const h24 = c.TimeFormat === '24hr' || (c.TimeFormat === 'Auto' && !/am|pm/i.test(now.toLocaleTimeString()));
    const time = h24
      ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      : `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() < 12 ? 'AM' : 'PM'}`;
    const wd = c.IncludeWeekday ? `${now.toLocaleDateString('en-GB', { weekday: 'short' })} ` : '';
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const date = c.DateFormat === 'Big' ? `${wd}${now.getFullYear()}-${m}-${d}` : `${wd}${d}/${m}/${now.getFullYear()}`;
    el.querySelector('.t').textContent = time;
    const de = el.querySelector('.d');
    if (de) de.textContent = date;
  }

  iconFor(entry, selected) {
    const st = this.getState();
    if (entry.icon?.kind === 'upload' && entry.icon.data) return entry.icon.data;
    const size = st.settings.Layout.IconSize;
    return svgUrl(iconSvg(entry.icon || { kind: 'letter' }, st.look, { size, selected, title: entry.title }));
  }

  render() {
    const st = this.getState();
    const s = st.settings;
    this.renderBackground();
    this.overlay.style.background = s.Background.Overlay ? rgba(s.Background.OverlayColor, s.Background.OverlayOpacity) : 'transparent';
    this.saverEl.style.background = this.sim.saver ? `rgba(0,0,0,${s.Screensaver.Intensity / 100})` : 'transparent';
    this.renderApp(st);
    this.launcher.hidden = this.sim.screen !== 'launcher';
    if (this.sim.screen !== 'launcher') return;

    const L = s.Layout;
    const T = s.Titles;
    const Hl = s.Highlight;
    const per = Math.max(1, L.MaxButtons);
    const entries = this.entries;
    const focus = this.focus;
    const page = Math.floor(focus / per);
    const pages = Math.ceil(entries.length / per);
    const shown = entries.slice(page * per, page * per + per);
    const { size, spacing, x0, y0, blockH } = rowGeometry(s, shown.length);
    const family = fontFamily(T.Font);
    const useSelected = st.focus === 'icon' || st.focus === 'both';
    const showBox = Hl.Enabled;

    let html = '';
    this.hits = [];
    const C = s.Clock;
    if (C.Enabled) {
      const margin = dimPx(C.Margin, H);
      const shadow = C.Shadows ? `text-shadow: 3px 3px 0 ${rgba(C.ShadowColor, 100)};` : '';
      html += `<div class="clock" style="top:${margin}px;${C.Alignment === 'Right' ? 'right' : 'left'}:${margin}px;font-family:${fontFamily(C.Font)};font-size:${C.FontSize}px;color:${rgba(C.FontColor, C.Opacity)};${shadow}">
        <span class="t"></span>${C.ShowDate ? '<span class="d"></span>' : ''}</div>`;
    }

    if (!entries.length) {
      html += `<div class="empty-menu" style="top:${y0}px">[${esc(this.menuName)}] has no entries</div>`;
    }

    shown.forEach((entry, i) => {
      const idx = page * per + i;
      const x = x0 + i * (size + spacing);
      const sel = idx === focus;
      this.hits.push({ idx, x, y: y0, w: size, h: blockH });
      if (sel && showBox) {
        const radius = Hl.OutlineSize > 0 ? 0 : Hl.CornerRadius;
        html += `<div class="hl" style="left:${x - Hl.HPadding}px;top:${y0 - Hl.VPadding}px;width:${size + Hl.HPadding * 2}px;height:${blockH + Hl.VPadding * 2}px;background:${rgba(Hl.FillColor, Hl.FillOpacity)};border-radius:${radius}px;${Hl.OutlineSize > 0 ? `box-shadow: inset 0 0 0 ${Hl.OutlineSize}px ${rgba(Hl.OutlineColor, Hl.OutlineOpacity)};` : ''}"></div>`;
      }
      html += `<img class="ic" alt="" src="${this.iconFor(entry, sel && useSelected)}" style="left:${x}px;top:${y0}px;width:${size}px;height:${size}px">`;
      if (T.Enabled) {
        let fs = T.FontSize;
        let text = entry.title;
        const max = size + spacing * 0.8;
        const w = textWidth(text, fs, family);
        if (w > max && T.OversizeMode === 'Shrink') fs = Math.max(8, Math.floor(fs * (max / w)));
        const clip = T.OversizeMode === 'Truncate' ? 'overflow:hidden;text-overflow:ellipsis;' : '';
        const shadow = T.Shadows ? `text-shadow: 2px 2px 0 ${rgba(T.ShadowColor, 100)};` : '';
        html += `<div class="title" style="left:${x + size / 2 - max / 2}px;width:${max}px;top:${y0 + size + T.Padding}px;font-family:${family};font-size:${fs}px;color:${rgba(T.Color, T.Opacity)};${clip}${shadow}">${esc(text)}</div>`;
      }
    });

    const S = s['Scroll Indicators'];
    if (S.Enabled && pages > 1) {
      const ay = y0 + size / 2;
      const a = Math.round(size * 0.18);
      const tri = (dir) => `<svg class="arrow" style="${dir}:${W * 0.03}px;top:${ay - a}px;opacity:${S.Opacity / 100}" width="${a}" height="${a * 2}" viewBox="0 0 10 20"><path d="${dir === 'left' ? 'M10 0 L0 10 L10 20Z' : 'M0 0 L10 10 L0 20Z'}" fill="${S.FillColor}" stroke="${S.OutlineColor}" stroke-width="${S.OutlineSize ? S.OutlineSize / 4 : 0}"/></svg>`;
      if (page > 0) html += tri('left');
      if (page < pages - 1) html += tri('right');
    }

    this.launcher.innerHTML = html;
    this.renderClock();
  }

  renderApp(st) {
    const scr = this.sim.screen;
    this.appScreen.hidden = scr === 'launcher';
    this.appScreen.className = `app-screen ${scr}`;
    if (scr === 'app') {
      const e = this.sim.app || {};
      const appInfo = e.appId ? CATALOG_BY_ID[e.appId] : null;
      const icon = e.icon ? `<img alt="" src="${this.iconFor(e, false)}" width="180" height="180">` : '';
      const behind = st.settings.General.OnLaunch === 'None' ? 'Launcher keeps drawing behind the app.' : st.settings.General.OnLaunch === 'Quit' ? 'Launcher has quit.' : 'Launcher is blank and waits.';
      this.appScreen.innerHTML = `<div class="app-card">${icon}<h2>${esc(e.title || 'App')}</h2>
        <code>${esc(e.cmd || '')}</code>
        <p>${esc(appInfo?.note || 'Simulated app window.')}</p>
        <p class="muted">${behind} Esc: the app closes itself. F10: window manager closes it.</p></div>`;
    } else if (scr === 'desktop') {
      this.appScreen.innerHTML = `<div class="xfce-panel"><span>Applications</span><span>Places</span><span class="grow"></span><span>bbn</span></div>
        <div class="desk-icons"><span>Home</span><span>File System</span><span>Trash</span></div>
        <div class="app-card warn"><h2>Xfce desktop</h2><p>Flex Launcher has quit. On the box you now need the mini keyboard and mouse, or SSH.</p>
        <p class="muted">Press Home to start the launcher again. That needs a desktop shortcut on the box.</p></div>`;
    } else if (scr === 'power') {
      const words = { shutdown: 'Shutting down', restart: 'Restarting', sleep: 'Sleep' };
      this.appScreen.innerHTML = `<div class="app-card"><h2>${words[this.sim.power] || 'Power'}</h2><p class="muted">Simulation only. Press any key to come back.</p></div>`;
    } else {
      this.appScreen.innerHTML = '';
    }
  }
}
