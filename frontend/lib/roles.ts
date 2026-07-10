import type { Role } from "./types";
import type { DictKey } from "./i18n";

// ---------------------------------------------------------------------------
// Role-based access. The 5 login roles each get a distinct set of pages, a
// distinct landing page, and a distinct dashboard focus. Admin sees everything.
// ---------------------------------------------------------------------------

// Sentinel meaning "every route" — used only by admin.
export const ALL_ROUTES = "*" as const;

// The route hrefs each role may open. Keep these in sync with nav-items.ts.
export const ROLE_ROUTES: Record<Role, readonly string[]> = {
  // Front-line stock keeper: what's on the shelf, what's expiring, log updates.
  pharmacist: ["/dashboard", "/inventory", "/ingest", "/alerts"],
  // Clinical operations at the facility: beds, staff, patients, diagnostics.
  medical_officer: ["/dashboard", "/beds", "/doctors", "/footfall", "/tests", "/alerts"],
  // Planning & approvals across PHCs in the block.
  block_manager: ["/dashboard", "/forecast", "/recommendations", "/reports", "/alerts"],
  // District intelligence & oversight.
  district_officer: ["/dashboard", "/district", "/reports", "/forecast", "/assistant"],
  // Full system access.
  admin: [ALL_ROUTES],
};

// Where each role lands immediately after picking their card on the login page.
export const ROLE_HOME: Record<Role, string> = {
  pharmacist: "/inventory",
  medical_officer: "/beds",
  block_manager: "/recommendations",
  district_officer: "/district",
  admin: "/dashboard",
};

// One-line description of what each role's control view is for. Shown on the
// login card and as the dashboard subtitle so every login feels distinct.
export const ROLE_FOCUS: Record<Role, DictKey> = {
  pharmacist: "focus_pharmacist",
  medical_officer: "focus_medical_officer",
  block_manager: "focus_block_manager",
  district_officer: "focus_district_officer",
  admin: "focus_admin",
};

// Can this role open this route? Admin gets everything.
export function canAccess(role: Role, href: string): boolean {
  const routes = ROLE_ROUTES[role];
  if (routes.includes(ALL_ROUTES)) return true;
  return routes.includes(href);
}
