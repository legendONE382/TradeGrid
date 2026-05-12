# Android Packaging Plan

## Option 1 (current): PWA -> TWA
1. Build and deploy web app over HTTPS.
2. Use Bubblewrap to wrap the PWA as Trusted Web Activity.
3. Publish APK/AAB to Play Store.

## Option 2: React Native shell
1. Reuse same API and offline queue logic.
2. Implement native SQLite and image compression.
3. Add push notifications + background sync.

## Done in this repo
- Added `manifest.webmanifest`
- Added `sw.js` for offline caching
- Added installable standalone display mode
