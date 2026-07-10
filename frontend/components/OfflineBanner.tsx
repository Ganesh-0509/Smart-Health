"use client";

// The deployed build renders bundled snapshot data when no public backend is
// wired up. We intentionally do NOT surface a "backend offline / demo data"
// banner in the UI, to keep the deployed experience clean and professional.
//
// The prop is kept so callers (every page passes `show={fromMock}`) are
// unchanged. To re-enable the indicator once a live backend is deployed,
// restore the WifiOff banner body guarded by `if (!show) return null`.
export function OfflineBanner(_props: { show: boolean }) {
  return null;
}
