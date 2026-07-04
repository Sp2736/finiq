# Systematic Transactions Report — Move PDF Formatting to Backend

## 0. Context (read fully before touching anything)

Today, the **Systematic Transactions Report** (distributor portal) builds its export
PDF entirely in the browser:

- `finiq/src/app/distributor/reports/systematic-transactions/page.tsx` →
  `handleExportPDF()` → calls `generateSystematicPDF()` from
  `finiq/src/lib/systematicReportExport.ts` (client-side `jsPDF` + `jspdf-autotable`).
- No backend endpoint is hit at all when the user clicks "Export PDF".

This is **inconsistent** with how the other reports (Capital Gains, Holdings,
Transactions) are architected on the backend: those reports have dedicated
"export" NestJS services (`*-export.service.ts`) that build the PDF **on the
server** using `jsPDF` + `jspdf-autotable` inside NestJS, and a controller
route that returns the PDF as a binary buffer (`application/pdf`) for the
browser to download.

**Good news:** a backend service for this exact report **already exists** and
is **already wired to a controller route**, but the frontend never calls it:

- `finiq-api/src/modules/sips/systematic-report-export.service.ts`
  → class `SystematicReportExportService`, method `generatePDF(data, opts, distributorInfo)`
- `finiq-api/src/modules/sips/sips.controller.ts`
  → route `POST /api/sips/systematic-report/export` (method `exportSystematicReport`)

So the backend "formatting" piece is largely done. **The actual work in this
task is almost entirely on the frontend**: wire the Export PDF button to call
that backend route (with one backend controller tweak, described in Phase 1)
instead of running `generateSystematicPDF()` in the browser.

### Why we are NOT doing a naive "re-fetch on the server" like Capital Gains / Transactions / Holdings do

The other reports' export controllers re-run their data query server-side
from a handful of lightweight params (`investor_id`, date range) because their
on-screen filtering is simple and mirrors what the server can compute.

Systematic Transactions is different: the on-screen table applies **client-side-only**
filtering/grouping that has **no clean 1:1 server-side equivalent** today:

- The "Mode" filter (`Running / Forthcoming / Terminated / Procured / Matured /
  Expired / Deleted / Status / Analysis`) is computed in the browser from
  `termination_date` / `end_date`, and is **never sent to the server** — not even
  by the existing `GET` report call.
- The investor filter matches by **display name** (`toTitleCase(item.investor_name)`),
  not by `investor_id`.
- The backend's `status` param (in `SipsService.getSystematicReport`) only
  accepts a different enum (`CURRENTLY_RUNNING / FORTHCOMING /
  PREMATURELY_TERMINATED / DUE_TO_MATURITY`) that does not map 1:1 to the
  "Mode" dropdown above.

Re-deriving all of this server-side correctly is a separate, larger effort
(and risks producing a PDF that doesn't match what the distributor sees on
screen). **Do not attempt to unify these filter semantics as part of this
task.**

Instead, the approach here is:

> Keep all existing data-fetching and client-side filtering/grouping logic in
> `page.tsx` exactly as it is today. When the user clicks "Export PDF", send
> the **already-filtered row array** (`filteredReportData`, ungrouped) plus
> the export options (`type`, `investorLabel`, `groupBy`,
> `distributor_info`) to the backend. The backend does the actual PDF
> rendering/formatting (colors, tables, grouping-into-summary-table, page
> headers/footers, logo) — exactly the part the user wants moved server-side —
> and streams back a PDF buffer. This guarantees the PDF always matches what
> is on screen, and moves 100% of the "formatting" logic (fonts, palette,
> layout, jsPDF/autoTable code) out of the browser bundle and into NestJS,
> consistent with the other reports' architecture.

This is a deliberate, reasoned deviation from the "server re-fetches by ID"
pattern used elsewhere — call this out in your PR description if you open one.

---

## 1. Backend changes — `finiq-api`

### 1.1 Verify the existing export service (no changes expected)

Open `finiq-api/src/modules/sips/systematic-report-export.service.ts` and
confirm it still looks like this (do **not** modify unless it has drifted):

