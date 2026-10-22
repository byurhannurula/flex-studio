// Private presets for one HTPC: real paths, user name and installed apps.
// Keep this file out of a published copy; the app works without it.
export const BOX_CONFIG = `[General]
DefaultMenu=Main
VSync=true
ApplicationTimeout=15
OnLaunch=Blank
WrapEntries=false
ResetOnBack=false
MouseSelect=false
InhibitOSScreensaver=true

[Background]
Mode=Slideshow
SlideshowDirectory=/home/bbn/.config/flex-launcher/assets/bg
Overlay=true
OverlayColor=#000000
OverlayOpacity=60%

[Layout]
MaxButtons=4
IconSize=220
IconSpacing=5%
VCenter=72%

[Titles]
Enabled=true
Font=/home/bbn/.config/flex-launcher/assets/fonts/OpenSans-Regular.ttf
FontSize=30
Color=#FFFFFF
Opacity=100%
Shadows=false
ShadowColor=#000000
OversizeMode=Shrink
Padding=20

[Highlight]
Enabled=true
FillColor=#FFFFFF
FillOpacity=25%
OutlineSize=0
OutlineColor=#0000FF
OutlineOpacity=100%
CornerRadius=0
VPadding=30
HPadding=30

[Scroll Indicators]
Enabled=true
FillColor=#FFFFFF
OutlineSize=0
OutlineColor=#000000
Opacity=20%

[Clock]
Enabled=true
ShowDate=true
Alignment=Left
Font=/home/bbn/.config/flex-launcher/assets/fonts/SourceSansPro-Regular.ttf
FontSize=50
FontColor=#FFFFFF
Shadows=false
ShadowColor=#000000
Margin=5%
Opacity=100%
TimeFormat=24hr
DateFormat=Little
IncludeWeekday=true

[Screensaver]
Enabled=false
IdleTime=300
Intensity=70%
PauseSlideshow=true

[Hotkeys]
Hotkey1=#1B;:quit
Hotkey2=0x4000003A;flatpak run tv.kodi.Kodi
Hotkey3=0x4000003B;flatpak run com.github.iwalton3.jellyfin-media-player
Hotkey4=0x4000003C;flatpak run flatpak run rocks.shy.VacuumTube

[Gamepad]
Enabled=false
DeviceIndex=-1
LStickX-=:left
LStickX+=:right
ButtonA=:select
ButtonB=:back
ButtonDPadLeft=:left
ButtonDPadRight=:right

[Main]
Entry1=Kodi;/home/bbn/.config/flex-launcher/assets/icons/kodi2.png;flatpak run tv.kodi.Kodi
Entry2=IPTV;/home/bbn/.config/flex-launcher/assets/icons/iptv.png;sh -c 'iptvnator --no-sandbox & sleep 2; wmctrl -r "IPTVnator" -b add,fullscreen'
Entry3=YouTube;/home/bbn/.config/flex-launcher/assets/icons/vacuum-tube.png;flatpak run rocks.shy.VacuumTube
Entry4=Jellyfin;/home/bbn/.config/flex-launcher/assets/icons/jellyfin2.png;flatpak run com.github.iwalton3.jellyfin-media-player;TVF
Entry5=Firefox;/home/bbn/.config/flex-launcher/assets/icons/firefox.png;/usr/share/applications/firefox-esr.desktop
Entry6=Utilities;/home/bbn/.config/flex-launcher/assets/icons/system.png;:submenu Utilities
Entry7=System;/home/bbn/.config/flex-launcher/assets/icons/system.png;:submenu System

[System]
Entry1=Shutdown;/home/bbn/.config/flex-launcher/assets/icons/system.png;:shutdown
Entry2=Restart;/home/bbn/.config/flex-launcher/assets/icons/restart.png;:restart
Entry3=Sleep;/home/bbn/.config/flex-launcher/assets/icons/sleep.png;:sleep

[Utilities]
`;

