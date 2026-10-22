// Apps people put on an HTPC home screen, with Linux commands.
// Flatpak IDs are from Flathub. Streaming services without a Linux app open
// in Google Chrome's app mode, which has the Widevine DRM they need.

const chrome = (url) => `flatpak run com.google.Chrome --start-fullscreen --app=${url}`;

// Actions run with :fork, so the launcher stays on screen. Each command uses
// common tools: wpctl and pactl (PipeWire), cec-client (cec-utils) and xset
// (x11-xserver-utils). Install those packages on the HTPC first. No ";" is allowed, because it separates fields in an
// Entry line, so steps are joined with "&&".
const fork = (cmd) => `:fork ${cmd}`;
const cec = (msg) => fork(`sh -c 'echo ${msg} | cec-client -s -d 1'`);
const SINK = '@DEFAULT_AUDIO_SINK@';
export const ACTIONS = {
  volumeUp: { title: 'Volume up', glyph: 'volumeUp', cmd: fork(`wpctl set-volume -l 1.0 ${SINK} 5%+`) },
  volumeDown: { title: 'Volume down', glyph: 'volumeDown', cmd: fork(`wpctl set-volume ${SINK} 5%-`) },
  mute: { title: 'Mute', glyph: 'mute', cmd: fork(`wpctl set-mute ${SINK} toggle`) },
  nextOutput: {
    title: 'Next audio output', glyph: 'speaker', note: 'Moves sound to the next output, for example TV to soundbar',
    cmd: fork(`sh -c 'c=$(pactl get-default-sink) && n=$(pactl list short sinks | cut -f2 | grep -vx "$c" | head -n1) && pactl set-default-sink "$n"'`),
  },
  tvOff: { title: 'TV off', glyph: 'screenOff', cmd: cec('standby 0'), note: 'HDMI-CEC standby; the TV must allow CEC' },
  tvOn: { title: 'TV on', glyph: 'tvMinimal', cmd: cec('on 0') },
  tvInput: { title: 'Switch TV to HTPC', glyph: 'cast', cmd: cec('as'), note: 'Makes the HTPC the active TV input' },
  screenOff: { title: 'Screen off', glyph: 'night', cmd: fork('xset dpms force off'), note: 'Any key wakes the screen' },
};

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
  { id: 'tubi', title: 'Tubi', brand: 'tubi', cmd: chrome('https://tubitv.com'), group: 'Streaming' },
  { id: 'nebula', title: 'Nebula', brand: 'nebula', cmd: chrome('https://nebula.tv'), group: 'Streaming' },
  { id: 'vimeo', title: 'Vimeo', brand: 'vimeo', cmd: chrome('https://vimeo.com'), group: 'Streaming' },
  { id: 'kick', title: 'Kick', brand: 'kick', cmd: chrome('https://kick.com'), group: 'Streaming' },
  { id: 'emby', title: 'Emby', brand: 'emby', cmd: chrome('http://localhost:8096'), group: 'Media', note: 'Change the address to your Emby server' },
  { id: 'youtubemusic', title: 'YouTube Music', brand: 'youtubemusic', cmd: chrome('https://music.youtube.com'), group: 'Music' },
  { id: 'deezer', title: 'Deezer', brand: 'deezer', cmd: chrome('https://www.deezer.com'), group: 'Music' },
  { id: 'pocketcasts', title: 'Pocket Casts', brand: 'pocketcasts', cmd: chrome('https://play.pocketcasts.com'), group: 'Music' },
  { id: 'audible', title: 'Audible', brand: 'audible', cmd: chrome('https://www.audible.com'), group: 'Music' },
  { id: 'heroic', title: 'Heroic', brand: 'heroicgameslauncher', cmd: 'flatpak run com.heroicgameslauncher.hgl', group: 'Games', note: 'Epic and GOG games' },
  { id: 'lutris', title: 'Lutris', brand: 'lutris', cmd: 'flatpak run net.lutris.Lutris', group: 'Games' },
  { id: 'discord', title: 'Discord', brand: 'discord', cmd: 'flatpak run com.discordapp.Discord', group: 'Tools' },
  { id: 'homeassistant', title: 'Home Assistant', brand: 'homeassistant', cmd: chrome('http://homeassistant.local:8123'), group: 'Tools' },
  { id: 'immich', title: 'Photos', brand: 'immich', cmd: chrome('http://immich.local:2283'), group: 'Tools', note: 'Change the address to your Immich server' },
  // Less-known apps, all on Flathub.
  { id: 'feishin', title: 'Feishin', glyph: 'music2', cmd: 'flatpak run org.jeffvli.feishin', group: 'Music', note: 'Navidrome and Jellyfin music client' },
  { id: 'supersonic', title: 'Supersonic', glyph: 'headphones', cmd: 'flatpak run io.github.dweymouth.supersonic', group: 'Music', note: 'Navidrome and Subsonic client' },
  { id: 'sublimemusic', title: 'Sublime Music', glyph: 'music', cmd: 'flatpak run app.sublimemusic.SublimeMusic', group: 'Music', note: 'Subsonic and Navidrome client' },
  { id: 'spotube', title: 'Spotube', glyph: 'music2', cmd: 'flatpak run com.github.KRTirtho.Spotube', group: 'Music', note: 'Spotify client without ads' },
  { id: 'plexamp', title: 'Plexamp', glyph: 'headphones', cmd: 'flatpak run com.plexamp.Plexamp', group: 'Music' },
  { id: 'strawberry', title: 'Strawberry', glyph: 'music', cmd: 'flatpak run org.strawberrymusicplayer.strawberry', group: 'Music', note: 'Local music library player' },
  { id: 'shortwave', title: 'Radio', glyph: 'radio', cmd: 'flatpak run de.haeckerfelix.Shortwave', group: 'Music', note: 'Shortwave: internet radio stations' },
  { id: 'kasts', title: 'Podcasts', glyph: 'podcast', cmd: 'flatpak run org.kde.kasts', group: 'Music', note: 'Kasts: podcast player' },
  { id: 'freetube', title: 'FreeTube', brand: 'freetube', cmd: 'flatpak run io.freetubeapp.FreeTube', group: 'Streaming', note: 'YouTube without ads or an account' },
  { id: 'grayjay', title: 'Grayjay', glyph: 'video', cmd: 'flatpak run app.grayjay.Grayjay', group: 'Streaming', note: 'YouTube, PeerTube and more in one app' },
  { id: 'delfin', title: 'Delfin', glyph: 'film', cmd: 'flatpak run cafe.avery.Delfin', group: 'Media', note: 'Light Jellyfin client' },
  { id: 'celluloid', title: 'Celluloid', glyph: 'monitorPlay', cmd: 'flatpak run io.github.celluloid_player.Celluloid', group: 'Media', note: 'Simple mpv video player' },
  { id: 'steamlink', title: 'Steam Link', glyph: 'cast', cmd: 'flatpak run com.valvesoftware.SteamLink', group: 'Games', note: 'Streams games from a PC with Steam' },
  { id: 'cartridges', title: 'Cartridges', glyph: 'joystick', cmd: 'flatpak run page.kramo.Cartridges', group: 'Games', note: 'One library for Steam, Heroic, Lutris and more' },
  { id: 'dolphin', title: 'Dolphin', glyph: 'gamepad', cmd: 'flatpak run org.DolphinEmu.dolphin-emu', group: 'Games', note: 'GameCube and Wii emulator' },
  { id: 'ppsspp', title: 'PPSSPP', glyph: 'gamepad', cmd: 'flatpak run org.ppsspp.PPSSPP', group: 'Games', note: 'PSP emulator' },
  ...Object.entries(ACTIONS).map(([id, a]) => ({ id, ...a, group: 'Actions' })),
  { id: 'quick', title: 'Quick settings', glyph: 'sliders', cmd: ':submenu Quick settings', group: 'Launcher' },
  { id: 'home', title: 'Home', glyph: 'home', cmd: ':home', group: 'Launcher', note: 'Goes to the default menu' },
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