- Class `SystematicReportExportService`, exported, `@Injectable()`.
- Public method: `generatePDF(data: any[], opts: SystematicReportExportOpts, distributorInfo?: any): Buffer`
- `opts` shape: `{ type: string; investorLabel: string; groupBy: string }`.
- Internally: if `opts.groupBy !== 'None'` it renders a **grouped summary
  table** (`drawGroupSummary`, grouping by `investor_name` / `amc_name` /
  `scheme_name` / `source` depending on `groupBy`); otherwise it renders the
  **detail table** (`drawDetailTable`) plus a totals band.
- Uses the navy/steel-blue palette (`const C = {...}`) — same design tokens as
  the client-side lib it is replacing. **Do not change the palette or layout
  as part of this task** — this task is about wiring, not restyling.

**Note for your own understanding (no action needed):** this service groups
AMC by `item.amc_name`, which is the correct field returned by
`SipsService.getSystematicReport` (see `sips.service.ts`, `amc_name: r.amc_name`).
The **on-screen** grouping logic in `page.tsx` currently (incorrectly) groups
by `item.amc_code`, which does not exist on the row objects, so "Group By:
AMC" on screen currently silently buckets everything into "Unknown AMC". This
is a **pre-existing, separate bug in the on-screen table** — do not fix it as
part of this task. It is not in scope, and fixing it would change on-screen
behavior beyond what was asked. It's mentioned here only so you understand
why the PDF's AMC grouping (which will now use the correct field) may look
different/better than the on-screen "Group By: AMC" view — that is expected
and fine.

### 1.2 Modify the controller route to accept pre-filtered data directly

File: `finiq-api/src/modules/sips/sips.controller.ts`

Currently `exportSystematicReport` **ignores** any data sent by the client and
re-runs `sipsService.getSystematicReport(...)` itself. Change it to use the
`data` array sent by the frontend instead, and add basic payload validation.

Find this method:

```ts
  @Post('systematic-report/export')
  @HttpCode(HttpStatus.OK)
  async exportSystematicReport(
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (req.user?.type === 'investor') {
      throw new ForbiddenException('Only distributors can access this endpoint');
    }
    const { type, status, arnIds, registrar, investor_id, investorId, investorLabel, groupBy, distributor_info } = body;

    const report = await this.sipsService.getSystematicReport(
      req.user, type, status, arnIds, registrar, investor_id || investorId,
    );

    const pdfBuffer = this.systematicReportExportService.generatePDF(
      report,
      {
        type: type || 'All',
        investorLabel: investorLabel || 'All Investors',
        groupBy: groupBy || 'None',
      },
      distributor_info,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="systematic-transactions-report.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
```

Replace it with:

```ts
  @Post('systematic-report/export')
  @HttpCode(HttpStatus.OK)
  async exportSystematicReport(
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (req.user?.type === 'investor') {
      throw new ForbiddenException('Only distributors can access this endpoint');
    }

    const { data, type, investorLabel, groupBy, distributor_info } = body;

    if (!Array.isArray(data)) {
      throw new BadRequestException(
        'data must be an array of systematic transaction records',
      );
    }
    if (data.length > 20000) {
      throw new BadRequestException(
        'Too many records to export in a single request (max 20000)',
      );
    }

    const pdfBuffer = this.systematicReportExportService.generatePDF(
      data,
      {
        type: type || 'All',
        investorLabel: investorLabel || 'All Investors',
        groupBy: groupBy || 'None',
      },
      distributor_info,
    );

    const safeInvestorName = String(investorLabel || 'All_Investors')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'All_Investors';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${safeInvestorName}-Systematic_Report_${type || 'All'}_${dateStr}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
```

Notes:
- `BadRequestException` is **already imported** at the top of this file
  (used by `getCompanySipSummary`) — do not add a duplicate import.
- `this.sipsService` (the `SipsService` injected in the constructor) is no
  longer called from this method, but **do not remove it from the
  constructor** — it's still used by the other three routes in this
  controller (`getCompanySipSummary`, `getInvestorSips`, `getSipDetail`,
  `getSystematicReport`).
- Do **not** touch `sips.service.ts` — it is unrelated to this change.

### 1.3 Do not touch

- `capital-gains-export.service.ts`, `capital-gains.controller.ts`
- `investors-export.service.ts`, `transactions-export.service.ts`,
  `investors.controller.ts`
- `sips.service.ts`
- Any DTOs, guards, or auth modules

These are reference material only (see Phase 0) — no changes needed there.

---

## 2. Frontend changes — `finiq`

