import { DEFAULT_BASE } from './presets.js';
import { SETTING_SECTIONS, flexResolve } from './ini.js';

// SDL keycodes Flex Launcher keeps for its own controls: Left, Right, Enter, Backspace.
const RESERVED_KEYS = { '4000004F': 'Right arrow', 40000050: 'Left arrow', D: 'Enter', 8: 'Backspace' };

// Each check returns {level: 'error'|'warn'|'info', where, text}.
// "error" = Flex Launcher cannot use it; "warn" = it works but hurts the experience.
// Checks read only the config. They do not guess what the HTPC has installed.
export function runChecks(state) {
  const out = [];
  const { settings: s, menus, hotkeys } = state;
  const add = (level, where, text) => out.push({ level, where, text });
  const menuNames = Object.keys(menus);

  for (const h of hotkeys) {
    if (!h.key.startsWith('#')) {
      add('error', `Hotkey ${h.key}`, 'Keycode must be hex with a "#" prefix (for example #4000003A). Flex Launcher ignores this hotkey.');
    }
    const reserved = RESERVED_KEYS[h.key.replace(/^#/, '').replace(/^0+/, '').toUpperCase()];
    if (reserved)
      add('error', `Hotkey ${h.key}`, `${reserved} is one of the launcher's own keys. Flex Launcher does not allow it as a hotkey.`);
    if (/^#?(0x)?1B$/i.test(h.key) && h.cmd.trim() === ':quit') {
      add('warn', 'Hotkey Esc', 'Esc quits the launcher. One extra press in an app leaves you on the desktop with no way back by remote.');
    }
    commandChecks(state, h.cmd.trim(), `Hotkey ${h.key}`, add);
  }

  for (const [name, entries] of Object.entries(menus)) {
    if (SETTING_SECTIONS.includes(name)) add('error', `[${name}]`, `"${name}" is a settings section, so it cannot be a menu name.`);
    if (!entries.length) add('warn', `[${name}]`, 'Menu is empty. Opening it shows a blank screen.');
    const icons = new Map();
    entries.forEach((e, i) => {
      const where = `${name} / ${e.title || `Entry${i + 1}`}`;
      const cmd = e.cmd.trim();
      if (!cmd) add('error', where, 'No command.');
      // Flex splits the line with strtok, which skips empty fields, so an empty title or icon path shifts the fields and the entry is lost.
      if (!e.title.trim()) add('error', where, 'No title. Flex Launcher skips an entry with an empty title.');
      if ((!e.icon || e.icon.kind === 'keep') && !e.iconPath)
        add('error', where, 'No icon. Flex Launcher skips an entry with an empty icon path. Pick an icon.');
      const sub = cmd.match(/^:submenu\s+(.+)$/);
      if (sub && !menuNames.includes(sub[1].trim())) add('error', where, `Submenu "${sub[1]}" does not exist.`);
      commandChecks(state, cmd, where, add);
      if (cmd === ':select') add('error', where, ':select works only for keys and controller buttons, not in a menu entry.');
      if (/^:fork\s*$/.test(cmd)) add('error', where, ':fork needs a command after it.');
      if (/wmctrl/.test(cmd)) add('info', where, 'Uses wmctrl after a fixed sleep to go full screen. It fails if the app starts slowly.');
      const key = iconKey(e);
      if (key) icons.set(key, (icons.get(key) || 0) + 1);
    });
    for (const [k, n] of icons)
      if (n > 1 && k.startsWith('path:')) add('info', `[${name}]`, `${n} entries share the icon ${k.slice(5).split('/').pop()}.`);
  }

  const L = s.Layout;
  if (L.MaxButtons * L.IconSize > 1920)
    add('error', 'Layout', `${L.MaxButtons} icons of ${L.IconSize} px are wider than a 1920 px screen, even with no spacing.`);
  for (const n of flexResolve(s).notes) add('warn', n.where, n.text);
  if (s.Highlight.OutlineSize > 0 && s.Highlight.CornerRadius > 0)
    add('info', 'Highlight', 'CornerRadius is ignored while OutlineSize > 0.');
  if (!s.Highlight.Enabled && state.focus !== 'icon' && state.focus !== 'both') {
    add('error', 'Highlight', 'Highlight is off and there are no _selected icons, so you cannot see which entry has focus.');
  }
  if (state.dock?.on && !['Image', 'Slideshow'].includes(s.Background.Mode)) {
    add('warn', 'Glass dock', 'The dock is drawn into the wallpaper, so it needs an Image or Slideshow background. It is off now.');
  }
  if (state.dock?.on && s.Highlight.Enabled && s.Highlight.VPadding > state.dock.padY) {
    add('info', 'Glass dock', 'The highlight box is taller than the dock plate and sticks out of it. Make the plate padding larger.');
  }
  if (state.wall && state.wall.fx !== 'none' && !['Image', 'Slideshow'].includes(s.Background.Mode)) {
    add('warn', 'Wallpaper effect', 'The effect needs an image or slideshow background. With a colour background it is not drawn.');
  }
  if (state.basePath === DEFAULT_BASE) {
    add('warn', 'Install folder', `Paths use ${DEFAULT_BASE}. Set your real folder in Config, because Flex Launcher does not expand "~".`);
  }
  if (state.dock?.on) add('info', 'Glass dock', 'The plate lines up only on a 1920x1080 screen. Export again after you change the layout.');
  if (s.General.OnLaunch === 'Quit') add('warn', 'General', 'OnLaunch=Quit: when an app closes you land on the desktop.');
  if (!s.General.InhibitOSScreensaver) add('warn', 'General', 'The OS screensaver can blank the TV while the launcher shows.');
  if (s.Background.Mode === 'Image' && !s.Background.Image) add('error', 'Background', 'Mode is Image but no image is set.');
  if (s.Background.Mode === 'Slideshow' && !s.Background.SlideshowDirectory)
    add('error', 'Background', 'Mode is Slideshow but no folder is set.');
  if (!menuNames.includes(s.General.DefaultMenu)) add('error', 'General', `DefaultMenu "${s.General.DefaultMenu}" does not exist.`);
  if (
    !hotkeys.some((h) => h.cmd.trim() === ':quit') &&
    !Object.values(menus)
      .flat()
      .some((e) => e.cmd.trim() === ':quit')
  ) {
    add('info', 'Launcher', 'No way to reach the desktop from the remote. Add a Desktop entry (:quit) to the System menu if you need one.');
  }
  out.push({
    level: 'info',
    where: 'Closing apps',
    text: 'Flex Launcher cannot close apps. Bind a window-manager key (for example F10 = close window) so the remote can always get back.',
  });
  return out;
}

function commandChecks(state, cmd, where, add) {
  // The INI reader (inih) can take " ;" as the start of a comment and cut the rest of the line.
  if (/\s;/.test(cmd))
    add(
      'warn',
      where,
      'A space before ";" can start a comment, so Flex Launcher may lose the rest of the command. Remove the space or join steps with &&.',
    );
  if (/^:exit\b/.test(cmd)) add('error', where, ':exit works only on Windows.');
  if (cmd.startsWith(':fork ')) cmd = cmd.slice(6).trim();
  if (/flatpak run\s+flatpak run/.test(cmd)) add('error', where, '"flatpak run" is written twice.');
  if (cmd.startsWith(':') && !/^:(submenu|fork|back|home|quit|left|right|select|shutdown|restart|sleep|exit)\b/.test(cmd)) {
    add('error', where, `"${cmd.split(/\s/)[0]}" is not a Flex Launcher command.`);
  }
}

function iconKey(e) {
  if (e.icon?.kind === 'upload') return null;
  return e.iconPath ? `path:${e.iconPath}` : null;
}
