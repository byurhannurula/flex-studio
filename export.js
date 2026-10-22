import { writeIni } from './ini.js';
import { iconSvg, svgUrl, rasterize } from './icons.js';
import { makeZip } from './zip.js';
import { dockActive, wallFxActive, wallsMade, WALL_FX } from './dock.js';

export const assetPath = (state, sub, file) => `${state.basePath.replace(/\/$/, '')}/assets/${sub}${file ? `/${file}` : ''}`;

// Redrawn wallpapers go to their own folder: a slideshow folder that mixed
// them with the plain originals would show the plate or effect only on some slides.
export const BG_DIR = (state) => (wallsMade(state) ? 'bg-studio' : 'bg');
// Composited wallpapers are always JPEG.
const bgName = (state, f) => (wallsMade(state) ? f.replace(/\.[^.]+$/, '.jpg') : f);

function effectiveSettings(state) {
  const s = structuredClone(state.settings);
  const dir = BG_DIR(state);
  const file = bgName(state, (s.Background.Image || '').split('/').pop());
  if (s.Background.Mode === 'Image' && file) s.Background.Image = assetPath(state, dir, file);
  if (s.Background.Mode === 'Slideshow') s.Background.SlideshowDirectory = assetPath(state, dir);
  return s;
}

function slugify(title, taken) {
  const base = (title || 'entry').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entry';
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

// Give every studio-made icon a file name. "keep" icons are files that
// already exist on the box, so their path stays as it was.
export function planIcons(state) {
  const taken = new Set();
  const plan = [];
  const menus = {};
  for (const [name, entries] of Object.entries(state.menus)) {
    menus[name] = entries.map((e) => {
      if (!e.icon || e.icon.kind === 'keep') return { ...e };
      const slug = slugify(e.title, taken);
      plan.push({ entry: e, slug });
      return { ...e, iconPath: assetPath(state, 'icons', `${slug}.png`) };
    });
  }
  return { menus, plan };
}

export function configText(state) {
  const { menus } = planIcons(state);
  const header = [
    'Flex Launcher 2.2 config, made with Flex Studio',
    'Docs: https://complexlogic.github.io/flex-launcher/configuration',
  ];
  if (state.focus === 'icon' || state.focus === 'both') header.push('Focus uses <icon>_selected.png files next to each icon.');
  if (dockActive(state)) header.push('The glass dock is drawn into the wallpapers in assets/bg-studio for a 1920x1080 screen. Export again after a layout change.');
  if (wallFxActive(state)) header.push(`Wallpaper effect "${WALL_FX[state.wall.fx]}" is drawn into the wallpapers in assets/bg-studio.`);
  return writeIni({ settings: effectiveSettings(state), menus, hotkeys: state.hotkeys, gamepad: state.gamepad }, { header });
}

async function bytes(src) {
  const res = await fetch(src);
  return new Uint8Array(await res.arrayBuffer());
}

const blobBytes = async (b) => new Uint8Array(await b.arrayBuffer());

export async function exportBundle(state, wallpapers) {
  const size = state.settings.Layout.IconSize;
  const withSelected = state.focus === 'icon' || state.focus === 'both';
  const { plan } = planIcons(state);
  const files = [{ name: 'flex-launcher/config.ini', data: new TextEncoder().encode(configText(state)) }];

  for (const { entry, slug } of plan) {
    const src = (selected) => entry.icon.kind === 'upload'
      ? entry.icon.data
      : svgUrl(iconSvg(entry.icon, state.look, { size, selected, title: entry.title }));
    files.push({ name: `flex-launcher/assets/icons/${slug}.png`, data: await blobBytes(await rasterize(src(false), size)) });
    if (withSelected) files.push({ name: `flex-launcher/assets/icons/${slug}_selected.png`, data: await blobBytes(await rasterize(src(true), size)) });
  }

  const bg = state.settings.Background;
  const wanted = bg.Mode === 'Slideshow' ? wallpapers : bg.Mode === 'Image' ? wallpapers.filter((w) => bg.Image.endsWith(`/${w.file}`)) : [];
  // With a plate or an effect, the caller passes composited wallpapers.
  const dir = BG_DIR(state);
  for (const w of wanted) files.push({ name: `flex-launcher/assets/${dir}/${bgName(state, w.file)}`, data: await bytes(w.src) });

  const fonts = new Set([state.settings.Titles.Font, state.settings.Clock.Font].filter(Boolean).map((p) => p.split('/').pop()));
  for (const f of fonts) {
    try {
      files.push({ name: `flex-launcher/assets/fonts/${f}`, data: await bytes(`assets/fonts/${f}`) });
    } catch {
      // A font that is not bundled here is expected to exist on the box already.
    }
  }

  files.push({
    name: 'flex-launcher/INSTALL.txt',
    data: new TextEncoder().encode([
      `Copy this folder to ${state.basePath} on the HTPC, for example:`,
      `  scp -r flex-launcher/* bbn@10.96.3.99:${state.basePath}/`,
      'Keep a copy of the old config.ini first. Then restart Flex Launcher.',
      '',
    ].join('\n')),
  });
  return makeZip(files);
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