### 2.1 Add binary/blob download support to `apiClient`

File: `finiq/src/lib/apiClient.ts`

Today, `apiClient.post()` (via the internal `fetchWithConfig`) **always** calls
`response.json()` — it cannot handle a binary PDF response. We need a new
method, `apiClient.postForFile()`, that performs the same auth/refresh
handling as the existing JSON path, but returns a `Blob` + the filename
parsed from the `Content-Disposition` header instead of parsed JSON.

Replace the **entire contents** of `finiq/src/lib/apiClient.ts` with the
following (this is a refactor of the existing file: the cookie/portal helpers
and the 401-refresh-retry logic are extracted into a shared `rawFetch()`
function so both the JSON path and the new blob path share identical auth
behavior):

```ts
// src/lib/apiClient.ts

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
};

const getPortalContext = () => {
  if (typeof window === "undefined") return "staff";
  return window.location.pathname.startsWith("/investor")
    ? "investor"
    : "staff";
};

// Global variables to prevent infinite refresh loops when multiple API calls fail simultaneously
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Performs the fetch, including the 401 → refresh-token → retry → logout
 * flow. Returns the raw Response so callers can decide how to consume the
 * body (json() vs blob()).
 */
async function rawFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const portal = getPortalContext();
  let token = getCookieValue(`${portal}-auth-token`);

  const getHeaders = (activeToken: string | null) => {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    if (activeToken) headers.set("Authorization", `Bearer ${activeToken}`);
    return headers;
  };

  const baseUrl = "/api";
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers: getHeaders(token),
    credentials: "same-origin",
  });

  // ─── REFRESH TOKEN INTERCEPTOR ───
  // Investors do not use refresh tokens (their JWT lasts 7 days), so skip refresh logic for them.
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && portal === "staff") {
    const refreshToken = getCookieValue(`${portal}-refresh-token`);
    const userId = getCookieValue(`${portal}-user-id`);

    if (refreshToken && userId) {
      if (!isRefreshing) {
        isRefreshing = true;

        // Execute refresh token request (only for staff)
        refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, refresh_token: refreshToken }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data.access_token) {
              const newAccess = data.data.access_token;
              const newRefresh = data.data.refresh_token || refreshToken;

              // Silently update cookies for another 30 days
              const expires = new Date();
              expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
              document.cookie = `${portal}-auth-token=${newAccess}; path=/; expires=${expires.toUTCString()}; max-age=2592000; SameSite=Lax`;
              document.cookie = `${portal}-refresh-token=${newRefresh}; path=/; expires=${expires.toUTCString()}; max-age=2592000; SameSite=Lax`;

              return newAccess;
            }
            throw new Error("Refresh token invalid");
          })
          .catch(() => null)
          .finally(() => {
            isRefreshing = false;
          });
      }

      const newAccessToken = await refreshPromise;

      // If refresh was successful, retry original request
      if (newAccessToken) {
        response = await fetch(`${baseUrl}${cleanEndpoint}`, {
          ...options,
          headers: getHeaders(newAccessToken),
          credentials: "same-origin",
        });
      }
    }

    // ─── FINAL LOGOUT IF REFRESH FAILS OR DOESN'T EXIST ───
    if (response.status === 401) {
      console.warn(
        "Unauthorized: The token expired or is invalid. Redirecting to login...",
      );
      if (typeof window !== "undefined") {
        document.cookie = `${portal}-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${portal}-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${portal}-user-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

        localStorage.clear();
        sessionStorage.clear();

        window.location.href =
          portal === "staff" ? "/distributor-portal" : "/login";
      }
    }
  }

  return response;
}

async function fetchWithConfig<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await rawFetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/**
 * Parses a filename out of a Content-Disposition header, e.g.
 * `attachment; filename="Report_2026-07-01.pdf"` → `Report_2026-07-01.pdf`.
 */
function parseFilenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

/**
 * Like fetchWithConfig, but for endpoints that return a binary file
 * (e.g. a generated PDF/Excel) instead of JSON. Shares the same
 * auth/refresh handling via rawFetch.
 */
