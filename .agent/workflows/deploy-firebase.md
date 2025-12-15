---
description: Deploy to Firebase Hosting
---

# Deploy to Firebase Hosting

This workflow describes how to deploy the Omi Manager to Firebase Hosting.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Project configured in `.firebaserc`

## Architecture Overview

This application uses a **local-first architecture** which is VERY cost-efficient:

- **Data Storage**: IndexedDB (browser local) - $0
- **Authentication**: localStorage (local mock) - $0  
- **Omi API**: Called directly from browser - $0
- **Hosting**: Static files only - ~$0 (free tier)

## Cost Estimate

| Service | Expected Usage | Cost |
|---------|---------------|------|
| Firebase Hosting | Static files ~5MB | FREE (up to 10GB/month) |
| Firebase Functions | NOT USED | $0 |
| Firestore | NOT USED | $0 |
| Firebase Auth | NOT USED | $0 |

**Estimated Total: $0/month** for moderate usage

## Deployment Steps

// turbo-all

### 1. Build the production bundle
```bash
npm run build
```

### 2. Test production build locally
```bash
npm run preview
```

### 3. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

## Important Notes

### API Proxy Issue

The Vite proxy (`/omi-proxy`) does NOT work in production. The app is configured to:
- Use the proxy in development (localhost)
- Call the Omi API directly in production

If CORS issues occur, you have these options:

1. **Contact Omi** to whitelist your Firebase domain
2. **Use Cloudflare Workers** as a free proxy (100k requests/day)
3. **Use Firebase Functions** (adds ~$0.40 per million invocations)

### Environment Variables

For production, ensure your Firebase domain is added to any API whitelist.

## Rollback

If you need to rollback to a previous version:
```bash
firebase hosting:channel:delete live
firebase deploy --only hosting
```
