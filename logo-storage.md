# Company Logo Storage Migration: Base64 → S3 Bucket

## ⚠️ Read this first — credential handling

The AWS access key/secret shared in chat must **not** be hardcoded anywhere in the repo, committed to git, or placed in any file that gets checked in. They go into environment variables only (`.env`, which must already be in `.gitignore` for both repos — verify this first).

**Strong recommendation before starting:** because these credentials were pasted in plaintext in a chat conversation, treat them as already-exposed. Rotate/regenerate the IAM access key in the AWS Console after wiring everything up (or before, using a temporary key for development), and update the `.env` files once the new key is issued. Do not ship this change to production with the key exactly as shared.

Environment variables to add to `finiq-api`'s `.env` (and to the deployment environment/secrets manager):

```
AWS_ACCESS_KEY_ID=<value>
AWS_SECRET_ACCESS_KEY=<value>
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=finiq
```

Do not prefix these with `NEXT_PUBLIC_` anywhere — the frontend must never hold AWS credentials. All S3 access (uploads, presigned URL generation) happens through `finiq-api` only.

---

## 1. Goal / Architecture Summary

**Current state:** `company_details.logo_base64` (a `text` column) stores the entire logo image as a base64 string. This string is:
- Embedded directly in login API responses (`company_logo` field) for both staff and investor auth.
- Cached in the frontend's `localStorage` under the key `company_logo_base64`.
- Injected directly as `<img src="data:image/png;base64,...">` in sidebars.
- Embedded into generated PDF exports via `jsPDF`'s `doc.addImage(base64String, ...)`.

**New state:**
- The actual image bytes live in an S3 bucket (`finiq`, region `ap-south-1`).
- The database stores only a small reference — an S3 **object key** (e.g. `company-logos/{company_id}/logo.png`) — not the image bytes.
- The backend generates **presigned GET URLs** (short-lived, e.g. 15–60 minutes) for the frontend to fetch/display the logo, and **presigned PUT URLs**/a direct upload endpoint for uploading a new logo.
- The frontend's `localStorage` cache now stores `{ url, expiresAt, s3Key }` (a resolvable URL + expiry), not the raw image bytes. The `<img>` tags point directly at the S3 URL instead of a `data:` URI.
- PDF export code fetches the image bytes (via the presigned URL/S3 key) and converts them to base64 **in-memory, at export time**, only where `jsPDF.addImage` still requires a base64/dataURL argument (jsPDF has no other way to embed images) — this is fundamentally different from storing megabytes of base64 permanently in the DB/JWT/localStorage; it's a transient conversion needed only for image embedding at generation time.

---

## 2. Backend (`finiq-api`) Changes

### 2.1 Install AWS SDK dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2.2 Add environment variables

Add to `.env` (and `.env.example` with placeholder values, never real secrets):

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=finiq
```

Confirm `ConfigModule` is already global (check `app.module.ts`) so `ConfigService` can read these anywhere without re-importing.

### 2.3 Create a shared S3 module/service

Create `src/modules/s3/s3.module.ts` and `src/modules/s3/s3.service.ts`:

```ts
// src/modules/s3/s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'finiq';
    this.client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') as string,
      },
    });
  }

  async uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'private',
      }),
    );
  }

  async getSignedReadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = res.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Failed to delete S3 object ${key}: ${err}`);
    }
  }
}
```

```ts
// src/modules/s3/s3.module.ts
import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
```

Import `S3Module` in every module that needs it (`AuthModule`, `InvestorAuthModule`, `CompaniesModule`, and the export-generating modules listed in §2.6e).

### 2.4 Database migration: replace `logo_base64` with `logo_s3_key`

Edit `src/entities/company-detail.entity.ts`:

```ts
// BEFORE
@Column({ type: 'text', nullable: true })
logo_base64: string;

// AFTER
@Column({ type: 'text', nullable: true })
logo_s3_key: string | null;
```

