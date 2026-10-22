// Read and write Flex Launcher config.ini.
// Format reference: complexlogic.github.io/flex-launcher/configuration

export const SETTING_SECTIONS = [
  'General',
  'Background',
  'Layout',
  'Titles',
  'Highlight',
  'Scroll Indicators',
  'Clock',
  'Screensaver',
  'Hotkeys',
  'Gamepad',
];

// Every documented setting, with its type, so the form, the parser and the
// writer agree. Types: bool, int, num, pct, color, enum, path, dim (px or %), text.
export const SCHEMA = {
  General: {
    DefaultMenu: { type: 'text', def: 'Main' },
    VSync: { type: 'bool', def: true },
    FPSLimit: { type: 'int', def: null, min: 11, hint: 'Only when VSync is false. Above 10' },
    ApplicationTimeout: { type: 'int', def: 15, min: 3, max: 30, unit: 's' },
    OnLaunch: { type: 'enum', def: 'Blank', options: ['None', 'Blank', 'Quit'] },
    WrapEntries: { type: 'bool', def: false },
    ResetOnBack: { type: 'bool', def: false },
    MouseSelect: { type: 'bool', def: false },
    InhibitOSScreensaver: { type: 'bool', def: true },
    StartupCmd: { type: 'text', def: '' },
    QuitCmd: { type: 'text', def: '' },
  },
  Background: {
    Mode: { type: 'enum', def: 'Color', options: ['Color', 'Image', 'Slideshow', 'Transparent'] },
    Color: { type: 'color', def: '#000000' },
    Image: { type: 'path', def: '' },
    SlideshowDirectory: { type: 'path', def: '' },
    SlideshowImageDuration: { type: 'int', def: 30, min: 5, max: 3600, unit: 's' },
    SlideshowTransitionTime: { type: 'num', def: 3, min: 0, max: 3, unit: 's' },
    ChromaKeyColor: { type: 'color', def: '#010101' },
    Overlay: { type: 'bool', def: false },
    OverlayColor: { type: 'color', def: '#000000' },
    OverlayOpacity: { type: 'pct', def: 50 },
  },
  Layout: {
    MaxButtons: { type: 'int', def: 4, min: 1 },
    IconSize: { type: 'int', def: 256, min: 32, max: 1024, unit: 'px' },
    IconSpacing: { type: 'dim', def: '5%' },
    VCenter: { type: 'pct', def: 50, min: 25, max: 75 },
  },
  Titles: {
    Enabled: { type: 'bool', def: true },
    Font: { type: 'path', def: '' },
    FontSize: { type: 'int', def: 36 },
    Color: { type: 'color', def: '#FFFFFF' },
    Opacity: { type: 'pct', def: 100 },
    Shadows: { type: 'bool', def: false },
    ShadowColor: { type: 'color', def: '#000000' },
    // The docs say "Truncate" but 2.2 matches "Truncated"; either way it gets truncation, its default.
    OversizeMode: { type: 'enum', def: 'Truncate', options: ['Truncate', 'Shrink', 'None'] },
    Padding: { type: 'int', def: 20, min: 0, unit: 'px', hint: 'Half the icon size at most' },
  },
  Highlight: {
    Enabled: { type: 'bool', def: true },
    FillColor: { type: 'color', def: '#FFFFFF' },
    FillOpacity: { type: 'pct', def: 25 },
    OutlineSize: { type: 'int', def: 0, unit: 'px' },
    OutlineColor: { type: 'color', def: '#0000FF' },
    OutlineOpacity: { type: 'pct', def: 100 },
    CornerRadius: { type: 'int', def: 0, min: 0, max: 100, unit: 'px', hint: 'Ignored when OutlineSize > 0' },
    VPadding: { type: 'int', def: 30, unit: 'px' },
    HPadding: { type: 'int', def: 30, unit: 'px' },
  },
  'Scroll Indicators': {
    Enabled: { type: 'bool', def: true },
    FillColor: { type: 'color', def: '#FFFFFF' },
    OutlineSize: { type: 'int', def: 0, unit: 'px' },
    OutlineColor: { type: 'color', def: '#000000' },
    Opacity: { type: 'pct', def: 100 },
  },
  Clock: {
    Enabled: { type: 'bool', def: false },
    ShowDate: { type: 'bool', def: false },
    Alignment: { type: 'enum', def: 'Left', options: ['Left', 'Right'] },
    Font: { type: 'path', def: '' },
    FontSize: { type: 'int', def: 50 },
    Margin: { type: 'dim', def: '5%' },
    FontColor: { type: 'color', def: '#FFFFFF' },
    Shadows: { type: 'bool', def: false },
    ShadowColor: { type: 'color', def: '#000000' },
    Opacity: { type: 'pct', def: 100 },
    TimeFormat: { type: 'enum', def: 'Auto', options: ['24hr', '12hr', 'Auto'] },
    DateFormat: { type: 'enum', def: 'Auto', options: ['Little', 'Big', 'Auto'] },
    IncludeWeekday: { type: 'bool', def: true },
  },
  Screensaver: {
    Enabled: { type: 'bool', def: false },
    IdleTime: { type: 'int', def: 300, min: 3, max: 900, unit: 's' },
    Intensity: { type: 'pct', def: 70 },
    PauseSlideshow: { type: 'bool', def: true },
  },
};

