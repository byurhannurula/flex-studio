// Read and write Flex Launcher config.ini.
// Format reference: complexlogic.github.io/flex-launcher/configuration

export const SETTING_SECTIONS = [
  'General', 'Background', 'Layout', 'Titles', 'Highlight',
  'Scroll Indicators', 'Clock', 'Screensaver', 'Hotkeys', 'Gamepad',
];

// Every documented setting, with its type, so the form, the parser and the
// writer agree. Types: bool, int, num, pct, color, enum, path, dim (px or %), text.
export const SCHEMA = {
  General: {
    DefaultMenu: { type: 'text', def: 'Main' },
    VSync: { type: 'bool', def: true },
    FPSLimit: { type: 'int', def: null, hint: 'Only when VSync is false' },
    ApplicationTimeout: { type: 'int', def: 15, unit: 's' },
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
    SlideshowImageDuration: { type: 'int', def: 30, unit: 's' },
    SlideshowTransitionTime: { type: 'num', def: 3, unit: 's' },
    ChromaKeyColor: { type: 'color', def: '#010101' },
    Overlay: { type: 'bool', def: false },
    OverlayColor: { type: 'color', def: '#000000' },
    OverlayOpacity: { type: 'pct', def: 50 },
  },
  Layout: {
    MaxButtons: { type: 'int', def: 4 },
    IconSize: { type: 'int', def: 256, unit: 'px' },
    IconSpacing: { type: 'dim', def: '5%' },
    VCenter: { type: 'pct', def: 50 },
  },
  Titles: {
    Enabled: { type: 'bool', def: true },
    Font: { type: 'path', def: '' },
    FontSize: { type: 'int', def: 36 },
    Color: { type: 'color', def: '#FFFFFF' },
    Opacity: { type: 'pct', def: 100 },
    Shadows: { type: 'bool', def: false },
    ShadowColor: { type: 'color', def: '#000000' },
    OversizeMode: { type: 'enum', def: 'Truncate', options: ['Truncate', 'Shrink', 'None'] },
    Padding: { type: 'int', def: 20, unit: 'px' },
  },
  Highlight: {
    Enabled: { type: 'bool', def: true },
    FillColor: { type: 'color', def: '#FFFFFF' },
    FillOpacity: { type: 'pct', def: 25 },
    OutlineSize: { type: 'int', def: 0, unit: 'px' },
    OutlineColor: { type: 'color', def: '#0000FF' },
    OutlineOpacity: { type: 'pct', def: 100 },
    CornerRadius: { type: 'int', def: 0, unit: 'px', hint: 'Ignored when OutlineSize > 0' },
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
    IdleTime: { type: 'int', def: 300, unit: 's' },
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
    case 'bool': return v.toLowerCase() === 'true';
    case 'int': return v === '' ? null : parseInt(v, 10);
    case 'num': return v === '' ? null : parseFloat(v);
    case 'pct': return parseFloat(v.replace('%', ''));
    case 'color': return v.toUpperCase();
    default: return v;
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
  if (desktop) { cmd = desktop[1]; action = desktop[2]; }
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
