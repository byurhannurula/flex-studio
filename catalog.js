// Apps people put on an HTPC home screen, with Linux commands.
// Flatpak IDs are from Flathub. Streaming services without a Linux app open
// in Google Chrome's app mode, which has the Widevine DRM they need.

const chrome = (url) => `flatpak run com.google.Chrome --start-fullscreen --app=${url}`;

// glyph: a key in GLYPHS (generic) — used when no brand glyph exists.
export const CATALOG = [
  { id: 'kodi', title: 'Kodi', brand: 'kodi', cmd: 'flatpak run tv.kodi.Kodi', group: 'Media' },
  { id: 'livetv', title: 'Live TV', glyph: 'tv', cmd: 'flatpak run tv.kodi.Kodi', group: 'Media', note: 'Opens Kodi; set Kodi to start in TV channels' },
  { id: 'jellyfin', title: 'Jellyfin', brand: 'jellyfin', cmd: 'flatpak run org.jellyfin.JellyfinDesktop', group: 'Media' },
  { id: 'plex', title: 'Plex', brand: 'plex', cmd: 'flatpak run tv.plex.PlexHTPC', group: 'Media' },
  { id: 'stremio', title: 'Stremio', brand: 'stremio', cmd: 'flatpak run com.stremio.Stremio', group: 'Media' },
  { id: 'vlc', title: 'VLC', brand: 'vlcmediaplayer', cmd: 'flatpak run org.videolan.VLC --fullscreen', group: 'Media' },
  { id: 'youtube', title: 'YouTube', brand: 'youtube', cmd: 'flatpak run rocks.shy.VacuumTube', group: 'Streaming', note: 'VacuumTube: YouTube TV interface' },
  { id: 'netflix', title: 'Netflix', brand: 'netflix', cmd: chrome('https://www.netflix.com'), group: 'Streaming', note: 'Chrome Flatpak; Linux browsers get 720p' },
  { id: 'primevideo', title: 'Prime Video', brand: 'primevideo', cmd: chrome('https://www.primevideo.com'), group: 'Streaming' },
  { id: 'disneyplus', title: 'Disney+', glyph: 'play', cmd: chrome('https://www.disneyplus.com'), group: 'Streaming', note: 'No free brand glyph; upload your own icon' },
  { id: 'max', title: 'Max', brand: 'max', cmd: chrome('https://play.max.com'), group: 'Streaming' },
  { id: 'appletv', title: 'Apple TV', brand: 'appletv', cmd: chrome('https://tv.apple.com'), group: 'Streaming' },
  { id: 'paramountplus', title: 'Paramount+', brand: 'paramountplus', cmd: chrome('https://www.paramountplus.com'), group: 'Streaming' },
  { id: 'crunchyroll', title: 'Crunchyroll', brand: 'crunchyroll', cmd: chrome('https://www.crunchyroll.com'), group: 'Streaming' },
  { id: 'twitch', title: 'Twitch', brand: 'twitch', cmd: chrome('https://www.twitch.tv'), group: 'Streaming' },
  { id: 'dazn', title: 'DAZN', brand: 'dazn', cmd: chrome('https://www.dazn.com'), group: 'Streaming' },
  { id: 'mubi', title: 'MUBI', brand: 'mubi', cmd: chrome('https://mubi.com'), group: 'Streaming' },
  { id: 'viaplay', title: 'Viaplay', brand: 'viaplay', cmd: chrome('https://viaplay.com'), group: 'Streaming' },
  { id: 'spotify', title: 'Spotify', brand: 'spotify', cmd: 'flatpak run com.spotify.Client', group: 'Music' },
  { id: 'tidal', title: 'Tidal', brand: 'tidal', cmd: chrome('https://listen.tidal.com'), group: 'Music' },
  { id: 'soundcloud', title: 'SoundCloud', brand: 'soundcloud', cmd: chrome('https://soundcloud.com'), group: 'Music' },
  { id: 'applemusic', title: 'Apple Music', brand: 'applemusic', cmd: chrome('https://music.apple.com'), group: 'Music' },
  { id: 'steam', title: 'Steam', brand: 'steam', cmd: 'flatpak run com.valvesoftware.Steam -gamepadui', group: 'Games', note: 'Starts in Big Picture mode' },
  { id: 'retroarch', title: 'RetroArch', brand: 'retroarch', cmd: 'flatpak run org.libretro.RetroArch', group: 'Games' },
  { id: 'moonlight', title: 'Moonlight', glyph: 'gamepad', cmd: 'flatpak run com.moonlight_stream.Moonlight', group: 'Games', note: 'Streams games from a gaming PC' },
  { id: 'airplay', title: 'AirPlay', brand: 'airplayvideo', cmd: 'uxplay -n HTPC -fs', group: 'Tools', note: 'UxPlay: mirror an iPhone or Mac' },
  { id: 'firefox', title: 'Firefox', brand: 'firefoxbrowser', cmd: 'firefox-esr', group: 'Tools' },
  { id: 'chrome', title: 'Chrome', brand: 'googlechrome', cmd: 'flatpak run com.google.Chrome --start-fullscreen', group: 'Tools' },
  { id: 'system', title: 'System', glyph: 'settings', cmd: ':submenu System', group: 'Launcher' },
  { id: 'back', title: 'Back', glyph: 'back', cmd: ':back', group: 'Launcher' },
  { id: 'desktop', title: 'Desktop', glyph: 'desktop', cmd: ':quit', group: 'Launcher', note: 'Quits the launcher on purpose; the Home key starts it again' },
  { id: 'restart', title: 'Restart', glyph: 'restart', cmd: ':restart', group: 'Launcher' },
  { id: 'shutdown', title: 'Shut down', glyph: 'power', cmd: ':shutdown', group: 'Launcher' },
  { id: 'sleep', title: 'Sleep', glyph: 'sleep', cmd: ':sleep', group: 'Launcher', note: 'Does nothing while sleep targets are masked' },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((a) => [a.id, a]));

// Match an existing entry to a catalog app by command, then by title.
export function matchCatalog(entry) {
  const cmd = entry.cmd.replace(/\s+/g, ' ').trim();
  const byCmd = CATALOG.find((a) => cmd.includes(a.cmd) || a.cmd.includes(cmd));
  if (byCmd && cmd) return byCmd;
  const t = entry.title.toLowerCase();
  return CATALOG.find((a) => a.title.toLowerCase() === t) || null;
}