// What the box has, from the 21 Oct audit. Checks use it to find
// commands that cannot start.
export const BOX_FACTS = {
  flatpaks: ['tv.kodi.Kodi', 'rocks.shy.VacuumTube', 'org.jellyfin.JellyfinDesktop', 'com.github.tchx84.Flatseal', 'io.github.flattool.Warehouse', 'io.github.kolunmi.Bazaar'],
  // From the package audit: pipewire-pulse, wireplumber, pulseaudio-utils, cec-utils, x11-xserver-utils, xdotool, network-manager.
  commands: ['iptvnator', 'firefox-esr', 'wmctrl', 'flatpak', 'wpctl', 'pactl', 'cec-client', 'xset', 'xdotool', 'nmcli', 'amixer'],
  sleepMasked: true,
  basePath: '/home/bbn/.config/flex-launcher',
};

// The box config with the fixes from new-setup/plan.md.
export const RECOMMENDED_CONFIG = `[General]
DefaultMenu=Main
VSync=true
ApplicationTimeout=15
OnLaunch=Blank
WrapEntries=true
ResetOnBack=true
MouseSelect=false
InhibitOSScreensaver=true

[Background]
Mode=Slideshow
SlideshowDirectory=/home/bbn/.config/flex-launcher/assets/bg
SlideshowImageDuration=45
SlideshowTransitionTime=3
Overlay=true
OverlayColor=#000000
OverlayOpacity=45%

[Layout]
MaxButtons=6
IconSize=200
IconSpacing=3%
VCenter=70%

[Titles]
Enabled=true
Font=/home/bbn/.config/flex-launcher/assets/fonts/Inter-Regular.ttf
FontSize=28
Color=#FFFFFF
Opacity=90%
Shadows=true
ShadowColor=#000000
OversizeMode=Shrink
Padding=18

[Highlight]
Enabled=false

[Scroll Indicators]
Enabled=true
FillColor=#FFFFFF
OutlineSize=0
Opacity=50%

[Clock]
Enabled=true
ShowDate=true
Alignment=Left
Font=/home/bbn/.config/flex-launcher/assets/fonts/Inter-Regular.ttf
FontSize=56
FontColor=#FFFFFF
Shadows=true
ShadowColor=#000000
Margin=5%
Opacity=100%
TimeFormat=24hr
DateFormat=Little
IncludeWeekday=true

[Screensaver]
Enabled=true
IdleTime=600
Intensity=70%
PauseSlideshow=true

[Hotkeys]
Hotkey1=#4000003A;flatpak run tv.kodi.Kodi
Hotkey2=#4000003B;flatpak run org.jellyfin.JellyfinDesktop
Hotkey3=#4000003C;flatpak run rocks.shy.VacuumTube

[Gamepad]
Enabled=false
DeviceIndex=-1
LStickX-=:left
LStickX+=:right
ButtonA=:select
ButtonB=:back
ButtonDPadLeft=:left
ButtonDPadRight=:right

[Main]
Entry1=Kodi;;flatpak run tv.kodi.Kodi
Entry2=IPTV;;sh -c 'iptvnator --no-sandbox & sleep 2; wmctrl -r "IPTVnator" -b add,fullscreen'
Entry3=YouTube;;flatpak run rocks.shy.VacuumTube
Entry4=Jellyfin;;flatpak run org.jellyfin.JellyfinDesktop
Entry5=AirPlay;;uxplay -n HTPC -fs
Entry6=System;;:submenu System

[System]
Entry1=Back;;:back
Entry2=Desktop;;:quit
Entry3=Firefox;;/usr/share/applications/firefox-esr.desktop
Entry4=Restart;;:restart
Entry5=Shut down;;:shutdown
`;

export const LOCAL_PRESETS = {
  box: { label: 'My box (21 Oct)', text: BOX_CONFIG, look: { style: 'glass', radius: 0.22, glyphScale: 0.42 }, focus: 'box', basePath: BOX_FACTS.basePath },
  boxFixed: { label: 'My box, fixed', text: RECOMMENDED_CONFIG, look: { style: 'glass', radius: 0.24, glyphScale: 0.42 }, focus: 'icon', basePath: BOX_FACTS.basePath },
};