Check how existing migrations are structured in this repo (look for a `migrations/` folder, TypeORM CLI config, or a manual-SQL/`onModuleInit` pattern like `ThemesService` already uses for its own schema changes) and follow that same convention. The migration must:

```sql
ALTER TABLE company_details ADD COLUMN IF NOT EXISTS logo_s3_key TEXT DEFAULT NULL;
-- Data backfill (see §2.5) happens via a one-off script, not raw SQL,
-- since it needs to decode base64 and upload to S3.
-- Only after backfill is confirmed successful:
ALTER TABLE company_details DROP COLUMN IF EXISTS logo_base64;
```

**Do not drop `logo_base64` until the backfill script (§2.5) has successfully run against production data and been verified.** Keep both columns during the transition window.

### 2.5 One-off backfill script

Write a standalone script (e.g. `scripts/backfill-logos-to-s3.ts`, run via `ts-node`) that:
1. Selects every row from `company_details` where `logo_base64 IS NOT NULL AND logo_base64 != ''`.
2. For each row: strips any `data:image/...;base64,` prefix if present, decodes the base64 string into a `Buffer`, detects the image content type (check a few real rows first to confirm what format they're actually in; default to `image/png` if undetectable), and uploads it to S3 at a deterministic key like `company-logos/{company_id}/logo.png`.
3. Updates that row's `logo_s3_key` column with the resulting key.
4. Logs successes/failures; does NOT delete `logo_base64` data — that's a separate, manual cleanup step after verification.

Run once via `npx ts-node scripts/backfill-logos-to-s3.ts`.

### 2.6 Update every backend read/write site

**a) `src/modules/auth/authentication.service.ts`** (staff/distributor login)
- Currently: fetches `companyDetail.logo_base64` and returns it as `company_logo: logo_base64` in the login response.
- Change to: fetch `companyDetail.logo_s3_key`; if present, call `s3Service.getSignedReadUrl(logo_s3_key)`. Return `company_logo_url: logoUrl` instead of `company_logo` (renamed field — the rename is deliberate so the frontend can't accidentally treat it as raw base64 anymore; see §3).
- Inject `S3Service` into the constructor; import `S3Module` into `AuthModule`.

**b) `src/modules/investor-auth/investor-auth.service.ts`** (investor login)
- Same pattern: `investor.company?.details?.logo_s3_key` → presigned URL → return as `logo_url` instead of `logo_base64`.
- Update `src/modules/investor-auth/dto/investor-auth.dto.ts` — `logo_base64: string | null;` becomes `logo_url: string | null;`.
- Inject `S3Service`; import `S3Module` into `InvestorAuthModule`.

**c) New: company logo upload/delete/refresh endpoints**

There's currently no dedicated logo-upload endpoint (logo assignment today only happens generically through company creation's `Object.assign(details, createCompanyDto.details)`). Add explicit endpoints in `src/modules/companies/companies.controller.ts`:

```ts
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Post(':companyId/logo')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file'))
async uploadLogo(
  @Param('companyId') companyId: string,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.companiesService.uploadLogo(companyId, file);
}

@Delete(':companyId/logo')
@UseGuards(JwtAuthGuard)
async deleteLogo(@Param('companyId') companyId: string) {
  return this.companiesService.deleteLogo(companyId);
}

@Get(':companyId/logo-url')
@UseGuards(JwtAuthGuard)
async getLogoUrl(@Param('companyId') companyId: string) {
  return this.companiesService.getLogoUrl(companyId);
}
```

Confirm `@nestjs/platform-express` is already a dependency (standard for NestJS) and that `main.ts` doesn't need extra config for multipart form uploads.

In `companies.service.ts`, add:

