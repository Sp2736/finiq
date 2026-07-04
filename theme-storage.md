# Theme Storage Architecture Refactor

## Objective

Currently, `ThemeContext.tsx` calls **both** `GET /api/themes/active` and `GET /api/themes/saved` on every mount of `ThemeProvider` — which happens on every full page load / hard refresh inside `DistributorLayout` and `InvestorLayout` (because `ThemeProvider` wraps every page in those layouts).

We want:

1. **`themes/active`** → called **once per login session** (right after login succeeds, before redirecting into the portal). After that, every page read of the active theme comes from `localStorage`, not the network. No more calling it on every route change or hard refresh.
2. **`themes/saved`** → called **only** when the user opens **Settings → Appearance** (the `ThemePanel`). It must not be called anywhere else, and must not be called automatically by `ThemeProvider` on mount.
3. When the user changes/activates/updates/deletes a theme from the Appearance page, `localStorage` must be updated immediately so the rest of the app (and the next reload) reflects the new theme without needing another `themes/active` call.
4. Logging out must clear the cached theme so the next login (possibly a different company) doesn't flash the previous company's theme.

This document is a full instruction set for Antigravity to implement this in both repos:
- Frontend: `finiq` (Next.js)
- Backend: `finiq-api` (NestJS) — **no functional changes required**, but one optional/recommended addition is described in Section 6.

---

## 1. Current Behavior (for reference — do not skip reading this)

- `src/context/ThemeContext.tsx`:
  - On mount, `useEffect` runs `Promise.all([fetchActiveTheme(), fetchSavedThemes()])`.
  - `fetchActiveTheme()` calls `apiClient.get("themes/active")`, applies vars to `document.documentElement`, and also writes `localStorage.setItem("finiq_theme_vars", ...)` — but **only the CSS variables**, not the theme name / active theme id. This cache is currently used only for the anti-FOUC inline `<script>` in `app/layout.tsx`, `distributor/layout.tsx`, and `investor/layout.tsx` — it is NOT read by `ThemeContext` itself to skip the API call.
  - `fetchSavedThemes()` calls `apiClient.get("themes/saved")` and stores the full list in React state. This is currently called unconditionally, even though `savedThemes` is only consumed by `ThemePanel` / `ThemePickerList` inside Settings → Appearance.
- `ThemeProvider` is mounted inside **both** `src/app/distributor/layout.tsx` and `src/app/investor/layout.tsx` — i.e. it wraps every single page in each portal, so both APIs fire on every navigation that causes a fresh mount (hard reloads, and in Next.js App Router, also whenever the layout instance remounts).
- Anti-FOUC inline scripts in the three `layout.tsx` files already read `finiq_theme_vars` from `localStorage` and apply it to `document.documentElement` before hydration. This part is good and should be kept as-is.
- Login flows that already exist:
  - Investor: `src/app/(auth)/login/page.tsx` → `authService.loginInvestor()` → `setAuthCookies(token, undefined, "investor")` → `router.push("/investor")`.
  - Distributor/Staff: `src/app/(auth)/distributor-portal/page.tsx` → `authService.verifyOtp()` → `setAuthCookies(access, refresh, "staff", userId)` → `router.push("/distributor")`.
  - Admin: `src/app/(auth)/admin-portal/page.tsx` follows the same staff OTP pattern (verify this file too — apply the same change described in Section 3.2 if it also redirects into a themed portal).
- Both login responses already inline company_logo (`response.data.investor.logo_base64` / `response.data.user.company_logo`) and are cached to `localStorage` under `company_logo_base64` right after login. We are going to follow this **exact same precedent** for the theme.
- `apiClient.ts`'s 401-handling logout path already does `localStorage.clear()` before redirecting to the login page — so cache invalidation on forced logout is already covered. We just need to also clear it on **manual/explicit logout** if that path doesn't go through `apiClient`'s interceptor (check this — see Section 4).

---

## 2. New localStorage Contract

Replace the single `finiq_theme_vars` key with one consolidated key that stores everything `ThemeContext` needs, so page loads never need to touch the network to paint the correct theme:

```ts
// localStorage key: "finiq_active_theme"
interface CachedActiveTheme {
  theme_name: string;
  theme_variables: Record<string, string>;
  active_theme_id: string | null;
  cached_at: string; // ISO timestamp, for debugging/future TTL use
}
```