async function fetchFile(
  endpoint: string,
  options: RequestInit = {},
  fallbackFilename: string = "download",
): Promise<DownloadedFile> {
  try {
    const response = await rawFetch(endpoint, options);

    if (!response.ok) {
      // Errors from these endpoints are still JSON (NestJS exception filters)
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const blob = await response.blob();
    const filename = parseFilenameFromContentDisposition(
      response.headers.get("Content-Disposition"),
      fallbackFilename,
    );

    return { blob, filename };
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "DELETE" }),
  /**
   * POST that expects a binary file response (PDF/Excel) instead of JSON.
   * Use this for report "export" endpoints.
   */
  postForFile: (
    endpoint: string,
    data: any,
    fallbackFilename?: string,
    options?: RequestInit,
  ) =>
    fetchFile(
      endpoint,
      { ...options, method: "POST", body: JSON.stringify(data) },
      fallbackFilename,
    ),
};
```

**Do not** change the Next.js rewrite config
(`finiq/next.config.ts`) — it already proxies `/api/:path*` generically and
passes binary bodies through untouched, so no proxy work is needed here.

### 2.2 Add a small "trigger browser download" helper

File: `finiq/src/lib/utils.ts`

Add this new exported function at the end of the file (after `decodeJwt`).
Do not modify any existing exports in this file.

```ts
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
```

### 2.3 Add `exportSystematicReport` to `distributorService`

File: `finiq/src/services/distributor.service.ts`

Find the existing `getSystematicReport` method (near the end of the
`distributorService` object):

```ts
  getSystematicReport: async (
    data: SystematicReportPayload,
  ): Promise<ApiResponse<SystematicReportItem[]>> => {
    return apiClient.post<ApiResponse<SystematicReportItem[]>>(
      "/sips/systematic-report",
      data,
    );
  },
};
```

Add a new method **right after it**, still inside the `distributorService`
object (note the trailing comma change — the new method becomes the last
entry before the closing `};`):

```ts
  getSystematicReport: async (
    data: SystematicReportPayload,
  ): Promise<ApiResponse<SystematicReportItem[]>> => {
    return apiClient.post<ApiResponse<SystematicReportItem[]>>(
      "/sips/systematic-report",
      data,
    );
  },

  exportSystematicReport: async (payload: {
    data: SystematicReportItem[];
    type: string;
    investorLabel: string;
    groupBy: string;
    distributor_info?: any;
  }) => {
    return apiClient.postForFile(
      "/sips/systematic-report/export",
      payload,
      "systematic-transactions-report.pdf",
    );
  },
};
```

No new imports are required — `apiClient` is already imported at the top of
this file.

### 2.4 Wire up the distributor Systematic Transactions page

File: `finiq/src/app/distributor/reports/systematic-transactions/page.tsx`

**Step A — update the import.** Find:

```tsx
import { distributorService } from "@/services/distributor.service";
import {
  generateSystematicPDF,
  toTitleCase,
} from "@/lib/systematicReportExport";
```

Replace with:

```tsx
import { distributorService } from "@/services/distributor.service";
import { DISTRIBUTOR_INFO, toTitleCase } from "@/lib/systematicReportExport";
import { triggerBlobDownload } from "@/lib/utils";
```

We keep importing `DISTRIBUTOR_INFO` and `toTitleCase` from the existing
`systematicReportExport.ts` file — it already exports the correct base64
logo constant and an identical `toTitleCase` implementation, and the investor
portal still depends on this file (see Phase 3 / "Out of scope" below), so
**do not delete or gut `systematicReportExport.ts`** as part of this task.
We are only removing the call to its `generateSystematicPDF` function from
this page.

**Step B — add an "exporting" loading state.** Find:

```tsx
  // Applied Filter States
  const [appliedInvestorId, setAppliedInvestorId] = useState<string>("ALL");
  const [appliedMode, setAppliedMode] = useState<string>(MODES[0]);
  const [appliedType, setAppliedType] = useState(TRANSACTION_TYPES[0]);
  const [appliedGroupBy, setAppliedGroupBy] = useState<string>(
    GROUP_BY_OPTIONS[0],
  );