```ts
async uploadLogo(companyId: string, file: Express.Multer.File) {
  const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
  const key = `company-logos/${companyId}/logo.${ext}`;
  await this.s3Service.uploadObject(key, file.buffer, file.mimetype);
  await this.repository.updateCompanyDetailLogoKey(companyId, key); // add this repo method
  const url = await this.s3Service.getSignedReadUrl(key);
  return { logo_s3_key: key, logo_url: url };
}

async deleteLogo(companyId: string) {
  const details = await this.repository.findCompanyDetail(companyId); // reuse/expose existing lookup
  if (details?.logo_s3_key) {
    await this.s3Service.deleteObject(details.logo_s3_key);
  }
  await this.repository.updateCompanyDetailLogoKey(companyId, null);
  return { success: true };
}

async getLogoUrl(companyId: string) {
  const details = await this.repository.findCompanyDetail(companyId);
  if (!details?.logo_s3_key) return { logo_url: null };
  const url = await this.s3Service.getSignedReadUrl(details.logo_s3_key);
  return { logo_url: url };
}
```

Add `updateCompanyDetailLogoKey(companyId, key)` to `companies.repository.ts` (a simple `UPDATE company_details SET logo_s3_key = $1 WHERE company_id = $2`, or the TypeORM-equivalent `.update()` call, matching this repository's existing conventions).

**d) Why the logo-url refresh endpoint matters:** presigned URLs expire (§2.3's default is 3600s). The frontend needs a cheap way to fetch a fresh URL without forcing a full re-login — that's exactly what `GET /api/companies/:companyId/logo-url` (added above) is for. See §3.2.

**e) PDF export services** — these currently receive `distributorInfo.logoBase64` from the **frontend request body** (`@Body('distributor_info') distributorInfo: any`) and call `doc.addImage(logoBase64, ...)`. Files to update:
- `src/modules/capital-gains/capital-gains-export.service.ts` (~line 910)
- `src/modules/investors/investors-export.service.ts` (~line 87)
- `src/modules/investors/transactions-export.service.ts` (~line 102)
- `src/modules/sips/systematic-report-export.service.ts` (~line 95)

Since `jsPDF.addImage()` requires actual image data (base64/data URL), not a remote URL, these services must fetch the image bytes server-side (using `S3Service.getObjectBuffer`, §2.3) and convert to base64 in-memory at generation time, instead of expecting the frontend to send a base64 string. Change the incoming field from `distributor_info.logoBase64` to `distributor_info.logoS3Key`, and in each service:

```ts
if (data.distributorInfo?.logoS3Key) {
  try {
    const buffer = await this.s3Service.getObjectBuffer(data.distributorInfo.logoS3Key);
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
    doc.addImage(base64, 'PNG', ML, 5, 36, 16);
  } catch (err) {
    console.warn('Could not render distributor logo:', err);
  }
}
```

Inject `S3Module` into whichever modules own these four export services.

**f) Note on hardcoded dummy logos:** `src/lib/systematicReportExport.ts` and `src/components/distributor/clients/ClientHoldingsView.tsx` (both frontend) currently contain a hardcoded fallback constant with a literal placeholder base64 PNG baked in as `logoBase64`. These are leftover dummy data, not real per-company logos — remove them now that real logos flow through S3 (see §3.9).

---

## 3. Frontend (`finiq`) Changes

### 3.1 `localStorage` contract change

Replace `company_logo_base64` (raw base64 string) with `company_logo_cache`, storing a small JSON object:

```ts
interface CachedCompanyLogo {
  url: string;         // presigned S3 URL
  expiresAt: number;   // epoch ms — when the presigned URL expires
  s3Key: string | null;
}
```

This is the whole point of the migration — `localStorage` should never again hold a multi-hundred-KB base64 blob; it holds a short URL string plus an expiry.

### 3.2 Handle presigned URL expiry