export function defaultSettings() {
  const out = {};
  for (const [section, keys] of Object.entries(SCHEMA)) {
    out[section] = {};
    for (const [key, spec] of Object.entries(keys)) out[section][key] = spec.def;
  }
  return out;
}

function parseValue(spec, raw) {
  const v = raw.trim();
  switch (spec.type) {
    case 'bool':
      return v.toLowerCase() === 'true';
    case 'int':
      return v === '' ? null : parseInt(v, 10);
    case 'num':
      return v === '' ? null : parseFloat(v);
    case 'pct':
      return parseFloat(v.replace('%', ''));
    case 'color':
      return v.toUpperCase();
    default:
      return v;
  }
}

function formatValue(spec, value) {
  if (spec.type === 'bool') return value ? 'true' : 'false';
  if (spec.type === 'pct') return `${value}%`;
  return String(value);
}

// "Title;Icon;Command" — the command is everything after the second ";",
// because shell commands often contain ";" themselves. On Linux a
// ".desktop" command may carry a fourth field with the action name.
export function parseEntry(value) {
  const first = value.indexOf(';');
  const second = value.indexOf(';', first + 1);
  if (first < 0 || second < 0) return { title: value, iconPath: '', cmd: '' };
  const title = value.slice(0, first);
  const iconPath = value.slice(first + 1, second);
  let cmd = value.slice(second + 1);
  let action = '';
  const desktop = cmd.match(/^(\S+\.desktop);([^;]+)$/);
  if (desktop) {
    cmd = desktop[1];
    action = desktop[2];
  }
  return { title, iconPath, cmd, action };
}

export function parseIni(text) {
  const settings = defaultSettings();
  const menus = {};
  const hotkeys = [];
  const gamepad = [];
  const unknown = [];
  let section = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const head = line.match(/^\[(.+)\]$/);
    if (head) {
      section = head[1];
      if (!SETTING_SECTIONS.includes(section)) menus[section] ??= [];
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0 || !section) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (section === 'Hotkeys') {
      const semi = value.indexOf(';');
      hotkeys.push({ key: value.slice(0, semi).trim(), cmd: value.slice(semi + 1).trim() });
    } else if (section === 'Gamepad') {
      gamepad.push({ input: key, cmd: value.trim() });
    } else if (SCHEMA[section]) {
      const spec = SCHEMA[section][key];
      if (spec) settings[section][key] = parseValue(spec, value);
      else unknown.push(`${section}.${key}`);
    } else {
      menus[section].push(parseEntry(value));
    }
  }
  return { settings, menus, hotkeys, gamepad, unknown };
}

export function writeIni({ settings, menus, hotkeys, gamepad }, { header } = {}) {
  const out = [];
  if (header) out.push(...header.map((h) => `# ${h}`), '');
  for (const [section, keys] of Object.entries(SCHEMA)) {
    out.push(`[${section}]`);
    for (const [key, spec] of Object.entries(keys)) {
      const value = settings[section][key];
      // Unset optional values stay out of the file so Flex Launcher uses its default.
      if (value === null || value === undefined || value === '') continue;
      out.push(`${key}=${formatValue(spec, value)}`);
    }
    out.push('');
  }
  out.push('[Hotkeys]');
  hotkeys.forEach((h, i) => out.push(`Hotkey${i + 1}=${h.key};${h.cmd}`));
  out.push('');
  out.push('[Gamepad]');
  for (const g of gamepad) out.push(`${g.input}=${g.cmd}`);
  out.push('');
  for (const [name, entries] of Object.entries(menus)) {
    out.push(`[${name}]`);
    entries.forEach((e, i) => {
      const cmd = e.action ? `${e.cmd};${e.action}` : e.cmd;
      out.push(`Entry${i + 1}=${e.title};${e.iconPath};${cmd}`);
    });
    out.push('');
  }
  return out.join('\n');
}

const pxOf = (value, total) => {
  const v = String(value ?? '');
  return Math.trunc(v.endsWith('%') ? (parseFloat(v) / 100) * total : parseFloat(v) || 0);
};