```

Add a new state declaration immediately after it:

```tsx
  // Applied Filter States
  const [appliedInvestorId, setAppliedInvestorId] = useState<string>("ALL");
  const [appliedMode, setAppliedMode] = useState<string>(MODES[0]);
  const [appliedType, setAppliedType] = useState(TRANSACTION_TYPES[0]);
  const [appliedGroupBy, setAppliedGroupBy] = useState<string>(
    GROUP_BY_OPTIONS[0],
  );

  // PDF export state (backend-generated export)
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
```

**Step C — replace `handleExportPDF`.** Find:

```tsx
  const handleExportPDF = () => {
    if (appliedGroupBy === "None" && filteredReportData.length === 0) return;
    if (
      appliedGroupBy !== "None" &&
      (!groupedReportData || groupedReportData.length === 0)
    )
      return;

    const nameToExport =
      appliedInvestorId === "ALL" ? "All Investors" : appliedInvestorId;
    generateSystematicPDF(
      filteredReportData,
      appliedType,
      nameToExport,
      groupedReportData,
      appliedGroupBy,
    );
  };
```

Replace with:

```tsx
  const handleExportPDF = async () => {
    if (appliedGroupBy === "None" && filteredReportData.length === 0) return;
    if (
      appliedGroupBy !== "None" &&
      (!groupedReportData || groupedReportData.length === 0)
    )
      return;

    if (isExportingPdf) return;

    const nameToExport =
      appliedInvestorId === "ALL" ? "All Investors" : appliedInvestorId;

    setIsExportingPdf(true);
    setExportError(null);
    try {
      const { blob, filename } = await distributorService.exportSystematicReport({
        data: filteredReportData,
        type: appliedType,
        investorLabel: nameToExport,
        groupBy: appliedGroupBy,
        distributor_info: DISTRIBUTOR_INFO,
      });
      triggerBlobDownload(blob, filename);
    } catch (error) {
      console.error("Failed to export systematic transactions PDF", error);
      setExportError(
        error instanceof Error
          ? error.message
          : "Failed to generate the PDF. Please try again.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };
```

Notes:
- We intentionally send `filteredReportData` (the **raw, ungrouped** rows the
  user is currently looking at), not `groupedReportData`. The backend's
  `generatePDF` computes its own group summary from the raw rows when
  `groupBy !== 'None'` (see Phase 0/1.1) — do not send pre-grouped data, the
  backend does not expect that shape.
- `exportError` is intentionally simple (a string, not a toast system) —
  check the rest of this file/its siblings for an existing toast/notification
  pattern before adding UI for it in Step D. If one exists, use it instead of
  inventing a new one. If none exists, a minimal inline message is enough
  (see Step D below) — do not introduce a new dependency for this.

**Step D — update the Export button JSX.** Find:

```tsx
            <button
              onClick={handleExportPDF}
              disabled={!hasSearched || !hasData || isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--fin-btn-primary-text)] text-sm font-semibold rounded-md shadow-sm transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
```

Replace with:

```tsx
            <button
              onClick={handleExportPDF}
              disabled={!hasSearched || !hasData || isLoading || isExportingPdf}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--fin-btn-primary-text)] text-sm font-semibold rounded-md shadow-sm transition-all shrink-0"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExportingPdf ? "Generating…" : "Export PDF"}
            </button>
```

`Loader2` is **already imported** at the top of this file (it's in the
`lucide-react` import list used elsewhere for the "Generate" button) — do not
add a duplicate import.

Optionally, directly below the closing `</div>` of the header row (the `div`
that wraps the `<h1>` title and the Export button), render `exportError` if
present, e.g.:

```tsx
          {exportError && (
            <p className="text-sm text-red-600 mt-2">{exportError}</p>
          )}
