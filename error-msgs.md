# Error Message Sanitization — Module Build Guide (Antigravity Agent Instructions)

## 0. READ THIS FIRST — The Problem, Precisely

Right now, raw backend/database error text reaches the browser — in both the distributor
portal and the investor portal — through two independent leaks that both need fixing. Fixing
only one is not sufficient:

1. **Backend leak (the real security boundary):** `finiq-api`'s global exception filter and
   ~14 individual service files put raw JS `Error.message` / raw TypeORM `QueryFailedError`
   text (which, for Postgres, includes actual **table names, column names, constraint names,
   and sometimes literal SQL fragments**) directly into the JSON response body that goes over
   the wire — regardless of `NODE_ENV`.
2. **Frontend leak (the visible symptom):** `finiq`'s `apiClient` unconditionally forwards
   whatever `message` the backend sent into a thrown `Error`, and dozens of pages/components
   across both the distributor and investor portals then render that `err.message` straight
   into the UI — via inline error banners, or in two places via a raw `alert()`.

**Critically: fixing only the frontend does not solve this.** Anyone can open their browser's
DevTools → Network tab and read the raw JSON response body of any failed API call, completely
independent of what the React code chooses to render. The backend must be the actual
sanitization boundary. The frontend fix is about (a) not needing to render anything unsafe in
the first place because the backend now only ever sends safe messages, and (b) presenting
whatever safe message does arrive in a consistent, professional way instead of `alert()`
boxes and copy-pasted ad-hoc banners.

Treat this as two ordered halves of one task: **Part A (backend) is the actual fix. Part B
(frontend) is cleanup + defense in depth.** Do not consider the job done after Part B alone.

---

## 1. Part A — Backend (`finiq-api`)

### 1.1 Root cause #1: the global exception filter doesn't sanitize `message`

`src/common/filters/all-exceptions.filter.ts` (registered globally in `main.ts` via
`app.useGlobalFilters(new AllExceptionsFilter())`) currently does this:

```ts
} else if (exception instanceof Error) {
  message = exception.message;   // ← raw driver/JS error text, sent to client, ALWAYS
  error = exception.stack;       // ← only this is hidden in production
}
...
response.status(status).json({
  success: false,
  message,
  error: process.env.NODE_ENV === 'production' ? undefined : error,
  ...
});
```

Only the **stack trace** is hidden in production. The **message** — which for a raw
`QueryFailedError` from TypeORM/`pg` looks like
`duplicate key value violates unique constraint "investor_mappings_investor_id_sub_broker_id_key"`
or `null value in column "pan_no" of relation "investors" violates not-null constraint` — is
sent to the client **in every environment**, dev and production alike. This is the single
biggest leak and must be fixed first.

### 1.2 Root cause #2: services manually re-throw `error.message`

Independent of the filter, several services catch a driver/generic error and construct a
**new `HttpException` whose message is itself built from the raw error text** — this bypasses
any filter-level sanitization entirely, because by the time it reaches the filter it's already
a "safe-looking" `HttpException` with an unsafe message baked in.

Confirmed instances (grep `error\.message` under `src/modules`) — treat this as the exact
punch-list, not an example:

```
modules/companies/companies.service.ts          (logger only — safe, see 1.2.1)
modules/investors/investors.repository.ts
modules/investors/investors.service.ts
modules/investor-apis/investor-apis.service.ts
modules/scraping/scraping.service.ts
modules/brokerage-distribution/brokerage-distribution.service.ts
modules/karvy-scheme-details/karvy-scheme-details.service.ts
modules/sips/sips.service.ts
modules/investor-mapping/investor-mapping.service.ts
modules/holdings-cache/holdings-cache.controller.ts
modules/holdings-cache/holdings-cache.service.ts
modules/bank-accounts/bank-accounts.service.ts
modules/nav-history/nav-history.service.ts
modules/nav-history/nav-history.repository.ts
```

Two different patterns show up in this list — **distinguish them carefully, they need different
treatment:**

**Pattern 1 — safe, logging only (no change needed).** E.g.
`companies.service.ts:146` — `this.logger.error(\`Error creating company: ${error.message}\`,
error.stack)`. This never leaves the server; it's a server-side log line. Leave these alone.
Use this as your litmus test before touching any file: **does `error.message` appear inside a
`this.logger.*()` call only, or does it appear inside something passed to `throw new
...Exception(...)`?** Only the latter is the actual leak.

