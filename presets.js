// General starting points. {BASE} is replaced with the install folder,
// because Flex Launcher needs absolute paths (it does not expand "~").
export const DEFAULT_BASE = '/home/user/.config/flex-launcher';

export const STARTER_CONFIG = `[General]
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
SlideshowDirectory={BASE}/assets/bg
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
Font={BASE}/assets/fonts/Inter-Regular.ttf
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
Font={BASE}/assets/fonts/Inter-Regular.ttf
FontSize=56
FontColor=#FFFFFF
Shadows=true
ShadowColor=#000000
Margin=5%
Opacity=100%
TimeFormat=Auto
DateFormat=Auto
IncludeWeekday=true

[Screensaver]
Enabled=true
IdleTime=600
Intensity=70%
PauseSlideshow=true

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
Entry2=Jellyfin;;flatpak run org.jellyfin.JellyfinDesktop
Entry3=YouTube;;flatpak run rocks.shy.VacuumTube
Entry4=Spotify;;flatpak run com.spotify.Client
Entry5=Steam;;flatpak run com.valvesoftware.Steam -gamepadui
Entry6=System;;:submenu System

[System]
Entry1=Back;;:back
Entry2=Desktop;;:quit
Entry3=Restart;;:restart
Entry4=Shut down;;:shutdown
`;

export const BLANK_CONFIG = `[Main]
Entry1=Kodi;;flatpak run tv.kodi.Kodi
Entry2=YouTube;;flatpak run rocks.shy.VacuumTube
`;

export const PRESETS = {
  starter: { label: 'Starter', text: STARTER_CONFIG, look: { style: 'glass', radius: 0.24, glyphScale: 0.42 }, focus: 'icon' },
  blank: { label: 'Blank', text: BLANK_CONFIG, look: { style: 'dark', radius: 0.2, glyphScale: 0.44 }, focus: 'box' },
};