// What Flex Launcher 2.2 does with these values when it starts, from
// src/util.c (config_handler and the geometry checks after it). Values out
// of range fall back to the default, and some sizes are clamped or shrunk to
// fit the screen. The preview draws the result, so it matches the TV.
export function flexResolve(settings, screen = { w: 1920, h: 1080 }) {
  const s = structuredClone(settings);
  const notes = [];
  const note = (where, from, to, why) => notes.push({ where, text: `${from} becomes ${to}: ${why}` });
  const range = (sec, key, min, max, unit = '') => {
    const v = s[sec][key];
    if (v === null || v === undefined || v === '' || (v >= min && v <= max)) return;
    const def = SCHEMA[sec][key].def;
    note(
      `${sec} ${key}`,
      `${v}${unit}`,
      def === null ? 'unset' : `${def}${unit}`,
      `Flex Launcher accepts ${min} to ${max}${unit} and ignores other values.`,
    );
    s[sec][key] = def;
  };
  range('General', 'ApplicationTimeout', 3, 30, ' s');
  if (s.General.FPSLimit !== null && s.General.FPSLimit <= 10) {
    note('General FPSLimit', s.General.FPSLimit, 'unset', 'Flex Launcher needs a value above 10.');
    s.General.FPSLimit = null;
  }
  range('Layout', 'IconSize', 32, 1024, ' px');
  range('Background', 'SlideshowImageDuration', 5, 3600, ' s');
  range('Background', 'SlideshowTransitionTime', 0, 3, ' s');
  range('Highlight', 'CornerRadius', 0, 100, ' px');
  range('Screensaver', 'IdleTime', 3, 900, ' s');

  const vc = Math.min(75, Math.max(25, s.Layout.VCenter));
  if (vc !== s.Layout.VCenter)
    note('Layout VCenter', `${s.Layout.VCenter}%`, `${vc}%`, 'Flex Launcher keeps the row between 25% and 75% of the screen height.');
  s.Layout.VCenter = vc;

  const marginMax = Math.trunc(screen.h * 0.1);
  if (pxOf(s.Clock.Margin, screen.h) > marginMax) {
    note('Clock Margin', s.Clock.Margin, `${marginMax} px`, 'the margin can be 10% of the screen height at most.');
    s.Clock.Margin = String(marginMax);
  }

  const size = s.Layout.IconSize;
  const per = Math.max(1, s.Layout.MaxButtons);
  let spacing = pxOf(s.Layout.IconSpacing, screen.w);
  let hpad = s.Highlight.HPadding;
  // HPadding still counts in the width check with the highlight off, but nobody sees it then.
  const hlOn = s.Highlight.Enabled;
  if (hpad > Math.trunc(spacing / 2)) {
    if (hlOn)
      note(
        'Highlight HPadding',
        `${hpad} px`,
        `${Math.trunc(spacing / 2)} px`,
        'it can be half the icon spacing at most, so focus boxes do not overlap.',
      );
    hpad = Math.trunc(spacing / 2);
  }
  const width = () => (per - 1) * spacing + per * size + 2 * hpad;
  const spacing0 = spacing;
  const hpad0 = hpad;
  for (let i = 0; i < 100 && width() > screen.w; i++) {
    hpad = Math.trunc((hpad * 9) / 10);
    spacing = Math.trunc((spacing * 9) / 10);
  }
  if (spacing !== spacing0)
    note('Layout IconSpacing', `${spacing0} px`, `${spacing} px`, `${per} icons of ${size} px do not fit on the screen.`);
  if (hpad !== hpad0 && hlOn) note('Highlight HPadding', `${hpad0} px`, `${hpad} px`, 'the row does not fit on the screen.');
  if (spacing !== pxOf(s.Layout.IconSpacing, screen.w)) s.Layout.IconSpacing = String(spacing);
  s.Highlight.HPadding = hpad;

  if (s.Titles.Padding < 0 || s.Titles.Padding > Math.trunc(size / 2)) {
    const p = Math.trunc(size / 10);
    note('Titles Padding', `${s.Titles.Padding} px`, `${p} px`, 'it must be between 0 and half the icon size.');
    s.Titles.Padding = p;
  }
  const outlineMax = Math.min(s.Highlight.HPadding, s.Highlight.VPadding);
  if (s.Highlight.OutlineSize > outlineMax) {
    if (hlOn)
      note(
        'Highlight OutlineSize',
        `${s.Highlight.OutlineSize} px`,
        `${outlineMax} px`,
        'it can be the smaller highlight padding at most.',
      );
    s.Highlight.OutlineSize = outlineMax;
  }
  if (s.Highlight.OutlineSize > 0) s.Highlight.CornerRadius = 0;
  const scrollMax = Math.trunc(screen.h * 0.01);
  if (s['Scroll Indicators'].OutlineSize > scrollMax) {
    note(
      'Scroll Indicators OutlineSize',
      `${s['Scroll Indicators'].OutlineSize} px`,
      `${scrollMax} px`,
      'it can be 1% of the screen height at most.',
    );
    s['Scroll Indicators'].OutlineSize = scrollMax;
  }
  return { settings: s, notes };
}