- Keep writing the **old** `finiq_theme_vars` key too (just the raw `variables` object) for one release cycle, since the anti-FOUC inline `<script>` tags in the three `layout.tsx` files read that specific key before any React code runs. Simplify this in a later cleanup pass once the inline scripts are updated to read `finiq_active_theme` instead (see Section 3.4 — we're actually updating those scripts in this same pass, so `finiq_theme_vars` can be fully retired if you follow Section 3.4 exactly. Keeping both is only a fallback if you choose not to touch the inline scripts).

**Recommendation:** fully migrate to `finiq_active_theme` and update the 3 inline anti-FOUC scripts in the same PR (Section 3.4), rather than maintaining two keys.

---

## 3. Frontend Changes (`finiq` repo)

### 3.1 Rewrite `src/context/ThemeContext.tsx`

Goals:
- On mount, **do not** call `themes/active` or `themes/saved`.
- Instead, read the active theme synchronously from `localStorage` (key `finiq_active_theme`) and apply it to the DOM + state.
- Only call `themes/active` if the cache is completely missing (defensive fallback — e.g. first login before the login page had a chance to prime it, or localStorage was cleared by the browser/user).
- `fetchSavedThemes` must no longer be called automatically. Expose it as `refreshSavedThemes()` only, to be called explicitly by `ThemePanel`.
- Add a new exported function `primeActiveThemeFromLogin(themeData)` that the login pages call right after authenticating, so `ThemeContext` doesn't need to guess — but since `ThemeProvider` isn't mounted yet at login time (it lives inside `distributor/layout.tsx` / `investor/layout.tsx`), the actual priming into `localStorage` happens directly in the login page (Section 3.2), and `ThemeContext` simply reads from `localStorage` on its own mount afterward. So `ThemeContext` doesn't need this function — just make sure its initial read logic works whether the cache was primed by the login page or is stale/missing.

Replace the file with the following implementation:

```tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { apiClient } from "@/lib/apiClient";

export interface SavedTheme {
  id: string;
  name: string;
  variables: Record<string, string>;
  is_default?: boolean;
  created_at: string;
}

interface CachedActiveTheme {
  theme_name: string;
  theme_variables: Record<string, string>;
  active_theme_id: string | null;
  cached_at: string;
}

const ACTIVE_THEME_CACHE_KEY = "finiq_active_theme";

interface ThemeContextValue {
  variables: Record<string, string>;
  themeName: string;
  activeThemeId: string | null;
  savedThemes: SavedTheme[];
  isLoading: boolean;
  isSavedThemesLoading: boolean;

  applyPreview: (vars: Record<string, string>) => void;
  revertPreview: () => void;

  activateTheme: (savedThemeId: string) => Promise<void>;
  activateDefault: () => Promise<void>;

  saveTheme: (name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  updateSavedTheme: (id: string, name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  deleteSavedTheme: (id: string) => Promise<void>;

  // Kept for callers that explicitly need to force a fresh read from the server
  // (should be rare — only used as a fallback / manual "sync" action).
  refreshTheme: () => Promise<void>;

  // Must be called explicitly by the Appearance settings page. Never called
  // automatically by ThemeProvider.
  refreshSavedThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readActiveThemeCache(): CachedActiveTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_THEME_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedActiveTheme;
  } catch (_) {
    return null;
  }
}

function writeActiveThemeCache(data: {
  theme_name: string;
  theme_variables: Record<string, string>;
  active_theme_id: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedActiveTheme = {
      ...data,
      cached_at: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_THEME_CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [themeName, setThemeName] = useState("System Default");
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedThemesLoading, setIsSavedThemesLoading] = useState(false);

  const snapshotRef = useRef<Record<string, string>>({});

  const applyVarsToDOM = useCallback((vars: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (Object.keys(vars).length === 0) {
      document.documentElement.style.cssText = "";
      const root = document.documentElement;
      Array.from(root.style).forEach((prop) => {
        if (prop.startsWith("--fin-")) root.style.removeProperty(prop);
      });
      return;
    }
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Applies a theme payload to state + DOM + cache, in one place.
  const applyAndCache = useCallback((data: {
    theme_name: string;
    theme_variables: Record<string, string>;
    active_theme_id: string | null;
  }) => {
    const vars = data.theme_variables || {};
    setVariables(vars);
    setThemeName(data.theme_name || "System Default");
    setActiveThemeId(data.active_theme_id ?? null);
    applyVarsToDOM(vars);
    writeActiveThemeCache({
      theme_name: data.theme_name || "System Default",
      theme_variables: vars,
      active_theme_id: data.active_theme_id ?? null,
    });
  }, [applyVarsToDOM]);

  // Network fallback — only used when localStorage cache is missing/corrupt,
  // or when explicitly forced via refreshTheme() / after activation calls.
  const fetchActiveTheme = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("themes/active");
      const data = res.data || res;
      applyAndCache({
        theme_name: data?.theme_name,
        theme_variables: data?.theme_variables || {},
        active_theme_id: data?.active_theme_id ?? null,
      });
    } catch (error) {
      console.error("Failed to fetch active theme:", error);
    }
  }, [applyAndCache]);

  // Only called explicitly by the Appearance settings page.
  const fetchSavedThemes = useCallback(async () => {
    setIsSavedThemesLoading(true);
    try {
      const res = await apiClient.get<any>("themes/saved");
      const data = res.data || res;
      setSavedThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch saved themes:", error);
    } finally {
      setIsSavedThemesLoading(false);
    }
  }, []);

  // ─── Mount: read from cache first, only hit the network if cache is empty ──
  useEffect(() => {
    const init = async () => {
      const cached = readActiveThemeCache();
      if (cached) {
        setVariables(cached.theme_variables || {});
        setThemeName(cached.theme_name || "System Default");
        setActiveThemeId(cached.active_theme_id ?? null);
        applyVarsToDOM(cached.theme_variables || {});
        setIsLoading(false);
        return;
      }
      // No cache found (e.g. localStorage cleared, or login page didn't prime
      // it for some reason) — fall back to a single network call so the site
      // isn't stuck unthemed.
      await fetchActiveTheme();
      setIsLoading(false);
    };
    init();
    // NOTE: fetchSavedThemes is intentionally NOT called here.
  }, [fetchActiveTheme, applyVarsToDOM]);

  const applyPreview = useCallback((_vars: Record<string, string>) => {}, []);
  const revertPreview = useCallback(() => {}, []);

  const activateTheme = useCallback(async (savedThemeId: string) => {
    await apiClient.put(`themes/activate/${savedThemeId}`, {});
    snapshotRef.current = {};
    await fetchActiveTheme(); // Re-fetches, applies to DOM, AND re-caches to localStorage
  }, [fetchActiveTheme]);

  const activateDefault = useCallback(async () => {
    await apiClient.put("themes/activate-default", {});
    snapshotRef.current = {};
    await fetchActiveTheme(); // Re-fetches (empty vars) and re-caches
  }, [fetchActiveTheme]);

  const saveTheme = useCallback(async (
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.post<any>("themes/saved", { name, variables: newVars });
    await fetchSavedThemes();
    return res.data || res;
  }, [fetchSavedThemes]);

  const updateSavedTheme = useCallback(async (
    id: string,
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.put<any>(`themes/saved/${id}`, { name, variables: newVars });
    await fetchSavedThemes();
    if (activeThemeId === id) {
      await activateTheme(id); // re-activates + re-caches active theme
    }
    return res.data || res;
  }, [fetchSavedThemes, activateTheme, activeThemeId]);

  const deleteSavedTheme = useCallback(async (id: string) => {
    await apiClient.delete(`themes/saved/${id}`);
    await fetchSavedThemes();
    if (activeThemeId === id) {
      await fetchActiveTheme(); // backend reset to default; re-sync cache
    }
  }, [fetchSavedThemes, fetchActiveTheme, activeThemeId]);

  return (
    <ThemeContext.Provider
      value={{
        variables,
        themeName,
        activeThemeId,
        savedThemes,
        isLoading,
        isSavedThemesLoading,
        applyPreview,
        revertPreview,
        activateTheme,
        activateDefault,
        saveTheme,
        updateSavedTheme,
        deleteSavedTheme,
        refreshTheme: fetchActiveTheme,
        refreshSavedThemes: fetchSavedThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

Key differences from the original:
- `useEffect` on mount no longer calls `fetchSavedThemes()` at all, and only calls `fetchActiveTheme()` (network) if the `localStorage` cache is missing.
- Introduced `applyAndCache()` / `writeActiveThemeCache()` / `readActiveThemeCache()` helpers around the single `finiq_active_theme` key.
- Added `isSavedThemesLoading` to the context so `ThemePanel` can show a loading state while it explicitly fetches saved themes (see 3.3).
- `activateTheme`, `activateDefault`, `updateSavedTheme`, `deleteSavedTheme` still call `fetchActiveTheme()` internally where appropriate — this is fine because these are rare, user-initiated mutation actions from the Appearance page, not page-load reads. Each of these correctly re-caches to `localStorage` too, since `fetchActiveTheme` -> `applyAndCache` handles that.

### 3.2 Prime the cache right after login (both portals)

In each login page, immediately after a successful login/OTP-verify and before (or right alongside) storing `company_logo_base64`, call `themes/active` **once** and write it to `localStorage` under `finiq_active_theme`, using the exact same shape the `ThemeContext` cache reader expects.

Add a small shared helper, e.g. `src/lib/primeThemeCache.ts`:

```ts
// src/lib/primeThemeCache.ts
import { apiClient } from "@/lib/apiClient";

const ACTIVE_THEME_CACHE_KEY = "finiq_active_theme";

/**
 * Call this exactly once, right after a successful login (any portal),
 * before redirecting into the themed layout. Fetches the active theme once
 * and caches it to localStorage so ThemeContext never needs to call
 * `themes/active` again until the next login.
 *
 * Safe to call even if it fails — ThemeContext falls back to a network
 * call on mount if the cache is missing.
 */
export async function primeThemeCache(): Promise<void> {
  try {
    const res = await apiClient.get<any>("themes/active");
    const data = res.data || res;
    const payload = {
      theme_name: data?.theme_name || "System Default",
      theme_variables: data?.theme_variables || {},
      active_theme_id: data?.active_theme_id ?? null,
      cached_at: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_THEME_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to prime theme cache after login:", err);
    // Non-fatal: ThemeContext will fetch it on first mount instead.
  }
}
```

**Important:** `apiClient.get("themes/active")` relies on `getCookieValue` reading the auth cookie that `setAuthCookies(...)` writes via `document.cookie`. Cookies are set synchronously, so as long as `primeThemeCache()` is called **after** `setAuthCookies(...)` runs, the request will be authenticated correctly. Do not call it before the auth cookie is set.

Now wire it into each login page:

**`src/app/(auth)/login/page.tsx`** (investor):
```tsx
import { primeThemeCache } from "@/lib/primeThemeCache";
// ...
setAuthCookies(actualToken, undefined, "investor");

// Prime the theme cache once, right after auth cookies are set.
await primeThemeCache();

router.push("/investor");
```

**`src/app/(auth)/distributor-portal/page.tsx`** (staff):
```tsx
import { primeThemeCache } from "@/lib/primeThemeCache";
// ...
if (response.success) {
  setAuthCookies(
    response.data.access_token,
    response.data.refresh_token,
    "staff",
    response.data.user.id,
  );

  await primeThemeCache();

  router.push("/distributor");
}
```

**`src/app/(auth)/admin-portal/page.tsx`**: open this file, confirm it follows the same OTP-verify → `setAuthCookies` → `router.push` pattern, and apply the identical `await primeThemeCache();` call right after `setAuthCookies(...)` and before the redirect, if the admin portal also renders themed pages that use `ThemeProvider`.

Also handle the **refresh-token silent re-auth path** in `apiClient.ts`: when the 401 interceptor successfully refreshes a token, it does NOT currently re-prime the theme — that's fine and correct, since the theme cache from the original login is still valid and doesn't need to be re-fetched just because the access token rotated. No change needed there.

### 3.3 Update `ThemePanel.tsx` to explicitly load saved themes on mount

`ThemePanel` (rendered only on the Settings → Appearance page) is the **only** consumer of `savedThemes` / `refreshSavedThemes`. Add an explicit fetch when this component mounts:

```tsx
import { useTheme, SavedTheme } from "@/context/ThemeContext";
// ...

export default function ThemePanel() {
  const {
    variables,
    activeThemeId,
    savedThemes,
    isSavedThemesLoading,
    applyPreview,
    revertPreview,
    activateDefault,
    activateTheme,
    saveTheme,
    updateSavedTheme,
    deleteSavedTheme,
    refreshSavedThemes,
  } = useTheme();

  // Fetch the saved-themes list only when this settings page is actually opened.
  useEffect(() => {
    refreshSavedThemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ... rest of component unchanged
```

Optionally, show a loading skeleton in `ThemePickerList` while `isSavedThemesLoading` is `true`, since `savedThemes` will be an empty array for a brief moment on first open. Check `ThemePickerList.tsx` for where the list is rendered and add a simple loading state guard (e.g. skeleton cards or a small `Loader2` spinner) if it doesn't already handle an empty state gracefully.

### 3.4 Update anti-FOUC inline scripts to read the new cache key

There are 3 places with an identical inline `<script>` reading `finiq_theme_vars`:
- `src/app/layout.tsx`
- `src/app/distributor/layout.tsx`
- `src/app/investor/layout.tsx`

Update all three to read `finiq_active_theme` and pull `.theme_variables` out of the parsed object instead of treating the whole payload as the variables map:

```html
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var cached = localStorage.getItem('finiq_active_theme');
          if (cached) {
            var parsed = JSON.parse(cached);
            var vars = parsed.theme_variables || {};
            var root = document.documentElement;
            var keys = Object.keys(vars);
            for (var i = 0; i < keys.length; i++) {
              root.style.setProperty(keys[i], vars[keys[i]]);
            }
          }
        } catch(e) {}
      })();
    `,
  }}
/>
```

Since `finiq_theme_vars` is now fully retired, remove all remaining references to it (the old write in `ThemeContext` no longer exists after Section 3.1's rewrite, and `activateDefault`'s old `localStorage.removeItem("finiq_theme_vars")` line is gone too — `writeActiveThemeCache` with empty `theme_variables` already handles the "no theme" case correctly for `finiq_active_theme`).

### 3.5 Clear the theme cache on logout

Search the codebase for the explicit/manual logout action (e.g. a "Logout" button calling `authService.logout()` or directly clearing cookies) — this is separate from the automatic 401-interceptor logout in `apiClient.ts` (which already does `localStorage.clear()`).

Find it with:
```bash
grep -rniI "removeAuthCookies\|logout" src/components src/app --include="*.tsx" | grep -v node_modules
```

Wherever the manual logout handler lives, ensure it clears the theme cache alongside the auth cookies, e.g.:

```ts
import { removeAuthCookies } from "@/lib/authClient";

function handleLogout() {
  removeAuthCookies("staff"); // or "investor"
  localStorage.removeItem("finiq_active_theme");
  localStorage.removeItem("company_logo_base64");
  router.push("/distributor-portal"); // or "/login"
}
```

This prevents a scenario where User A (Company X, custom theme) logs out and User B (Company Y, default theme) logs in on the same browser, briefly flashing Company X's theme colors via the anti-FOUC script before `ThemeContext`/login-priming corrects it.

If the manual logout flow already calls `localStorage.clear()` (some do, to nuke everything), no change is needed there — just confirm it.

---

## 4. Multi-tab / stale-cache edge case (documented, optional to implement)

Because the active theme now lives in `localStorage` and is only refreshed on login or on explicit theme-mutation actions, a scenario exists where:
- User has the Appearance settings page open in Tab A and changes the active theme.
- Tab B (same session, different page) will **not** see the new theme until it's reloaded, because it already has `ThemeProvider` mounted with the old cached state and there's no cross-tab sync.

This is an acceptable, expected tradeoff for the requested architecture (this exact staleness-across-tabs tradeoff is inherent to "only refetch on login" designs, and mirrors how `company_logo_base64` already behaves today). If cross-tab sync is desired later, `ThemeProvider` could add a `window.addEventListener("storage", ...)` listener that reacts to `finiq_active_theme` changes made in other tabs — this is **not required** for this task and should not be implemented unless separately requested, to keep this change minimal and focused.

---

## 5. Backend Changes (`finiq-api` repo)

**No functional/behavioral changes are required in `finiq-api` for this task.** The existing endpoints are already correctly separated:
- `GET /api/themes/active` — cheap, single-company-row read. Fine to call once per login.
- `GET /api/themes/saved` — returns **all** saved themes for the company; correctly reserved for the Appearance page only, per the existing `ThemesController` / `ThemesService` design.

Confirm `src/modules/themes/themes.controller.ts` and `src/modules/themes/themes.service.ts` are left untouched. Do not add caching, ETags, or response changes on the backend — this task is a frontend caching/call-pattern change only.

### 5.1 Optional (do NOT implement unless separately requested)

If in the future multiple staff users of the same company are logged in simultaneously and one changes the active theme via Appearance settings, other already-logged-in users' cached `localStorage` copies will not reflect the change until their next login. A future enhancement could add a `theme_version` / `updated_at` column to `company_themes` and expose it via a cheap `GET /api/themes/version` endpoint that `ThemeContext` polls occasionally to decide whether to invalidate the cache. This is explicitly **out of scope** for this task — noting it here only so it isn't mistaken for an oversight.

---

## 6. Testing Checklist for Antigravity

After implementing, verify:

1. **Fresh login (investor)**: Network tab shows exactly one call to `themes/active` at login time, zero calls to `themes/saved`. Theme is applied correctly on `/investor`.
2. **Fresh login (distributor/staff)**: Same as above for `/distributor`.
3. **Hard refresh** on any page inside `/distributor/*` or `/investor/*`: **zero** calls to `themes/active` or `themes/saved`. Theme still renders correctly with no FOUC (no default-then-themed flash).
4. **Navigating between pages** within the same portal: zero additional theme API calls.
5. **Opening Settings → Appearance**: exactly one call to `themes/saved` fires (and only there). Navigating away and back re-fetches it again (acceptable — it's still "only on that page", not cached, since the requirement was "only called on the appearance page", not "called once ever").
6. **Activating a different theme** from Appearance: one call to `themes/activate/:id`, followed by one call to `themes/active` (to re-sync + re-cache). `localStorage.finiq_active_theme` updates immediately. Reloading any other page in the portal shows the new theme without any extra API calls beyond what activation itself triggered.
7. **Editing the currently active theme and saving**: same as above via the `updateSavedTheme` → `activateTheme` path.
8. **Deleting the active theme**: falls back to System Default, `localStorage.finiq_active_theme` is updated to reflect empty variables, DOM resets correctly.
9. **Logout then login as a different company**: no flash of the previous company's theme colors before the new one applies.
10. **localStorage manually cleared, then reload without re-login**: `ThemeContext` falls back to exactly one `themes/active` call (defensive path in Section 3.1) rather than breaking.
11. Confirm `company_logo_base64` behavior is unaffected — no regressions to that separate cache key.

---

## 7. Summary of Files to Touch

**Frontend (`finiq`)**
- `src/context/ThemeContext.tsx` — rewritten per Section 3.1 (cache-first read, no auto saved-themes fetch).
- `src/lib/primeThemeCache.ts` — **new file**, per Section 3.2.
- `src/app/(auth)/login/page.tsx` — call `primeThemeCache()` after login, per Section 3.2.
- `src/app/(auth)/distributor-portal/page.tsx` — call `primeThemeCache()` after OTP verify, per Section 3.2.
- `src/app/(auth)/admin-portal/page.tsx` — same, if applicable (verify first).
- `src/components/settings/ThemePanel.tsx` — add `useEffect(() => refreshSavedThemes(), [])`, per Section 3.3.
- `src/components/settings/ThemePickerList.tsx` — optional loading-state polish using `isSavedThemesLoading`.
- `src/app/layout.tsx`, `src/app/distributor/layout.tsx`, `src/app/investor/layout.tsx` — update anti-FOUC inline script to read `finiq_active_theme` instead of `finiq_theme_vars`, per Section 3.4.
- Manual logout handler (locate via grep) — clear `finiq_active_theme` from `localStorage`, per Section 3.5.

**Backend (`finiq-api`)**
- No changes required. Section 5 documents why.