**Pattern 2 — unsafe, reaches the client.** E.g. `bank-accounts.service.ts:39`:
```ts
throw new InternalServerErrorException(error.message || 'Failed to fetch bank accounts');
```
and `sips.service.ts:98,159,216` and the `investor-mapping.service.ts` catch blocks written in
the earlier Investor Mapping guide (`throw new BadRequestException(\`Mapping failed:
${error.message}\`)`). These directly hand the caller whatever the DB driver said. **Every one
of these must be changed** to throw with a fixed, generic, user-appropriate message, while
still logging the real `error.message`/`error.stack` server-side for debugging.

### 1.3 Fix — a shared sanitization utility, used everywhere

Create `src/common/utils/safe-error.ts`:

```ts
import { Logger } from '@nestjs/common';

/**
 * Postgres error codes we know how to translate into a safe, specific,
 * user-facing message without leaking table/column/constraint names.
 * Extend this map as new cases are discovered — do NOT fall through to
 * the raw driver message for anything not listed here.
 */
const PG_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists.',
  '23503': 'This action cannot be completed because related data is linked elsewhere.',
  '23502': 'A required field is missing.',
  '22P02': 'One of the values provided is in an invalid format.',
  '23514': 'The provided value does not meet a required condition.',
};

/**
 * Returns a safe, generic message for ANY error, using the Postgres error
 * code map above when available, otherwise a flat generic fallback. Never
 * derived from `error.message` — that text must never reach the response body.
 */
export function toSafeMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const code = (error as any)?.code || (error as any)?.driverError?.code;
  if (code && PG_ERROR_MESSAGES[code]) return PG_ERROR_MESSAGES[code];
  return fallback;
}

/**
 * Standard "log full detail server-side, return safe message" helper.
 * Use this in every catch block that currently does
 * `throw new SomeException(error.message)`.
 */
export function logAndSanitize(logger: Logger, context: string, error: unknown, fallback?: string): string {
  logger.error(`${context}: ${(error as any)?.message ?? error}`, (error as any)?.stack);
  return toSafeMessage(error, fallback);
}
```

Then, in every Pattern-2 file identified in 1.2, replace the shape:

```ts
// BEFORE
} catch (error) {
  this.logger.error(`Failed to fetch bank accounts: ${error.message}`, error.stack);
  throw new InternalServerErrorException(error.message || 'Failed to fetch bank accounts');
}
```
with:
```ts
// AFTER
} catch (error) {
  throw new InternalServerErrorException(
    logAndSanitize(this.logger, 'Failed to fetch bank accounts', error, 'Unable to fetch bank accounts right now. Please try again.'),
  );
}
```
The full detail still lands in the server logs (unchanged behaviour for you, SP, when
debugging) — only the HTTP response body changes. Go through each file in the 1.2 punch-list
one at a time; do not batch-replace with a blind find/replace, since the appropriate
`fallback` string differs per call site (keep each one specific to what the user was trying to
do — "Unable to fetch bank accounts", "Unable to save this SIP", etc. — rather than one generic
string everywhere, so the UI can still be locally helpful).

### 1.4 Fix the global filter itself (defense in depth for anything not caught above)

Rewrite `src/common/filters/all-exceptions.filter.ts`:

```ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toSafeMessage } from '../utils/safe-error';

const GENERIC_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'The request could not be processed. Please check your input and try again.',
  [HttpStatus.UNAUTHORIZED]: 'You are not authorized to perform this action. Please log in again.',
  [HttpStatus.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HttpStatus.NOT_FOUND]: 'The requested resource could not be found.',
  [HttpStatus.CONFLICT]: 'This action conflicts with existing data.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again shortly.',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string;
    let validationErrors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as any;
        // Preserve structured validation-error payloads coming from our
        // ValidationPipe (src/common/pipes/validation.pipe.ts) — these are
        // deliberately curated, field-level, and safe to show as-is.
        if (body.errors && Array.isArray(body.errors)) {
          message = body.message || 'Validation failed';
          validationErrors = body.errors;
        } else {
          // Any other HttpException message is trusted ONLY because every
          // service in this codebase must now construct its HttpException
          // messages from fixed literals or `toSafeMessage()`/`logAndSanitize()`
          // — never from a raw caught error. See error-msgs.md Part A.
          message = body.message || exception.message || GENERIC_MESSAGES[status] || 'An error occurred.';
        }
      } else {
        message = (exceptionResponse as string) || GENERIC_MESSAGES[status] || 'An error occurred.';
      }
    } else {
      // Anything that isn't a deliberately-thrown HttpException (raw driver
      // errors, unexpected runtime exceptions, etc.) is NEVER shown to the
      // client — full stop, regardless of NODE_ENV.
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = toSafeMessage(exception, GENERIC_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR]);
    }

    // Full detail ALWAYS goes to the server log, in every environment.
    this.logger.error(
      `[${request.method} ${request.url}] ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      message,
      ...(validationErrors ? { errors: validationErrors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

Key behavioural changes from the original, called out explicitly:
- The `error` field (which used to carry the raw stack trace outside of production) is
  **removed from the response body entirely**, in every environment. Stack traces belong in
  logs, never in an HTTP response — there's no scenario in this app where a frontend needs
  them, since Antigravity/SP debug against server logs, not against what the browser receives.
- Non-`HttpException` errors now always resolve to a fixed generic message
  (`toSafeMessage`/`GENERIC_MESSAGES`), never `exception.message` — this closes root cause #1
  from 1.1 regardless of what individual services do, as a safety net for anything the 1.3
  punch-list missed or anything written in the future that forgets to use `logAndSanitize`.
  **Do not treat this filter fix as a substitute for 1.3** — a service that does
  `throw new BadRequestException(error.message)` still leaks, because that's a deliberately
  thrown `HttpException` and this filter (correctly) trusts `HttpException` messages by design
  — that trust is exactly why 1.3's actual fix at the source is mandatory, not optional.
- Validation errors from `ValidationPipe` (`src/common/pipes/validation.pipe.ts`) are
  special-cased to keep passing through their structured `errors: [{ field, errors }]` array —
  those are safe, deliberately curated, user-facing form-validation feedback and should keep
  working exactly as they do today (e.g. "phone_number must be a valid phone number"). Do not
  suppress these.

### 1.5 New-code guardrail — add this to project conventions, not just this one fix

Add a short section to the backend's contributing notes / README (or wherever SP keeps dev
conventions — check for a `CONTRIBUTING.md` or similar before creating a new file) stating:

> **Never construct an exception message from a caught error's `.message` property.** Always
> use a fixed string literal, or `toSafeMessage()` / `logAndSanitize()` from
> `src/common/utils/safe-error.ts`. Log the real error via `this.logger.error(...)` — that's
> the only place raw driver/exception text is allowed to appear.

This is the actual long-term fix — the punch-list in 1.2 stops today's leaks, this guardrail
stops tomorrow's.

### 1.6 Verification steps (do these before moving to the frontend)

1. Temporarily trigger a real constraint violation (e.g. call an assign endpoint twice
   rapidly, or violate a not-null column via a malformed request past validation) and confirm
   the HTTP response body's `message` field is one of the friendly strings from
   `PG_ERROR_MESSAGES`/`GENERIC_MESSAGES` — not table/column/constraint text.
2. Force an unexpected runtime error (e.g. temporarily throw a plain `throw new Error('test
   internals leak')` inside a controller) and confirm the client sees the generic
   `INTERNAL_SERVER_ERROR` message, **not** `"test internals leak"`, while the server log
   clearly shows `"test internals leak"` with a stack trace. Revert the test throw afterward.
3. Confirm `response.body.error` (the old stack-trace field) is gone entirely from every error
   response, checked against both a 400 and a 500.
4. Confirm validation errors (e.g. submit a malformed `CreateUserDto`) still return the
   structured `errors: [{ field, errors }]` array as before — this must not regress.

---

## 2. Part B — Frontend (`finiq`)

### 2.1 `apiClient.ts` — nothing structural needs to change, but harden the fallback

`fetchWithConfig` and `fetchFile` already do the right high-level thing —
`throw new Error(errorData.message || \`API Error: ${response.status}\`)` — and now that Part A
guarantees `errorData.message` is always safe, this is fine as-is. The one gap: if the response
body isn't valid JSON at all (e.g. a raw 502 from a proxy, or the backend is down), the
`.catch(() => ({}))` swallow means `errorData.message` is `undefined` and it falls back to
`\`API Error: ${response.status}\`` — acceptable and safe (just a status code, no internals),
but make the wording friendlier and consistent with the rest of this guide:

```ts
// in fetchWithConfig, and identically in fetchFile:
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || 'Something went wrong. Please try again.');
}
```
Also wrap true network failures (DNS/connection errors, which throw before you even get a
`Response`) with the same friendly fallback rather than letting a raw `TypeError: Failed to
fetch` bubble up to a page's `catch` block:

```ts
async function fetchWithConfig<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await rawFetch(endpoint, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Something went wrong. Please try again.');
    }
    return response.json();
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error); // fine — server console, not user-facing
    if (error instanceof Error && error.message.startsWith('API Error:') === false && !(error as any).__handled) {
      // already a clean Error from above, or genuinely a network-layer failure — normalize both
    }
    throw error instanceof Error ? error : new Error('Something went wrong. Please try again.');
  }
}
```
Keep this minimal — the point is just "never let a raw `TypeError`/non-Error value reach a
page's catch block unformatted," not to rebuild the whole client.

### 2.2 Build one shared error-display component — stop the copy-paste

Confirmed duplication: a near-identical inline notification block (`InlineNotif`, local
`Notif` type, same Tailwind/CSS-var styling) is hand-copied in at least
`app/investor/page.tsx`, `components/investor/CapitalGainsModal.tsx`, and
`components/distributor/clients/ClientHoldingsView.tsx`; `components/settings/ThemePanel.tsx`
independently reinvents its own `addToast`/toast-list pattern; and two places
(`app/distributor/users/page.tsx:532`, `app/distributor/reports/ledger/page.tsx:235,261`) use
a raw browser `alert()`, which is both poor UX and — if Part A ever regresses — would pop the
raw backend message in the ugliest possible way.

Create **one** shared component, `frontend/src/components/common/ErrorNotice.tsx`, generalizing
the existing `InlineNotif` pattern (reuse its exact visual design — same CSS vars, same
`AlertTriangle`/`Info`/`X` icons from `lucide-react` — since that's already the established
look in this app; do not redesign it):

```tsx
"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

export type NoticeType = "error" | "info" | "warning" | "success";

export interface Notice {
  type: NoticeType;
  message: string;
}

const STYLES: Record<NoticeType, string> = {
  error: "bg-[var(--fin-badge-danger-bg)] border-[var(--fin-badge-danger-border)] text-[var(--fin-badge-danger-text)]",
  info: "bg-[var(--fin-brand-50)] border-[var(--fin-brand-200)] text-[var(--fin-brand-700)]",
  warning: "bg-[var(--fin-badge-warning-bg)] border-[var(--fin-badge-warning-border)] text-[var(--fin-badge-warning-text)]",
  success: "bg-[var(--fin-badge-success-bg)] border-[var(--fin-badge-success-border)] text-[var(--fin-badge-success-text)]",
};

const ICONS: Record<NoticeType, React.ReactNode> = {
  error: <AlertTriangle className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
};

/** Inline, dismissible banner — for errors/info shown inside a page or modal's own layout flow. */
export function ErrorNotice({ notice, onDismiss }: { notice: Notice; onDismiss?: () => void }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-sm border text-xs font-medium mb-4 ${STYLES[notice.type]}`}>
      {ICONS[notice.type]}
      <span className="flex-1">{notice.message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss notification">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
```

Verify the `--fin-badge-success-*` CSS variables exist in the theme before using them (check
the theme token definitions used elsewhere, e.g. wherever `--fin-badge-danger-bg` /
`--fin-badge-warning-bg` are declared) — if a `success` variant token doesn't exist yet, add it
alongside the existing danger/warning tokens rather than hardcoding a raw color, to keep
theming (see SP's custom company-theme-panel work) working correctly for this new component
too.

Then add a lightweight toast variant, `frontend/src/components/common/Toast.tsx`, generalizing
`ThemePanel.tsx`'s existing `addToast` pattern (auto-dismissing, stacked, fixed-position) —
same visual language, same `STYLES`/`ICONS` maps as `ErrorNotice` above (share them via a small
`noticeStyles.ts` module so the two components can't visually drift apart over time) — plus a
tiny hook to go with it:

```tsx
// frontend/src/hooks/useToast.ts
"use client";
import { useCallback, useState } from "react";
import type { Notice, NoticeType } from "@/components/common/ErrorNotice";

export function useToast() {
  const [toasts, setToasts] = useState<(Notice & { id: number })[]>([]);

  const addToast = useCallback((type: NoticeType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
```

### 2.3 Migrate every existing ad-hoc error-display site to the shared components

Full punch-list (confirmed via `grep -rn "\.message\b" --include="*.tsx" app components`) —
go through each one, no exceptions:

| File | Current pattern | Action |
|---|---|---|
| `app/distributor/users/page.tsx:532` | `alert(error.message \|\| "Failed to save user...")` | Replace `alert()` with `addToast('error', ...)` via `useToast()`; keep the same fallback wording. |
| `app/distributor/reports/ledger/page.tsx:235,261` | `alert(\`Failed to add bank account: ${error.message}\`)` / same for ledger entry | Same — replace both `alert()` calls with toast. |
| `app/distributor/page.tsx:84` | `setError(err.message \|\| "An unexpected error occurred")` then presumably rendered raw | Keep `setError` state shape but render through `<ErrorNotice>` instead of whatever raw `<p>`/`<span>` currently renders it — check the render site near this line. |
| `app/investor/page.tsx` (local `InlineNotif` + `Notif` type) | Fully duplicated component | Delete the local `InlineNotif`/`Notif` definitions, import `ErrorNotice`/`Notice` from `components/common/ErrorNotice` instead, update call sites (`notif.message` → `notice.message`, same shape). |
| `components/investor/CapitalGainsModal.tsx` (local `InlineNotif`) | Same duplication | Same migration as above. |
| `components/distributor/clients/ClientHoldingsView.tsx` (local `InlineNotif` + `setError`) | Same duplication | Same migration as above. |
| `components/distributor/BrokerageDashboard.tsx:127` | `setError(err.message \|\| "An unexpected error occurred")` | Confirm render site uses a proper banner, not raw text; migrate to `ErrorNotice` if not already styled consistently. |
| `components/distributor/clients/FundPortfolioTab.tsx`, `FundAnalyticsModal.tsx`, `FundHoldingDetail.tsx`, `FundStyleBox.tsx` | `setError(err.message \|\| "Failed to load ...")` | Same — confirm/migrate render site to `ErrorNotice`. |
| `components/settings/ThemePanel.tsx` (local `addToast`/toast list + inline styles) | Fully duplicated toast system | Replace with the shared `useToast()` hook + a shared `<ToastStack>` render (build this small wrapper component alongside `Toast.tsx` that maps `toasts` → stacked `Toast` elements) — delete the local implementation. |
| `app/(auth)/admin-portal/page.tsx`, `app/(auth)/distributor-portal/page.tsx`, `app/(auth)/login/page.tsx`, `components/layouts/OTPVerificationForm.tsx` | `setError(err.message \|\| "...")` / `setErrorMessage(...)` | These are pre-login screens — confirm they already render through some inline error text near the OTP/phone form (not `alert`); if so, just make sure the fallback text is friendly (Part A now guarantees `err.message` itself is already safe, so no urgent change needed here beyond consistency — low priority, do last). |

For every row above where the "Action" is "confirm render site" — actually open the file and
check; do not assume it's already using a safe pattern just because it isn't using `alert()`.
The point of this table is that raw `err.message`/`error.message` reaching *any* rendered
JSX, in *any* form, is the thing being fixed — not just the two `alert()` calls.

### 2.4 Investor portal — explicit confirmation

The investor portal has fewer distinct files than the distributor portal, but is not exempt —
confirmed leak sites there: `app/investor/page.tsx` and
`components/investor/CapitalGainsModal.tsx` (both listed above). Since `apiClient.ts` and
`decodeJwt`/`authClient.ts` are shared code paths used by both portals (see
`getPortalContext()` in `apiClient.ts`, which branches on `/investor` vs everything else purely
for *which auth cookie* to attach — the error-handling code path itself is identical for both
portals), Part A's backend fix and Part B's `apiClient.ts`/`ErrorNotice`/`useToast` fixes
automatically cover the investor portal once applied — there is no separate investor-specific
error-handling stack to duplicate work on. Just make sure the investor-portal-specific call
sites in the table above actually get migrated, since they're easy to miss while focused on
the (larger) distributor portal file count.

### 2.5 Do not swallow errors silently either

While migrating, watch for the opposite mistake: a couple of call sites might be tempted to
just `catch (err) { console.error(err); }` with no user-facing feedback at all, to "solve" the
leak by hiding it entirely. That's not the goal — the user should still see a clear, friendly
"Something went wrong, please try again" (or a specific safe message) via `ErrorNotice`/toast;
they just should never see backend/database internals. Every existing catch block that
currently shows *something* to the user should keep showing *something* — just the sanitized
version.

---

## 3. Explicit Non-Goals / Do-Not-Touch List

- Do **not** change the `ResponseFormatter.success`/`.paginated` shapes — this guide only
  touches the error path (`ResponseFormatter.error` and `AllExceptionsFilter`), not the
  success-response conventions used everywhere else in the app.
- Do **not** remove or weaken `this.logger.error(...)` calls anywhere — full-detail
  server-side logging must be preserved and, where a Pattern-2 fix in 1.3 removes an inline
  `logger.error` call in favor of `logAndSanitize`'s built-in logging, confirm the log call
  still fires with equivalent detail; don't lose logging coverage while fixing the leak.
- Do **not** touch `common/pipes/validation.pipe.ts` — its structured validation-error output
  is deliberately safe and already handled correctly by the filter rewrite in 1.4.
- Do **not** apply this sanitization to `console.error(...)` calls in the frontend
  (`apiClient.ts`'s `console.error(\`API Client Error...\`)` etc.) — those only print to the
  developer's own browser console on their own machine and are useful for local debugging;
  they are not a distributor/investor-facing surface. Leave them as-is.
- Do **not** introduce a new global error-boundary/monitoring service (e.g. Sentry) as part of
  this task — that's a separate, larger initiative if SP wants it later. This guide is scoped
  to "stop leaking internals," not "add observability tooling."

---

## 4. Suggested Build & Verification Order

1. Backend `safe-error.ts` utility (1.3) first — nothing else depends on it existing, and it's
   needed by both the filter rewrite and every service fix.
2. Fix the 1.2 punch-list service files one at a time, confirming each still compiles and each
   catch block's fallback message still makes sense for that specific action.
3. Rewrite `AllExceptionsFilter` (1.4) last on the backend side, once the services no longer
   need it as their only line of defense — then run the 1.6 verification steps in full before
   touching the frontend.
4. Frontend `apiClient.ts` hardening (2.1) — small, low-risk, do first on the frontend side.
5. Build `ErrorNotice` + `Toast`/`useToast` (2.2) as new, additive components — nothing
   existing breaks yet at this point.
6. Work through the full migration table (2.3) file by file, confirming each screen still
   shows a sensible message after switching to the shared components (test by intentionally
   triggering a real error on each screen — e.g. submit an invalid form, or temporarily kill
   the backend connection — not just by reading the code).
7. Do the investor-portal-specific double-check (2.4) explicitly, since it's easy to consider
   "done" after the larger distributor-portal pass.

---

## 5. Open Questions for SP (do not guess — ask, or leave a clear TODO comment in code)

1. Should the sanitized error responses include a correlation id (e.g. a short request id
   echoed in both the response body and the server log line) so that if an investor or
   distributor reports "I got an error," support/SP can find the exact log entry without the
   response needing to contain any internal detail itself? This guide does not add one, but
   the plumbing (`AllExceptionsFilter` already logs per-request) makes it a small addition if
   wanted.
2. For the `PG_ERROR_MESSAGES` map in `safe-error.ts` — this guide seeds it with the handful of
   most common Postgres error codes. As new raw-driver-error cases are discovered in the wild
   (via the now-sanitized-but-still-fully-logged server logs), they should be added to this
   map with a specific friendly message rather than falling through to the flat generic
   fallback — confirm SP wants this maintained reactively (as errors are observed in logs)
   rather than trying to preemptively enumerate every possible Postgres error code now.
3. Confirm whether pre-login screens (OTP send/verify, listed at the bottom of the 2.3 table)
   are in scope for this pass or can be deferred — they're lower-risk (no schema-shaped errors
   expected from an OTP flow) but were included for completeness.
