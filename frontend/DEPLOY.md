# Deploying the frontend to Firebase Hosting (free)

The Smart Health frontend is a fully client-rendered Next.js app (client
components + client-side fetch/auth), so it can be exported as **static files**
and served from **Firebase Hosting on the free Spark plan** — no SSR, no Cloud
Functions, no Blaze/billing required.

## One-time setup

1. Install the Firebase CLI (once, globally):
   ```bash
   npm install -g firebase-tools
   ```
2. Create a free Firebase project at <https://console.firebase.google.com>.
3. Put its project id into `.firebaserc` (replace `YOUR_FIREBASE_PROJECT_ID`),
   or run `firebase use --add` and pick the project.
4. Log in (interactive, must be run by you):
   ```bash
   firebase login
   ```

## Build + deploy

From `frontend/`:

```bash
# 1. Static export -> ./out  (BUILD_STATIC=1 flips next.config to output:"export")
BUILD_STATIC=1 npm run build

# 2. Ship it
firebase deploy --only hosting
```

On Windows PowerShell, set the env var inline:

```powershell
$env:BUILD_STATIC = "1"; npm run build; firebase deploy --only hosting
```

You'll get a live `https://<project-id>.web.app` URL on the free tier.

## Notes

- `BUILD_STATIC` only affects `next build`. Plain `npm run dev` and `npm run
  build` are unchanged, so the existing Docker / `npm run dev` workflow still
  works.
- Set the runtime env vars the exported build needs **before** building
  (they are inlined at build time): `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, and the four `NEXT_PUBLIC_FIREBASE_*` keys.
  If the backend URL isn't reachable from the deployed site, the app falls back
  to bundled demo data automatically.
- The backend (FastAPI) is separate — deploy it wherever you like (e.g. Cloud
  Run, also free-tier eligible) and point `NEXT_PUBLIC_API_URL` at it.
