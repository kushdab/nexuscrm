# NexusCRM — PWA Guide

## Features
- **Installable** on iOS, Android, and Desktop Chrome/Edge
- **Offline support** — cached pages load instantly with no connection
- **Background sync** — queued mutations replay when reconnected
- **Push notifications** — deal updates, activity reminders, lead assignments
- **Share target** — share URLs/contacts directly into NexusCRM from any app

## Setup
1. Generate icons in all sizes listed in `public/manifest.json` and place them in `public/icons/`
2. The service worker (`public/sw.js`) is served statically — no build step needed
3. For production caching rules, install `next-pwa` and use `next.config.pwa.js`
4. Mount `<InstallBanner />` and `<OfflineBadge />` in your root layout

## Testing
- Chrome DevTools → Application → Service Workers
- Lighthouse → PWA audit
- `npm run build && npx serve out` to test offline mode locally