```

Place this immediately after the header `div` closes (i.e., as a sibling,
still inside the outer header container) — do not nest it inside the
flex row with the button, or it will break the header layout.

### 2.5 What NOT to change in this phase

- **`finiq/src/app/investor/reports/systematic-transactions/page.tsx`** —
  the investor portal's version of this report still uses
  `generateSystematicPDF()` client-side. **Leave it exactly as is.** It calls
  a different data endpoint (`/api/my-portfolio/systematic-report`, via
  `investorService.getSystematicReport`), and the corresponding backend
  controller (`investor-apis.controller.ts`) has **no export route at all**
  yet. Wiring the investor portal to a backend-rendered PDF would require
  adding a brand-new backend endpoint (e.g. `POST
  /api/my-portfolio/systematic-report/export`, scoped to `req.user.id`,
  reusing `SystematicReportExportService`) and is a reasonable **follow-up
  task**, but it is out of scope here unless explicitly requested.
- **`finiq/src/lib/systematicReportExport.ts`** — keep this file as-is. It is
  still the sole PDF generator for the investor portal (Phase 3 above) and
  still exports `DISTRIBUTOR_INFO`/`toTitleCase` used by the distributor
  page after this change. Do not delete it or remove any of its exports.
- Do not touch `ClientHoldingsView.tsx`, `investor/page.tsx`,
  `InvestorSidebar.tsx`, `capitalGainsExport.ts`, `portfolioExport.ts`, or
  `transactionReportExport.ts` — these are reference material only (Phase 0),
  not part of this change.
- Do not attempt to unify the "Mode" filter with the backend `status` enum
  (see Phase 0's "Why we are NOT..." explanation).
- Do not change the visual design/colors/layout of the generated PDF —
  `systematic-report-export.service.ts` already matches the intended
  palette; this task is about wiring, not restyling.

---

## 3. Manual verification checklist

Backend (`finiq-api`):

1. `npm run build` (or the project's equivalent) compiles with no TypeScript
   errors in `sips.controller.ts`.
2. Start the API and, as a distributor/company-admin user, `POST
   /api/sips/systematic-report/export` with a body like:
   ```json
   {
     "data": [ /* an array of a few systematic-transaction row objects, e.g. copied from a real GET /api/sips/systematic-report response */ ],
     "type": "SIP",
     "investorLabel": "All Investors",
     "groupBy": "None",
     "distributor_info": { "name": "Test Distributor" }
   }
   ```
   Confirm:
   - Response is `200` with `Content-Type: application/pdf`.
   - `Content-Disposition` filename looks like
     `All_Investors-Systematic_Report_SIP_<date>.pdf`.
   - The PDF opens and shows a detail table matching the `data` sent.
3. Repeat with `"groupBy": "AMC"` and confirm a grouped summary table (AMC /
   No. of Mandates / Total Amount) renders instead of the detail table.
4. Confirm calling this route as an investor-type user still returns `403
   Forbidden` (existing check, unchanged).
5. Confirm sending `"data": "not-an-array"` returns `400 Bad Request`.

Frontend (`finiq`):

1. `npm run build` (or `next build`) compiles with no TypeScript errors.
2. On the distributor portal, go to Reports → Systematic Transactions.
3. Click "Generate" with some filters, confirm the table renders as before
   (unchanged — this task does not touch data-fetching/table logic).
4. Click "Export PDF":
   - Button shows a spinner and "Generating…" while the request is in
     flight.
   - A PDF file downloads via the browser (no more instant client-side
     `jsPDF` save — there is a real network round trip now, so a brief
     delay is expected).
   - Open the PDF and confirm it matches what's on screen (rows, amounts,
     dates, and, if a Group By is applied, the grouped summary table).
   - Confirm the distributor logo (or whatever is in `DISTRIBUTOR_INFO`)
     renders in the PDF header.
5. Try exporting with zero results and confirm the button stays disabled (no
   change from existing behavior).
6. Confirm the investor portal's Systematic Transactions page is completely
   unaffected — its Export PDF button should still generate a PDF instantly,
   client-side, as before.
7. Open browser dev tools → Network tab while exporting from the distributor
   page and confirm a `POST` to `/api/sips/systematic-report/export` occurs
   and returns a `200` with a PDF content type.

---

## 4. Summary of files touched

| File | Change |
|---|---|
| `finiq-api/src/modules/sips/sips.controller.ts` | `exportSystematicReport` now uses client-supplied `data` instead of re-querying; adds validation |
| `finiq-api/src/modules/sips/systematic-report-export.service.ts` | none (verify only) |
| `finiq/src/lib/apiClient.ts` | full refactor: extract `rawFetch`, add `postForFile` |
| `finiq/src/lib/utils.ts` | add `triggerBlobDownload` |
| `finiq/src/services/distributor.service.ts` | add `exportSystematicReport` method |
| `finiq/src/app/distributor/reports/systematic-transactions/page.tsx` | swap import, add loading/error state, rewrite `handleExportPDF`, update button JSX |

Not touched: `finiq/src/app/investor/reports/systematic-transactions/page.tsx`,
`finiq/src/lib/systematicReportExport.ts`, all Capital Gains / Holdings /
Transactions frontend and backend files, `sips.service.ts`.