1. On login, store the URL + `expiresAt = Date.now() + <ttlSeconds>*1000` (use a value safely under the backend's chosen TTL from §2.3, e.g. 55 minutes if the backend uses 60).
2. Before rendering the logo `<img>`, check `Date.now() > cached.expiresAt`. If expired, call `GET /api/companies/:companyId/logo-url` (§2.6c) to refresh, update `localStorage`, then render.
3. If the `<img>` itself fails to load (`onError`), also trigger a refresh — presigned URLs can be invalidated early in edge cases (bucket policy changes, clock skew, etc).

### 3.3 Update `src/services/auth.service.ts`

- Response type fields `company_logo?: string | null;` and `logo_base64?: string | null;` become `company_logo_url?: string | null;` and `logo_url?: string | null;` respectively, matching the renamed backend fields (§2.6a/b).
- Ensure `company_id` is present and surfaced in the typed response object — the frontend needs it later to call the logo-refresh endpoint (§3.5). It's already in the JWT payload (`payload.company_id`) per the backend; make sure the typed response interface here exposes it too, not just the raw JWT.

### 3.4 Update both login pages

**`src/app/(auth)/login/page.tsx`** (investor):
```tsx
// BEFORE
if (response.data?.investor?.logo_base64) {
  localStorage.setItem("company_logo_base64", response.data.investor.logo_base64);
}

// AFTER
if (response.data?.logo_url) {
  const cache = {
    url: response.data.logo_url,
    expiresAt: Date.now() + 55 * 60 * 1000,
    s3Key: response.data.logo_s3_key ?? null,
  };
  localStorage.setItem("company_logo_cache", JSON.stringify(cache));
}
```
Important: verify the actual response shape from `investor-auth.service.ts`'s `generateInvestorAuthResponse` after the §2.6b change — the field lives at `response.data.logo_url` (top-level, per that service's current `return { access_token, logo_base64, company_info }` shape, which is NOT nested under an `investor` key). The existing frontend code's `response.data?.investor?.logo_base64` reads a path that doesn't match the backend's actual response shape — flag and fix this pre-existing mismatch while making this change.

**`src/app/(auth)/distributor-portal/page.tsx`** (staff):
```tsx
// BEFORE
if (response.data?.user?.company_logo) {
  localStorage.setItem("company_logo_base64", response.data.user.company_logo);
}

// AFTER
if (response.data?.company_logo_url) {
  const cache = {
    url: response.data.company_logo_url,
    expiresAt: Date.now() + 55 * 60 * 1000,
    s3Key: null,
  };
  localStorage.setItem("company_logo_cache", JSON.stringify(cache));
}
```
Same verification note: `authentication.service.ts`'s `generateAuthResponse` returns `{ access_token, refresh_token, company_logo, company_info }` at the top level, not nested under `user` — confirm and fix the read path to match reality while renaming the field.

Also check `src/app/(auth)/admin-portal/page.tsx` for the same pattern and apply the equivalent change if it also stores a logo.

### 3.5 Create a shared logo hook

Create `src/hooks/useCompanyLogo.ts`:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";

const CACHE_KEY = "company_logo_cache";

interface LogoCache {
  url: string;
  expiresAt: number;
  s3Key: string | null;
}

export function useCompanyLogo(companyId?: string | null) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await apiClient.get<any>(`companies/${companyId}/logo-url`);
      const url = res.data?.logo_url ?? res.logo_url ?? null;
      if (url) {
        const cache: LogoCache = { url, expiresAt: Date.now() + 55 * 60 * 1000, s3Key: null };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        setLogoUrl(url);
      } else {
        localStorage.removeItem(CACHE_KEY);
        setLogoUrl(null);
      }
    } catch (err) {
      console.warn("Failed to refresh company logo URL:", err);
    }
  }, [companyId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: LogoCache = JSON.parse(raw);
        if (cache.url && Date.now() < cache.expiresAt) {
          setLogoUrl(cache.url);
          return;
        }
      }
      refresh();
    } catch (_) {
      refresh();
    }
  }, [refresh]);

  return { logoUrl, refreshLogo: refresh };
}
```

This requires knowing `companyId` client-side. Confirm where the sidebars currently get user/company context (a decoded JWT, an auth context, or a prop). If nothing suitable exists yet, stash a `company_id` string in `localStorage` at login time (§3.4) alongside the logo cache, so sidebars can read it independently without a broader auth-context refactor.

### 3.6 Update `Sidebar.tsx` and `InvestorSidebar.tsx`

Replace the "read raw base64 from localStorage and prefix with `data:image/png;base64,`" block with the new hook:

```tsx
// BEFORE
const [companyLogo, setCompanyLogo] = useState<string | null>(null);
useEffect(() => {
  try {
    let storedLogo = localStorage.getItem("company_logo_base64");
    if (storedLogo && storedLogo !== "null" && storedLogo !== "undefined" && storedLogo.length > 20) {
      if (!storedLogo.startsWith("data:image")) {
        storedLogo = `data:image/png;base64,${storedLogo}`;
      }
      setCompanyLogo(storedLogo);
    }
  } catch (err) { /* ... */ }
}, []);

