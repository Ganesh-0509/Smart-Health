"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Lang, Phc, Role } from "./types";
import { dict, type DictKey } from "./i18n";
import { api } from "./api";

interface AppState {
  role: Role | null;
  setRole: (r: Role | null) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  phcScope: string | null; // null = whole district
  setPhcScope: (id: string | null) => void;
  phcs: Phc[];
  ready: boolean;
  t: (key: DictKey) => string;
}

const AppContext = createContext<AppState | null>(null);

const LS_ROLE = "sh_role";
const LS_LANG = "sh_lang";
const LS_SCOPE = "sh_scope";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const [phcScope, setPhcScopeState] = useState<string | null>(null);
  const [phcs, setPhcs] = useState<Phc[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_ROLE) as Role | null;
      const l = localStorage.getItem(LS_LANG) as Lang | null;
      const s = localStorage.getItem(LS_SCOPE);
      if (r) setRoleState(r);
      if (l === "en" || l === "hi") setLangState(l);
      if (s) setPhcScopeState(s === "null" ? null : s);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    api.getPhcs().then((res) => setPhcs(res.data));
  }, []);

  const setRole = useCallback((r: Role | null) => {
    setRoleState(r);
    try {
      if (r) localStorage.setItem(LS_ROLE, r);
      else localStorage.removeItem(LS_ROLE);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LS_LANG, l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  const setPhcScope = useCallback((id: string | null) => {
    setPhcScopeState(id);
    try {
      localStorage.setItem(LS_SCOPE, id ?? "null");
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: DictKey) => {
      const entry = dict[key];
      return entry ? entry[lang] ?? entry.en : String(key);
    },
    [lang],
  );

  const value = useMemo<AppState>(
    () => ({
      role,
      setRole,
      lang,
      setLang,
      toggleLang,
      phcScope,
      setPhcScope,
      phcs,
      ready,
      t,
    }),
    [role, setRole, lang, setLang, toggleLang, phcScope, setPhcScope, phcs, ready, t],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// Convenience: localized text picker for API objects carrying *_en / *_hi.
export function pickLang<T extends object>(obj: T, base: string, lang: Lang): string {
  const rec = obj as Record<string, unknown>;
  return (rec[`${base}_${lang}`] ?? rec[`${base}_en`] ?? "") as string;
}
