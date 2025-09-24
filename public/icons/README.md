# PWA Icons

This directory contains all the icons required for the Progressive Web App functionality.

## Icon Files

### Standard Icons
- `pwa-96x96.png` - Small icon for various contexts
- `pwa-144x144.png` - Medium icon for tablets and larger screens
- `pwa-192x192.png` - Standard PWA icon size
- `pwa-512x512.png` - Large PWA icon (PNG format, preferred over JPG)
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `favicon.ico` - Browser favicon

### Maskable Icons
- `pwa-512x512-maskable.png` - Maskable icon for Android adaptive icons
- `masked-icon.svg` - SVG maskable icon with Islamic geometric design

### Legacy Files
- `pwa-192x192.jpg` - Legacy JPG version (kept for compatibility)
- `pwa-512x512.jpg` - Legacy JPG version (kept for compatibility)

## Maskable Icons

Maskable icons are designed to work with Android's adaptive icon system. The important content should be within the center 80% of the icon (safe zone) to ensure it's not clipped when the system applies masks.

The current maskable design features:
- Blue background (#3b82f6) matching the app theme
- Islamic geometric star pattern in white
- Centered "M" for Madrasa in the middle
- Content properly positioned within the safe zone

## Usage

All icons are referenced in the `manifest.json` file with appropriate sizes and purposes:
- `purpose: "any"` - Standard icons for general use
- `purpose: "maskable"` - Icons designed for adaptive icon systems

## Requirements Met

✅ 512x512 PNG icon created (replacing JPG reference in manifest)
✅ Maskable icon variant generated for better Android integration  
✅ All icon sizes meet PWA requirements and are properly referenced in manifest
✅ Complete icon set covers all common PWA use cases