// AFTER
const companyId = /* read from wherever §3.5 determined it lives */;
const { logoUrl, refreshLogo } = useCompanyLogo(companyId);
```

And in the JSX:
```tsx
{logoUrl ? (
  <img
    src={logoUrl}
    alt="Company Logo"
    onError={() => refreshLogo()}
    className={/* keep existing classes */}
  />
) : (
  /* keep existing "LOGO" placeholder fallback */
)}
```

### 3.7 Update `LogoutButton.tsx`

```tsx
// BEFORE
localStorage.removeItem("company_logo_base64");

// AFTER
localStorage.removeItem("company_logo_cache");
localStorage.removeItem("company_id"); // if added per §3.5
```

### 3.8 `apiClient.ts` forced-logout path

Its 401 → refresh-failure path already does a blanket `localStorage.clear()`, which automatically covers the new keys. No change needed — just confirm it still fires correctly.

### 3.9 Update PDF export call sites to use an S3 key instead of base64

`src/lib/capitalGainsExport.ts`, `src/lib/portfolioExport.ts`, and `src/lib/transactionReportExport.ts` all call `jsPDF`'s `doc.addImage()` **directly in the browser** (confirmed by the `doc.addImage(...)` calls present in these frontend files) — meaning PDF generation for at least some export flows happens client-side, separate from the four NestJS export services in §2.6e which serve a server-side path for similar reports. Both flows exist in this codebase; determine which UI button wires to which flow before editing each file, since they need different fixes:

- **Client-side `jsPDF` flows** (`capitalGainsExport.ts`, `portfolioExport.ts`, `transactionReportExport.ts`): the frontend must fetch the presigned URL and convert it to a transient base64 data URL right before calling `addImage`, e.g.:
  ```ts
  async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
    try {
      const blob = await fetch(url).then((r) => r.blob());
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
  ```
  Call this with the current `logoUrl` (from `useCompanyLogo`/localStorage cache) immediately before `doc.addImage(...)`, and never persist the resulting data URL anywhere beyond the local variable used for that export call.

- **Backend-generated flows** (`systematicReportExport.ts`, and anywhere sending a `distributor_info` payload to the four NestJS services in §2.6e): stop reading/prefixing base64 client-side entirely; just change the payload field name from `logoBase64` to `logoS3Key` and send the S3 key (from the logo cache's `s3Key`, or fetched via `GET /api/companies/:companyId/logo-url` if the key itself isn't cached client-side — in which case send `logoS3Key` obtained by having that endpoint also return the raw key alongside the URL).

- Remove the hardcoded dummy base64 `DISTRIBUTOR_INFO.logoBase64` placeholder blocks entirely — they were never real per-company data and become actively misleading now:
  - `src/lib/systematicReportExport.ts` (top-level `DISTRIBUTOR_INFO` constant)
  - `src/components/distributor/clients/ClientHoldingsView.tsx`
  - `src/app/investor/page.tsx` (large inline base64 block near line 45)

---

## 4. Migration Order (to avoid downtime)

1. Deploy backend changes with **both** `logo_base64` and `logo_s3_key` columns present. Make read paths prefer `logo_s3_key`, falling back to serving the old `logo_base64` field under its old name if `logo_s3_key` is null, so companies not yet backfilled don't break.
2. Run the backfill script (§2.5) against production.
3. Verify a sample of companies render their logo correctly from S3 in staging.
4. Deploy frontend changes (§3, all of it).
5. After a full stable release cycle, remove the `logo_base64` fallback from the backend, then drop the `logo_base64` column in a follow-up migration.

---

## 5. Testing Checklist

1. New company logo upload (§2.6c) stores the file in S3 under `company-logos/{company_id}/logo.{ext}`, and `company_details.logo_s3_key` is populated.
2. Staff login response contains a working `company_logo_url`, not a base64 string.
3. Investor login response contains a working `logo_url`, not `logo_base64`.
4. `localStorage` after login contains `company_logo_cache` (small JSON) and no key holds a multi-KB base64 string.
5. Sidebar renders the logo correctly on both portals.
6. Force-expire a presigned URL (e.g. temporarily set a 10-second TTL locally) and confirm the sidebar's expiry-check/`onError` refresh logic fetches a new URL without requiring re-login.
7. Generate each of the four report types (Capital Gains, Holdings, Systematic/SIP, Transactions) and confirm the logo still renders in the output PDF, for both client-side and backend-generated flows.
8. Logout clears `company_logo_cache` (and `company_id`, if added) from `localStorage`.
9. Deleting a company's logo (§2.6c DELETE) removes the S3 object, clears `logo_s3_key`, and the sidebar cleanly falls back to the "LOGO" placeholder.
10. Confirm no AWS credentials appear in any frontend production bundle and none are committed to git going forward.

---

## 6. Summary of Files to Touch

**Backend (`finiq-api`)**
- `package.json` — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- `.env` / `.env.example` — add AWS env vars.
- `src/modules/s3/s3.module.ts`, `src/modules/s3/s3.service.ts` — new.
- `src/entities/company-detail.entity.ts` — `logo_base64` → `logo_s3_key`.
- New migration (or manual `ALTER TABLE`, matching this repo's existing convention) — add `logo_s3_key`, later drop `logo_base64`.
- `scripts/backfill-logos-to-s3.ts` — new one-off script.
- `src/modules/auth/authentication.service.ts` — return `company_logo_url` via presigned URL.
- `src/modules/investor-auth/investor-auth.service.ts` + `dto/investor-auth.dto.ts` — return `logo_url` via presigned URL.
- `src/modules/companies/companies.controller.ts`, `companies.service.ts`, `companies.repository.ts` — new upload/delete/get-logo-url endpoints.
- `src/modules/capital-gains/capital-gains-export.service.ts`
- `src/modules/investors/investors-export.service.ts`
- `src/modules/investors/transactions-export.service.ts`
- `src/modules/sips/systematic-report-export.service.ts`
  — all four: fetch image bytes from S3 server-side instead of reading `distributorInfo.logoBase64` directly.
- Relevant `*.module.ts` files — import `S3Module` wherever `S3Service` is injected.

**Frontend (`finiq`)**
- `src/services/auth.service.ts` — rename response fields, ensure `company_id` is exposed.
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/distributor-portal/page.tsx`, `src/app/(auth)/admin-portal/page.tsx` — cache `{url, expiresAt, s3Key}` instead of raw base64; fix pre-existing response-shape mismatches while doing so.
- `src/hooks/useCompanyLogo.ts` — new shared hook.
- `src/components/distributor/Sidebar.tsx`, `src/components/investor/InvestorSidebar.tsx` — use the new hook, `<img src={logoUrl}>` with `onError` refresh.
- `src/components/investor/LogoutButton.tsx` — clear new cache key(s).
- `src/lib/capitalGainsExport.ts`, `src/lib/portfolioExport.ts`, `src/lib/systematicReportExport.ts`, `src/lib/transactionReportExport.ts` — determine client-side vs. backend PDF generation per file and update accordingly (§3.9).
- `src/app/investor/page.tsx`, `src/components/distributor/clients/ClientHoldingsView.tsx` — remove hardcoded dummy base64 `logoBase64` placeholders.