# Hierarchical Data Loading & Access Control — Full Implementation Guide

**Scope:** `finiq-backend` (NestJS/TypeORM) + `finiq-frontend` (Next.js), unified distributor/sub-broker/company-admin portal.
**Priority order:** Correctness of data isolation > everything else. A leak across hierarchy branches is a compliance incident (this is investor PAN/holdings/transaction data). Every rule below is written "fail closed."

This document is based on a direct read of your current codebase (both zips + the schema dump), not assumptions. Section 1 tells you exactly what already exists and what's broken today. Sections 2+ are the build plan.

---

## 0. Terminology mapping (your dummy JSON → real schema)

Your example:

```
d1 (distributor)
 ├─ investors i1, i2
 ├─ s1 (sub-broker) → i3, i4
 └─ s2 (sub-broker) → i5
      └─ s3 (sub-broker) → i6, i7
d2 (distributor)
 ├─ investor i8
 └─ s4 (sub-broker) → i9, i10
```

Maps onto your schema like this:

| Your term | Real table / concept |
|---|---|
| "distributor" | `sub_brokers` row with `parent_id IS NULL` (root of a tree), user_profile `role = BROKER` |
| "sub-broker" | `sub_brokers` row with `parent_id` set, user_profile `role = SUB_BROKER` |
| "company ARN" | `company_arns` row — **already auto-generates a root `sub_brokers` row today** (see §1.5) |
| "investor visible to X" | active row in `investor_mappings` where `sub_broker_id` ∈ {X, all descendants of X} |
| "company admin sees everything" | `user_profiles.role = COMPANY_ADMIN`, scoped only by `company_id`, unrestricted below that |

Important nuance already baked into your entities: **`sub_brokers` does not have a `type` column.** Distributor vs sub-broker is *not* a stored enum — it's derived from tree position (`parent_id IS NULL` = top of a branch) combined with the linked `user_profiles.role` (`BROKER` vs `SUB_BROKER`). This is a bit implicit but workable; §3.1 below tells you where to be careful with it and gives you the option to make it explicit.

---

## 1. Current-state audit

I read every module that touches investor data, plus auth, dashboard, holdings-cache, sips, broker-transactions, user-management, and companies. Here's the real state, not a guess.

### 1.1 What's already correct — copy this pattern everywhere else

`investor-mapping.module.ts` (service: `InvestorMappingService`) is the **one place in the codebase** that does hierarchy scoping correctly:

- `resolveAccess(userPayload)` — reads the caller's JWT roles, and for `BROKER`/`SUB_BROKER` returns `[self_sub_broker_id, ...descendants]` computed via BFS over `parent_id`; for `COMPANY_ADMIN` returns `null` (unrestricted within the company); anything else throws.
- `getDescendantSubBrokerIds(rootId)` — BFS over the full `sub_brokers` table for the company.
- `assertSubBrokerAllowed(access, subBrokerId)` — fail-closed check before any write.
- Every read (`getInvestors`, `getHistory`) filters with `IN (:...allowed)` and always keeps a `company_id` filter as the tenant boundary underneath the hierarchy boundary.

This is the correct design. Section 3 turns this private logic into a shared, reusable service instead of a one-off.

### 1.2 The confirmed bug: `checkBrokerAccess`

`investors.service.ts`:

```ts
async checkBrokerAccess(brokerProfileId: string, investorId: string): Promise<boolean> {
  const mapping = await this.investorMappingRepo.findOne({
    where: { sub_broker_id: brokerProfileId, investor_id: investorId, is_active: true },
  });
  return !!mapping;
}
```

Called from `investors.controller.ts` (lines ~166, 297, 435, 504, 591 — holdings, PDF exports, transaction reports, capital gains) as:

```ts
this.investorService.checkBrokerAccess(profile.id, targetInvestorId)
```

Two independent bugs, both real:

1. **Wrong ID space.** `profile.id` is `user_profiles.id`. `investor_mappings.sub_broker_id` is a foreign key to `sub_brokers.id`. These UUID spaces never coincide for a real user — this check is silently almost-always `false` today, not "insecure," but **broken/non-functional**.
2. **No downline logic.** Even with the ID fixed, it only checks a *direct* mapping to the caller's own `sub_broker_id`. Per your spec, `d1` must see `i6`/`i7` (mapped to `s3`, three levels down) — this function would deny that forever.

**Net effect today:** every BROKER/SUB_BROKER-gated holdings/transactions/capital-gains/PDF-export endpoint in `investors.controller.ts` is effectively broken for real hierarchies. This is fixed in §4.1 by deleting `checkBrokerAccess` entirely and replacing it with the shared service.

### 1.3 Endpoints with **zero** scoping today (bigger gap than the bug above)

- **`GET /api/investors` (`findAll`)** — `investors.controller.ts` → `InvestorService.findAll(page, limit)`. No `@UseGuards`, no company filter, no hierarchy filter, no caller context read at all. This is a plain, unscoped, cross-tenant list of every investor in the database. This is the most urgent fix in the whole audit — worse than the bug above, because it's not broken-closed, it's **open**.
- **`GET /api/investors/:id` (`findById`)**, **`GET /api/investors/by-pan/:pan`** — same story: no ownership/company/hierarchy check before returning full investor PII.
- **`user-management.service.getAllUsers()`** — filters by `company_id` only. If this is reachable by a `BROKER`/`SUB_BROKER` role (check the controller route guard for whichever endpoint calls it — `@Roles(COMPANY_ADMIN, BROKER, SUB_BROKER)` is present on at least one `GET` route in that controller), a sub-broker can currently list **every** broker/sub-broker in the company, including siblings and their parents' other branches — an organizational-structure leak even before you get to investor data.
- **`holdings-cache`, `sips`, `broker-transactions` modules** — every endpoint I found is gated `@Roles(COMPANY_ADMIN, FINIQ_ADMIN, TENANT_ADMIN)` only, or resolves `companyId` from the JWT with no `BROKER`/`SUB_BROKER` branch at all. Meaning: **today these modules are simply inaccessible to distributors/sub-brokers** (403 from `RoleGuard`), not insecure — but they will need a hierarchy-scoped branch added the moment you want brokers/sub-brokers to see dashboards/AUM/SIP data for their own downline, which your ask implies you do want.
- **`dashboard.controller.ts` `broker/*` endpoints** — these *do* branch on `BROKER`/`SUB_BROKER` role and resolve `companyId`, but the underlying `dashboard.service.ts`/`dashboard.repository.ts` queries filter by `company_id` only (`getInvestorCount`, `getCompanyAUM`, `getAumTrend`, etc. all take `companyId` alone). So today, a logged-in `SUB_BROKER` hitting `broker/summary` gets **company-wide** numbers, not their downline's numbers. This directly contradicts your spec (`s4` should never see `d1`'s AUM).

### 1.4 Write-side gap: creation/editing of the hierarchy is admin-only, not self-service

`user-management.controller.ts`:

```ts
@Post()
@Roles(UserRole.COMPANY_ADMIN)
async createUser(...)   // creates sub-brokers AND investors

@Put(...)
@Roles(UserRole.COMPANY_ADMIN)
async updateBroker(...)  // including moving a broker to a new parent_id
```

Every hierarchy-mutating endpoint is `COMPANY_ADMIN`-only right now. That's *safe* (nothing broken), but it means today a distributor cannot add their own sub-brokers or investors — everything goes through the company admin. Your spec says company admins can place anyone anywhere, **and** distributors/sub-brokers should be able to manage their own downline. §4.4 adds `BROKER`/`SUB_BROKER`-scoped versions of these endpoints, re-using the exact same shared access-resolution service so the write-side and read-side can never drift apart again (which is precisely how the current `checkBrokerAccess` bug happened — two independent, inconsistent implementations of "what can this user touch").

### 1.5 Company ARN → distributor account: already 80% built, missing the login half

This is the part of your ask I want to flag clearly because it changes the shape of the work: **your "company ARN creates a distributor" idea is already partially implemented**, in `companies.service.ts`:

```ts
// inside createCompany():
for (const arn of savedCompany.arns) {
  const subBroker = new SubBroker();
  subBroker.name = savedCompany.name;
  subBroker.arn_id = arn.arnNo ?? '';
  subBroker.company_id = savedCompany.id;
  await queryRunner.manager.save(SubBroker, subBroker);   // <-- root sub_broker created, parent_id null
}

// inside createArn() (POST /api/companies/arn):
const subBroker = new SubBroker();
subBroker.name = company.name;
subBroker.arn_id = savedArn.arnNo ?? '';
subBroker.company_id = company.id;
await manager.save(SubBroker, subBroker);   // <-- same thing, one ARN at a time
```

So: creating a company ARN **already creates a root-level `sub_brokers` row** (a "distributor" in your terms — `parent_id` is null). What's missing, and what you actually need for "these ARNs are the distributors, and they can log in":

- **No `User` / `UserProfile` is created for this auto-generated `SubBroker`.** Compare this to `user-management.service.createSubBroker()`, which — when a company admin manually adds a sub-broker — *does* create the `User` + `UserProfile(role = BROKER or SUB_BROKER)` + links `SubBroker.user_id`. The ARN-driven auto-creation skips this step entirely. Result: today, an ARN-derived "distributor" `sub_brokers` row exists in the DB but **has no login** — `SubBroker.user_id` is `null`, `SubBroker.email`/name are just copied from the company, and there's no phone number captured anywhere in `CreateCompanyArnDto` to send an OTP to.
- **`SubBroker.name` is hardcoded to `company.name`**, not a distributor-specific name — every ARN under one company would currently show up with an identical, non-distinguishing name.
- `CreateCompanyArnDto` has no `distributor_name` / `phone_number` field to capture the credentials this person needs.

§4.5 closes this gap: extends `createArn` (and the equivalent branch in `createCompany`) to also provision the login, exactly the way `createSubBroker` already does, so "create a company ARN" and "provision its distributor's login" become one atomic transaction.

### 1.6 Auth/JWT — already has what you need

`authentication.service.ts` already attaches `sub_broker_id` onto the `BROKER`/`SUB_BROKER` role object in the JWT payload (`generateAuthResponse` and `getMe`, via `findSubBrokerByUserId`). This is exactly the piece `resolveAccess()` in the investor-mapping service depends on. **No JWT/token shape changes are needed** — the shared service in §3 consumes the same `userPayload.roles[].sub_broker_id` / `.company_id` that already exists.

---

### 1.7 Verified against the latest schema dump (this section supersedes assumptions in §1.1–§1.6 wherever they conflict)

You sent an updated `pg_dump` (custom format) of the live database. I parsed it directly (table/column/enum definitions, not guessed) and cross-checked it against the code from the same upload set. Three things change as a result, one thing gets **confirmed and resolved**:

1. **`client_mappings` is real, but confirmed dead code — not a hidden third access-control path.** The original chat transcript you shared flagged `client_mappings` as "unexplored" and worth checking as a possible fallback for the broken `checkBrokerAccess`. I checked: the table exists (`client_id uuid`, `sub_broker_id uuid`, unique on `client_id` — i.e. a client/investor can map to exactly **one** sub-broker via this table, unlike `investor_mappings` which supports history via `is_active`), and `ClientMapping` is `@InjectRepository`'d into `BrokerageDistributionService` — but **never actually queried anywhere in that file**. It's dead code: injected, unused. This closes the open question from the prior chat definitively — `checkBrokerAccess` was not silently falling back to `client_mappings`, it was simply broken with no fallback at all, exactly as diagnosed. **Action: do not build anything new on `client_mappings`.** Either leave it untouched (safe, inert) or, if you want to reduce surface area, remove the unused injection from `BrokerageDistributionService` and formally deprecate the table in a later cleanup pass — not urgent, not part of this build.

2. **`tenants` already has `subscription_plan` and `company_limit` columns in the live DB**, confirming the `TENANT_ADMIN`-owns-multiple-companies model from §3.1 is not speculative — the schema was already built for it (`company_limit` caps how many `companies` rows a tenant may create). No entity change needed here — `tenant.entity.ts` already matches this schema. This strengthens (doesn't change) §4.6's `TENANT_ADMIN` scoping design.

3. **New finding, requires an entity fix: `user_role_enum` in the live DB now includes `'INVESTOR'`, but `UserProfile`'s `UserRole` TypeScript enum does not.**
   ```sql
   CREATE TYPE public.user_role_enum AS ENUM (
       'FINIQ_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'INVESTOR',
       'COMPANY_USER', 'BROKER', 'SUB_BROKER'
   );
   ```
   vs. `user-profile.entity.ts` today:
   ```ts
   export enum UserRole {
     FINIQ_ADMIN = 'FINIQ_ADMIN', TENANT_ADMIN = 'TENANT_ADMIN', COMPANY_ADMIN = 'COMPANY_ADMIN',
     COMPANY_USER = 'COMPANY_USER', BROKER = 'BROKER', SUB_BROKER = 'SUB_BROKER',
     // 'INVESTOR' is missing
   }
   ```
   This is a genuine drift between the live database and the code — the DB migration that added `INVESTOR` to the Postgres enum shipped without the matching TypeORM entity update. Left as-is, TypeORM will throw (or silently misbehave, depending on `synchronize` settings) the moment any code path tries to read/write a `user_profiles` row with `role = 'INVESTOR'`. **Fix required in §2.4 below, and a fail-closed rule added to `HierarchyAccessService` in §3.4 so this new role can never accidentally fall through to broker/company-admin-level access before its actual scope is deliberately designed.**

4. **Minor, unrelated to hierarchy but worth a note while in this file:** `company_arns.arn_no` is `NOT NULL` in the live schema; `CompanyArn.arnNo` in the entity is declared `nullable: true`. Since §4.5/§4.6 both touch ARN creation directly, tighten the DTO/entity validation to require `arn_no` before those endpoints ship, so you're not relying on the DB constraint alone to reject a bad request (that currently surfaces as an ugly 500, not a clean 400).

5. **Confirming, not new:** `commission_mappings` (`broker_id`, `sub_broker_id`, `share_percentage`) and the new `brokerage_ledger.level_in_hierarchy` column both reference the same `sub_brokers` hierarchy this whole document is built around — no conflicting model, no changes needed to §3's design.

## 2. Data model changes



Only two schema changes are actually necessary. Everything else is application-layer.

### 2.1 (Recommended, not strictly required) Make distributor-vs-sub-broker explicit

Right now "is this a distributor" is inferred as `parent_id IS NULL`. That's *usually* fine, but breaks the moment a `COMPANY_ADMIN` reparents a sub-broker to null intentionally, or a distributor is deleted and reassigned. Add:

```ts
// sub-broker.entity.ts
export enum SubBrokerType {
  DISTRIBUTOR = 'DISTRIBUTOR',
  SUB_BROKER = 'SUB_BROKER',
}

@Column({ type: 'enum', enum: SubBrokerType, default: SubBrokerType.SUB_BROKER })
type: SubBrokerType;
```

Migration: backfill `type = 'DISTRIBUTOR'` where `parent_id IS NULL`, else `'SUB_BROKER'`. Enforce at the application layer (not DB constraint, TypeORM doesn't make this easy) that a `DISTRIBUTOR` row can never have `parent_id` set, and a `SUB_BROKER` row must always have `parent_id` set to something. This is a nice-to-have; the access-control logic in §3 does **not** depend on it (it works purely off `parent_id` graph traversal), so you can ship the security-critical parts of this doc without it and add this later.

### 2.2 (Required) Index `sub_brokers.parent_id`

Every hierarchy resolution does a BFS that currently loads **the entire `sub_brokers` table** into memory per request (`this.subBrokerRepo.find({ select: ['id', 'parent_id'] })` with no `company_id` filter, even). This works fine at small scale, will not work once a company has thousands of sub-brokers. Two changes, both required before this pattern is copied into every module in §4:

1. Add an index: `CREATE INDEX idx_sub_brokers_parent_id ON sub_brokers(parent_id);` and `CREATE INDEX idx_sub_brokers_company_id ON sub_brokers(company_id);` (verify the latter doesn't already exist — check the schema dump).
2. Scope the BFS load to `company_id` (it currently isn't — this is itself a minor cross-tenant inefficiency/risk, fix it in the same pass as §3).
3. **Use the existing `path` column.** `SubBroker.path` ("id1/id2/id3" enumeration) already exists on the entity but nothing populates or reads it. Once populated on every write, descendant lookups become a single indexed query:
   ```sql
   SELECT id FROM sub_brokers WHERE company_id = $1 AND path LIKE $2 || '%'
   ```
   instead of an in-memory BFS. This is the single biggest performance/scalability fix available to you and it's already half-built (the column exists, just unused). §3.3 covers populating and maintaining it.

### 2.3 (Required) `CreateCompanyArnDto` — add distributor credential fields

```ts
// create-company-arn.dto.ts — add:
distributor_name?: string;   // shown in UI instead of company.name
phone_number?: string;       // required if you want this ARN's distributor to log in immediately
email?: string;              // already exists on the DTO for company-comms use, reuse or add a separate one if distinct
```

### 2.4 (Required, and urgent — a live drift, not a proposal) Add `INVESTOR` to the `UserRole` TypeScript enum

The live database's `user_role_enum` already contains `'INVESTOR'` (§1.7 point 3); the TypeORM entity doesn't. Fix:

```ts
// user-profile.entity.ts
export enum UserRole {
    FINIQ_ADMIN = 'FINIQ_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    COMPANY_ADMIN = 'COMPANY_ADMIN',
    INVESTOR = 'INVESTOR',        // add — matches live DB enum, was missing
    COMPANY_USER = 'COMPANY_USER',
    BROKER = 'BROKER',
    SUB_BROKER = 'SUB_BROKER',
}
```

This is purely a type-safety/consistency fix — it does **not** by itself change how investors authenticate. Today, and after this fix, investors still log in through the entirely separate `investor-auth` module (JWT payload carries `investor_id` directly, no `roles` array — confirmed in `jwt.strategy.ts`), completely outside the `user_profiles`/`roles` system this document's access control is built on. If a `user_profiles` row with `role = 'INVESTOR'` is now being created somewhere (worth grepping for `UserRole.INVESTOR` / `'INVESTOR'` across the codebase once the enum is fixed, to find out what's producing it — nothing in the code I read creates one today, so this may be schema-first groundwork for a future unified-login change, or an admin-panel-project addition), treat it as **out of scope for hierarchy access** until deliberately designed — see §3.4.

---

## 3. The shared hierarchy access service (build this first — everything else depends on it)

Create `backend/src/common/services/hierarchy-access.service.ts`. This **replaces** the private `resolveAccess`/`getDescendantSubBrokerIds`/`assertSubBrokerAllowed` trio currently living inside `InvestorMappingService`, and becomes the single source of truth used by every module in §4. This directly targets the root cause you already diagnosed in the prior chat — two independent, inconsistent implementations of the same concept — by making sure there is only ever **one**.

```ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubBroker } from 'src/entities/sub-broker.entity';
import { UserRole } from 'src/entities/user-profile.entity';

export interface HierarchyAccessContext {
  /** Present only when the caller is scoped to a single company
   *  (COMPANY_ADMIN, BROKER, SUB_BROKER). null for FINIQ_ADMIN/TENANT_ADMIN,
   *  who must use allowedCompanyIds instead — see below. */
  companyId: string | null;
  /** Tenant/company axis. null = every company on the platform (FINIQ_ADMIN).
   *  string[] = the exact set of company_ids this caller may touch
   *  (TENANT_ADMIN: every company under their tenant_id).
   *  For COMPANY_ADMIN/BROKER/SUB_BROKER this is always exactly [companyId] —
   *  kept as an array too so every caller can use ONE code path
   *  ("is this company_id in access.allowedCompanyIds ?? [access.companyId]"). */
  allowedCompanyIds: string[] | null;
  tenantId: string | null;     // set for TENANT_ADMIN; informational elsewhere
  performedById: string;       // user_profiles.id of the caller — for audit trails
  callerRole: UserRole;
  callerSubBrokerId: string | null;   // null unless BROKER/SUB_BROKER
  /** Hierarchy axis. null = unrestricted within whichever company is in scope
   *  (COMPANY_ADMIN and above). Otherwise: exact set of sub_broker_ids the
   *  caller may act on/see — always includes their own id plus every descendant. */
  allowedSubBrokerIds: string[] | null;
}

@Injectable()
export class HierarchyAccessService {
  constructor(
    @InjectRepository(SubBroker)
    private readonly subBrokerRepo: Repository<SubBroker>,
  ) {}

  /** The one and only place in the codebase allowed to answer
   *  "what is this caller allowed to see/touch". Every module must call this
   *  instead of writing its own version. Fails closed on anything unrecognized. */
  async resolveAccess(userPayload: any): Promise<HierarchyAccessContext> {
    const roles: any[] = userPayload?.roles || [];

    // Platform-level: FINIQ_ADMIN. Every company, every tenant. Used for
    // client onboarding (creating companies/ARNs) — see §4.6.
    const finiqAdmin = roles.find((r) => r.role === UserRole.FINIQ_ADMIN);
    if (finiqAdmin) {
      return {
        companyId: null,
        allowedCompanyIds: null,       // null = unrestricted, ALL companies
        tenantId: null,
        performedById: finiqAdmin.id,
        callerRole: UserRole.FINIQ_ADMIN,
        callerSubBrokerId: null,
        allowedSubBrokerIds: null,
      };
    }

    // Tenant-level: TENANT_ADMIN. All companies under their own tenant_id —
    // a client who owns multiple company entities.
    const tenantAdmin = roles.find((r) => r.role === UserRole.TENANT_ADMIN);
    if (tenantAdmin) {
      if (!tenantAdmin.tenant_id) throw new BadRequestException('Invalid Tenant Admin context');
      const companies = await this.subBrokerRepo.manager
        .getRepository('Company')
        .find({ where: { tenant_id: tenantAdmin.tenant_id }, select: ['id'] });
      return {
        companyId: null,
        allowedCompanyIds: companies.map((c: any) => c.id),
        tenantId: tenantAdmin.tenant_id,
        performedById: tenantAdmin.id,
        callerRole: UserRole.TENANT_ADMIN,
        callerSubBrokerId: null,
        allowedSubBrokerIds: null,
      };
    }

    // Company-level: COMPANY_ADMIN. Unrestricted within exactly one company.
    const companyAdmin = roles.find((r) => r.role === UserRole.COMPANY_ADMIN);
    if (companyAdmin) {
      if (!companyAdmin.company_id) throw new BadRequestException('Invalid Company Admin context');
      return {
        companyId: companyAdmin.company_id,
        allowedCompanyIds: [companyAdmin.company_id],
        tenantId: companyAdmin.tenant_id ?? null,
        performedById: companyAdmin.id,
        callerRole: UserRole.COMPANY_ADMIN,
        callerSubBrokerId: null,
        allowedSubBrokerIds: null,
      };
    }

    const brokerRole = roles.find(
      (r) => r.role === UserRole.BROKER || r.role === UserRole.SUB_BROKER,
    );
    if (brokerRole) {
      if (!brokerRole.company_id) throw new BadRequestException('Invalid broker context');
      if (!brokerRole.sub_broker_id) {
        // JWT predates the sub_broker_id claim, or the account has no linked
        // SubBroker row. Fail closed — force re-login rather than silently
        // granting/denying everything.
        throw new ForbiddenException(
          'Your account is not linked to a broker record. Please log out and log back in; ' +
          'if the issue persists, contact your administrator.',
        );
      }
      const descendantIds = await this.getDescendantSubBrokerIds(
        brokerRole.company_id,
        brokerRole.sub_broker_id,
      );
      return {
        companyId: brokerRole.company_id,
        allowedCompanyIds: [brokerRole.company_id],
        tenantId: brokerRole.tenant_id ?? null,
        performedById: brokerRole.id,
        callerRole: brokerRole.role,
        callerSubBrokerId: brokerRole.sub_broker_id,
        allowedSubBrokerIds: [brokerRole.sub_broker_id, ...descendantIds],
      };
    }

    throw new ForbiddenException('You do not have permission to access this resource.');
  }

  /** Checks the tenant/company axis only — call this before touching a
   *  specific company's data whenever the caller might be FINIQ_ADMIN or
   *  TENANT_ADMIN (i.e. any endpoint reachable by more than one company). */
  assertCompanyAllowed(access: HierarchyAccessContext, companyId: string) {
    if (access.allowedCompanyIds === null) return; // FINIQ_ADMIN, unrestricted
    if (!access.allowedCompanyIds.includes(companyId)) {
      throw new ForbiddenException('You do not have permission for this company.');
    }
  }

  /** Descendant lookup, scoped to company_id (never loads cross-tenant rows).
   *  Swap the body for a single `path LIKE` query once §3.3 ships. */
  async getDescendantSubBrokerIds(companyId: string, rootId: string): Promise<string[]> {
    const all = await this.subBrokerRepo.find({
      where: { company_id: companyId },
      select: ['id', 'parent_id'],
    });
    const ids: string[] = [];
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      for (const child of all.filter((b) => b.parent_id === current)) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  }

  /** Throws if the target sub_broker is outside the caller's allowed set. */
  assertSubBrokerAllowed(access: HierarchyAccessContext, subBrokerId: string) {
    if (access.allowedSubBrokerIds === null) return; // COMPANY_ADMIN, unrestricted
    if (!access.allowedSubBrokerIds.includes(subBrokerId)) {
      throw new ForbiddenException('You do not have permission for this broker/sub-broker.');
    }
  }

  /** Given an investor_id, checks whether the caller's allowed sub-broker set
   *  contains that investor's ACTIVE mapping. Use for single-investor endpoints
   *  (holdings, transactions, capital-gains, exports) — this is the direct,
   *  correct replacement for the broken `checkBrokerAccess`. */
  async assertInvestorAccess(
    access: HierarchyAccessContext,
    investorId: string,
    investorMappingRepo: Repository<any>,
  ): Promise<void> {
    // Tenant boundary first, always — regardless of role.
    // (Caller code must also verify investor.company_id === access.companyId.)
    if (access.allowedSubBrokerIds === null) return; // COMPANY_ADMIN
    const mapping = await investorMappingRepo.findOne({
      where: {
        investor_id: investorId,
        sub_broker_id: In(access.allowedSubBrokerIds),
        is_active: true,
      },
    });
    if (!mapping) {
      throw new ForbiddenException('You do not have access to this investor.');
    }
  }

  /** Convenience for building a TypeORM `where` fragment / QueryBuilder param
   *  set for list endpoints. Returns null when unrestricted. */
  scopeParam(access: HierarchyAccessContext): string[] | null {
    return access.allowedSubBrokerIds;
  }
}
```

Register it in a shared module (e.g. `common/common.module.ts`, `exports: [HierarchyAccessService]`) and import that module everywhere §4 needs it, rather than re-declaring the provider per-module.

### 3.1 Resolved: `FINIQ_ADMIN` and `TENANT_ADMIN` are a different axis, not company-scoped like `COMPANY_ADMIN`

Confirmed scope of each role:

- **`FINIQ_ADMIN`** — the SaaS owner, used for **client onboarding**: creating companies, their details, and their ARN profiles in the first place. Must see and act across **every tenant and every company** in the system — platform-level, above the tenant boundary entirely.
- **`TENANT_ADMIN`** — a client who owns **more than one company** (e.g. a group with several branded/legal entities, each a row in `companies`, all sharing one `tenant_id`). Scoped to **all companies under their `tenant_id`**, not just one `company_id` — wider than `COMPANY_ADMIN`, narrower than `FINIQ_ADMIN`.
- **`COMPANY_ADMIN`** — unchanged: unrestricted *within one `company_id`*, exactly as built today.

This means access control is genuinely **two independent axes**, not one:

1. **Tenant/company axis** — which company(ies) can this caller touch at all. `FINIQ_ADMIN` = all; `TENANT_ADMIN` = all companies where `company.tenant_id === caller.tenant_id`; `COMPANY_ADMIN`/`BROKER`/`SUB_BROKER` = exactly one `company_id`.
2. **Hierarchy axis** — within an allowed company, which sub-broker subtree can this caller touch. `FINIQ_ADMIN`/`TENANT_ADMIN`/`COMPANY_ADMIN` = unrestricted within whatever companies axis 1 allows; `BROKER`/`SUB_BROKER` = self + descendants only.

Keeping these as two separate fields (rather than collapsing "cross-tenant" into `allowedSubBrokerIds: null` the same way `COMPANY_ADMIN` currently is) matters: a bug in the hierarchy check must never be able to silently widen the tenant/company check, and vice versa. §3.2 (below) defines the shape; §4.6 is a new section covering the `FINIQ_ADMIN` onboarding flows this unlocks.

### 3.2 Why `assertInvestorAccess` re-checks tenant boundary is your responsibility, not the service's

Every caller must **independently** verify `investor.company_id === access.companyId` before calling `assertInvestorAccess` (or fold it into the query). The service only checks the hierarchy axis; it doesn't have the investor row. This split is intentional: it's what stops a compromised/malformed hierarchy check from ever becoming a cross-tenant leak, because the tenant filter always sits in the base query, never behind a conditional.

### 3.3 `path` column maintenance (do this once §2.2 lands)

Whenever a `sub_brokers` row is created or its `parent_id` changes (`createSubBroker`, `updateBroker`, and the new ARN-driven creation in §4.5), recompute `path` as `parent.path + '/' + self.id` (or `self.id` if root), and — critically — **cascade-recompute `path` for every existing descendant** when a broker is reparented (an `UPDATE ... WHERE path LIKE 'oldprefix%'` in the same transaction). Add this as a private helper `recomputeSubtreePaths(subBrokerId)` in `UserManagementService`, called from `updateBroker` whenever `parent_id` changes. Until this lands, `HierarchyAccessService` uses BFS (correct, just not maximally fast) — do not skip the BFS fallback while migrating.

### 3.4 `INVESTOR` role — explicitly fail closed, do not guess its scope

Now that `UserRole.INVESTOR` exists in the enum (§2.4), `resolveAccess()` must handle it explicitly rather than letting it fall through to the generic `ForbiddenException` at the bottom by accident-of-omission. Add it as its own, deliberately-restrictive branch, ahead of the generic catch-all:

```ts
const investorRole = roles.find((r) => r.role === UserRole.INVESTOR);
if (investorRole) {
  // A user_profiles row with role=INVESTOR is not the same thing as the
  // existing investor-auth flow (which uses payload.investor_id directly and
  // never reaches HierarchyAccessService at all). Until someone deliberately
  // designs what a role=INVESTOR user_profile is FOR — e.g. an investor
  // logging into the unified staff portal to see only their own data via the
  // same login system as brokers — it must not silently inherit BROKER-like
  // or COMPANY_ADMIN-like access. Fail closed.
  throw new ForbiddenException(
    'Investor accounts do not use this access path. Please use the investor login.',
  );
}
```

This is a one-line insurance policy: it guarantees that whatever eventually creates `role: 'INVESTOR'` `user_profiles` rows (§2.4 — currently nothing in the code I read does, so this may be forthcoming from the admin-panel project) cannot accidentally fall into `BROKER`/`SUB_BROKER` matching logic later in the function and inherit downline visibility it was never meant to have. If/when you do design a real purpose for this role, replace the throw with a deliberate, narrow scope (most likely: `allowedSubBrokerIds` = nothing, direct `investor_id` self-match only) rather than reusing the broker hierarchy logic as-is.

---

## 4. Backend module-by-module remediation

Apply in this order — each phase is safe to ship independently and none breaks anything that isn't already broken.

### 4.1 `investors.module.ts` — fix the confirmed bug + the confirmed open gap

- **Delete** `InvestorService.checkBrokerAccess` entirely.
- **`findAll`** (`GET /api/investors`): add `@UseGuards(JwtAuthGuard)`, inject `HierarchyAccessService`, resolve access, filter by `company_id` always and by `IN (:...allowedSubBrokerIds)` via a join to `investor_mappings` when not `COMPANY_ADMIN` — same pattern as `InvestorMappingService.getInvestors`, which you can copy near-verbatim (it already handles the "mapped-in-my-downline OR fully unmapped" nuance if you want new/unassigned investors visible to admins doing allotment, but for a plain "my clients" list you likely want **mapped-only**, not the unmapped branch — that branch exists in investor-mapping specifically for the allotment UI, don't blindly copy it into the general investor list).
- **`findById`, `findByPan`**: after loading the investor, call `assertInvestorAccess` (§3.2) before returning. 404 (not 403) for `COMPANY_ADMIN`-scope misses (wrong company) to avoid confirming existence across tenants; 403 for hierarchy-scope misses within the same company is fine (existence within your own company isn't sensitive the same way).
- **`getHoldings`, `exportHoldings`, `getTransactionReport`, `exportTransactions`, `getCapitalGains`**: replace every `checkBrokerAccess(profile.id, id)` call with:
  ```ts
  const access = await this.hierarchyAccess.resolveAccess(userSnapshot);
  const investor = await this.investorRepo.findOne({ where: { id: targetInvestorId } });
  if (!investor || investor.company_id !== access.companyId) throw new NotFoundException();
  await this.hierarchyAccess.assertInvestorAccess(access, targetInvestorId, this.investorMappingRepo);
  ```
  Do this once, as a private controller helper (`assertInvestorReadAccess`), not five times inline — the current five-times-inline duplication is exactly how the bug shipped and drifted.

### 4.2 `dashboard.module.ts` — the `broker/*` endpoints need a real hierarchy branch

`dashboard.repository.ts` methods (`getInvestorCount`, `getCompanyAUM`, `getAumTrend`, `getPortfolioDistribution`, and whatever backs `getBrokerSummary`/`getBrokerClientStats`/`getBrokerPerformance`) all currently accept `companyId` alone. Add an optional `subBrokerIds: string[] | null` parameter to each, and thread it through as an additional `AND investor_mapping.sub_broker_id IN (...)` (via a join to `investor_mappings`) whenever `subBrokerIds !== null`. In `dashboard.controller.ts`, `getBrokerContext` should call `HierarchyAccessService.resolveAccess` and pass `access.allowedSubBrokerIds` down instead of just `companyId`. This is the fix that makes `s4`'s dashboard show only `i9`/`i10`'s numbers instead of the whole company's.

### 4.3 `holdings-cache`, `sips`, `broker-transactions` — decide whether brokers need these at all, then scope if so

These are currently admin-only (`@Roles(COMPANY_ADMIN, FINIQ_ADMIN, TENANT_ADMIN)`), so there is no live vulnerability — but if the unified portal is meant to let a distributor see "their" SIP book, top contributors, brokerage/transactions, you'll need to add `BROKER`/`SUB_BROKER` to the `@Roles(...)` list on the relevant endpoints **and** add the same `allowedSubBrokerIds` join described in §4.2 to each underlying query before doing so. Do not add the roles to `@Roles(...)` without also adding the scoping — that reopens exactly the gap described in §1.3, just for new endpoints instead of old ones.

### 4.4 `user-management.module.ts` — self-service hierarchy management for BROKER/SUB_BROKER

Add parallel, hierarchy-scoped versions rather than loosening the existing admin-only endpoints:

- **`getAllUsers` / whatever backs the sub-broker list UI**: branch on caller role. `COMPANY_ADMIN` → current behavior (company-wide). `BROKER`/`SUB_BROKER` → resolve access, filter `subBrokerRepo.find({ where: { company_id, id: In(access.allowedSubBrokerIds) } })`. This closes the org-structure leak noted in §1.3.
- **`createUser` (creating a sub-broker or investor)**: allow `BROKER`/`SUB_BROKER` callers, but:
  - `dto.parent_id` must be validated with `assertSubBrokerAllowed(access, dto.parent_id)` — a sub-broker may only attach new children **under themselves or an existing descendant**, never under a sibling, never as a new root.
  - `dto.company_id` must be forced to `access.companyId` server-side (never trust a client-supplied `company_id` here — currently `createUser` in the controller already does this correctly for the admin path, extend the same forcing to the broker path).
  - New investors created by a `BROKER`/`SUB_BROKER` should be auto-mapped (`investor_mappings` row created, `sub_broker_id = dto.parent_id ?? callerSubBrokerId`) in the same transaction — otherwise a sub-broker could create an investor they then can't see, which is confusing but not insecure; still worth doing right.
- **`updateBroker` (including reparenting)**: `assertSubBrokerAllowed(access, id)` on the target being edited, **and** if `dto.parent_id` is being changed, `assertSubBrokerAllowed(access, dto.parent_id)` on the *new* parent too — a sub-broker must not be able to move one of their own descendants out from under themselves to become a child of an unrelated branch (or a root) that they don't also control. This is the same "two-sided" check pattern you'll want everywhere reparenting happens.
- Never allow a `BROKER`/`SUB_BROKER` caller to delete/deactivate their own record or an ancestor's — restrict delete endpoints to `COMPANY_ADMIN` only, permanently. Self-service should be additive/downward only.

### 4.5 `companies.module.ts` — close the ARN→distributor login gap (§1.5)

In both `createCompany` (initial ARNs) and `createArn` (adding one later), after `manager.save(SubBroker, subBroker)`:

```ts
// Only provision a login if credentials were actually supplied — an ARN can
// legitimately exist purely for data-feed purposes with no distributor login yet.
if (dto.phone_number) {
  let user = await manager.findOne(User, { where: { phone_number: dto.phone_number } });
  if (!user) {
    user = manager.create(User, {
      phone_number: dto.phone_number,
      email: dto.email ?? null,
      status: UserStatus.PENDING,
      is_verified: false,
      company_id: savedCompany.id, // or company.id in createArn
    });
    user = await manager.save(User, user);
  }
  const userProfile = manager.create(UserProfile, {
    user_id: user.id,
    role: UserRole.BROKER,           // root of a branch = distributor = BROKER role
    company_id: savedCompany.id,
    tenant_id: tenantId,
    first_name: dto.distributor_name ?? company.name,
    email: dto.email ?? null,
    is_active: true,
  });
  await manager.save(UserProfile, userProfile);
  subBroker.user_id = user.id;
  subBroker.name = dto.distributor_name ?? company.name;   // stop hardcoding company.name
  await manager.save(SubBroker, subBroker);
}
```

Same pattern `createSubBroker` in `user-management.service.ts` already uses — you're literally reusing an existing, working code path, just triggering it from the ARN flow too. Extend `CreateCompanyArnDto` and the equivalent inline `arns[]` DTO on `CreateCompanyDto` with `distributor_name`, `phone_number`, and reuse the existing `email` field. **This entire step is optional at ARN-creation time** — a company admin should be able to create an ARN today and provision the distributor's login later via the existing `createUser`/sub-broker-edit flow; don't force phone-number collection into the ARN form if that's not how the separate admin-panel project wants to sequence it. Just make sure the *capability* exists so both flows work.

### 4.6 `companies.module.ts` — onboarding is `FINIQ_ADMIN`'s job, `TENANT_ADMIN` needs multi-company reads

Two follow-on changes now that the roles are resolved:

- **`createCompany` / `createArn` should be gated `@Roles(UserRole.FINIQ_ADMIN)`**, not `COMPANY_ADMIN` as `createArn` currently is (`companies.controller.ts` line ~49 resolves `adminRole` via `UserRole.COMPANY_ADMIN` today — that's backwards from what you've just described: a `COMPANY_ADMIN` shouldn't be able to spin up *new* ARNs/distributors for their own company via this onboarding path, since ARN creation is explicitly SaaS-owner-mediated client onboarding, not day-to-day company administration). Rework `createArn`'s access check to use `HierarchyAccessService.resolveAccess` + `assertCompanyAllowed`, restricted to `FINIQ_ADMIN` only. If company admins still need a way to request/register additional ARNs day-to-day (separate from onboarding), that's a distinct, narrower endpoint — don't conflate it with the onboarding flow described in §1.5/§4.5.
- **Any "list companies" / "company detail" endpoint** needs the `allowedCompanyIds` branch from `assertCompanyAllowed`/`access.allowedCompanyIds` so that a `TENANT_ADMIN` sees exactly the companies under their `tenant_id` (not one, not all), and a `FINIQ_ADMIN` sees literally everything, unfiltered, across every tenant — this is the endpoint set the SaaS owner's onboarding dashboard would run on top of.
- **`dashboard`/`holdings-cache`/`sips` company-level rollups** (§4.2, §4.3): if `TENANT_ADMIN` needs an aggregate view across their multiple companies (e.g. "total AUM across all my companies"), that's an *aggregation* over `allowedCompanyIds`, not a single `companyId` query — flag this explicitly if/when you build a `TENANT_ADMIN` dashboard, since it's a genuinely different query shape (`GROUP BY company_id` or a `company_id IN (...)` sum) than anything that exists today.
- Every place in §4.1–§4.4 that currently reads `access.companyId` directly should, going forward, prefer `access.allowedCompanyIds` when the endpoint is reachable by `FINIQ_ADMIN`/`TENANT_ADMIN` (most investor/holdings/transaction endpoints won't be — those stay `companyId`-based since `FINIQ_ADMIN`/`TENANT_ADMIN` realistically operate on company/ARN records, not day-to-day investor data — but don't assume that without checking each endpoint's actual `@Roles(...)` list).

---

## 5. Unified portal implications (company admin logs in through the same distributor portal)

This is the part that most changes based on your last message. Since `COMPANY_ADMIN` now authenticates through the same app as `BROKER`/`SUB_BROKER`, the frontend can no longer assume "if you're in the distributor app, you're a broker" — every screen needs a role branch, not just a route guard.

### 5.1 Backend: no new work beyond §4 — this was already role-based, not app-based

Nothing in the NestJS backend distinguishes "which frontend" called it — it only ever looked at JWT roles. §3's `HierarchyAccessService` already returns `allowedSubBrokerIds: null` for `COMPANY_ADMIN`, which is exactly "see everything in my company." So the backend work in §4 is sufficient; the unification is purely a frontend concern from here.

### 5.2 Frontend: role-aware, not portal-aware

Check `frontend/src/context` and `frontend/src/app/distributor` vs `frontend/src/app/admin` — you currently have **separate route trees** for admin and distributor (`app/admin/*`, `app/distributor/*`). Two viable approaches, pick one deliberately rather than let it happen accidentally:

**Option A — Merge into one route tree, branch by role at the component level.**
Every page under (what is currently) `app/distributor/*` reads `role` from auth context; if `COMPANY_ADMIN`, render with `allowedSubBrokerIds = null` semantics (no filtering UI needed, or a full hierarchy picker defaulting to "all"); if `BROKER`/`SUB_BROKER`, render scoped to their own subtree automatically, no picker needed since they only have one subtree. This is the cleaner long-term structure and matches "same login, same screens."

**Option B — Keep `app/admin/*` and `app/distributor/*` separate, but company admins land on the distributor tree post-login** (since you said no separate admin portal is planned), and `app/admin/*` becomes either deprecated or repurposed for genuinely platform-level (`FINIQ_ADMIN`/`TENANT_ADMIN`) screens only.

Given you said "no separate admin portal," **Option A is the right target.** Concretely:

1. **Auth context** (`frontend/src/context`): after login, expose `{ role, subBrokerId, companyId, allowedSubBrokerIds }` — the last one isn't in the JWT (by design, it's expensive/derived), so add a lightweight `GET /api/hierarchy/my-scope` backend endpoint (thin wrapper around `HierarchyAccessService.resolveAccess` returning just `{ allowedSubBrokerIds, callerSubBrokerId }`) that the frontend calls once after login and caches, rather than recomputing hierarchy membership client-side from partial data. Never trust a client-computed "am I allowed to see X" — always defer the actual gating decision to the backend on every request; the frontend copy of `allowedSubBrokerIds` is for **UI purposes only** (hiding buttons, filtering a picker's options), never the actual security boundary.
2. **Every list/dropdown that currently shows "all brokers"** (investor-mapping's broker picker, user-management's broker tree, any "assign to" selector) should call the already-scoped backend endpoints (§4's `getAssignableBrokers`, the new scoped `getAllUsers` branch) rather than filtering a full list client-side. This was already true for investor-mapping; extend it everywhere else you add a picker.
3. **Hierarchy tree UI**: since `COMPANY_ADMIN` now needs to *see* the whole tree (for placing distributors/sub-brokers anywhere) while `BROKER`/`SUB_BROKER` only see their own subtree, build one `<HierarchyTree>` component that takes the already-scoped data from the backend as a prop — don't build two components, don't reimplement tree-building logic in JS from a flat list plus client-side role logic (the `buildTree` logic in `user-management.service.ts` — `brokerMap`/`parent_id` walk — should really live only on the backend and be returned pre-nested, since duplicating that walk in the frontend is one more place hierarchy logic can silently diverge).
4. **Action visibility** (edit/delete/reparent buttons): gate by `allowedSubBrokerIds.includes(row.id)` client-side for UX (hide buttons the user can't use), but this is cosmetic — the real enforcement is the backend `assertSubBrokerAllowed` from §4.4. Never skip the backend check because the frontend already hid the button.

### 5.3 Investor-facing side is unaffected

None of this touches `app/investor/*` or the investor JWT payload (`investor-auth` module) — investors authenticate and see only their own data via a completely separate flow (`payload.investor_id`), which already isn't part of the hierarchy problem. Confirmed by reading `jwt.strategy.ts` — investor tokens carry `investor_id` directly, not `roles`, so nothing in this document changes investor login behavior.

---

## 6. Security / privacy checklist (re-verify each item before shipping)

- [ ] Every new/modified endpoint has `@UseGuards(JwtAuthGuard)` at minimum; ones with role-specific behavior also resolve `HierarchyAccessService` — never trust `req.body.company_id` or `req.body.sub_broker_id` for *scoping* decisions, only for *targeting* (and always validate the target against `allowedSubBrokerIds`/`companyId` server-side).
- [ ] Tenant boundary (`company_id`) is checked **unconditionally**, even for `COMPANY_ADMIN` — hierarchy scoping is a second, independent layer on top, never a replacement for it.
- [ ] `findAll`/`findById`/`findByPan` in `investors.module.ts` (§4.1) are the highest-priority fix — currently fully unscoped and reachable.
- [ ] `checkBrokerAccess` is deleted, not just fixed-in-place — leaving it around invites a future call site to use the broken version again.
- [ ] Reparenting (`updateBroker`) validates **both** old-subtree-ownership and new-parent-ownership (§4.4) — a partial check here lets a sub-broker exfiltrate a branch to themselves from an unrelated part of the tree, or hide their own branch from their manager by moving it under someone unrelated to them.
- [ ] `allowedSubBrokerIds` computation in `HierarchyAccessService` is company-scoped (§2.2/§3) — the current investor-mapping BFS loads the *entire* `sub_brokers` table with no `company_id` filter; low risk today (it filters correctly afterward) but fix it as part of this pass so it's never a foot-gun later.
- [ ] Frontend `allowedSubBrokerIds`/role data is treated as UI-only, never as the enforcement layer (§5.2 point 4).
- [ ] Audit trail: `investor_mapping_history.performed_by_id` pattern is good — extend the same "who did this" logging to the new self-service create/reparent endpoints in §4.4, so a company admin can always answer "which sub-broker added this investor" even after the data is later reassigned.
- [ ] `FINIQ_ADMIN`/`TENANT_ADMIN` company-axis checks use `assertCompanyAllowed` (§3), never `allowedSubBrokerIds` — the two axes (§3.1) must stay independently enforced, never merged into one check.
- [ ] `createCompany`/`createArn` are re-gated to `FINIQ_ADMIN` only (§4.6) — confirm no `COMPANY_ADMIN` code path can still mint new ARNs/distributors for themselves once this ships.
- [ ] `UserRole` TypeScript enum includes `INVESTOR` (§2.4), matching the live `user_role_enum` — confirmed drift, not optional.
- [ ] `HierarchyAccessService.resolveAccess()` explicitly fails closed on `UserRole.INVESTOR` (§3.4) rather than falling through to the generic catch-all — verify this branch exists before any code starts creating `role: 'INVESTOR'` profiles.
- [ ] `client_mappings`/`ClientMapping` is not used as a new data source anywhere in this build (§1.7 point 1) — it's confirmed dead code, not a hidden second source of truth; don't let a future PR "helpfully" start reading from it.

---

## 7. Suggested build order (phased, each phase independently shippable)

1. **Phase 0 — foundation:** `HierarchyAccessService` (§3), `parent_id`/`company_id` indexes (§2.2), `UserRole.INVESTOR` enum fix + fail-closed branch (§2.4/§3.4). No behavior change beyond the enum fix, just infrastructure.
2. **Phase 1 — close the open gap:** `investors.controller`/`service` `findAll`/`findById`/`findByPan` scoping (§4.1, first half). This is the only genuinely open (not just broken) hole; ship it first regardless of what else is in flight.
3. **Phase 2 — fix the broken bug:** replace all `checkBrokerAccess` call sites (§4.1, second half).
4. **Phase 3 — dashboard hierarchy scoping** (§4.2) — makes broker-facing dashboards trustworthy.
5. **Phase 4 — self-service hierarchy management** (§4.4) + reparenting double-check.
6. **Phase 5 — ARN→distributor login provisioning** (§4.5) — coordinate timing with whatever the separate admin-panel project needs from the ARN creation form.
7. **Phase 6 — onboarding re-gating** (§4.6) — move `createCompany`/`createArn` to `FINIQ_ADMIN`-only, add `TENANT_ADMIN` multi-company list endpoints. Do this in the same pass as Phase 5 since they touch the same controller.
8. **Phase 7 — frontend unification** (§5) — route-tree merge, scoped pickers, hierarchy tree component, `my-scope` endpoint + context wiring.
9. **Phase 8 (optional, when convenient)** — explicit `SubBrokerType` enum (§2.1), `path`-column-based descendant queries replacing BFS (§3.3) — pure performance/maintainability, no security dependency, safe to defer.

Every phase after Phase 0 can be developed and QA'd against the dummy hierarchy in your message (`d1/s1/s2/s3/d2/s4` with `i1..i10`) as a fixed test fixture — seed exactly that tree in a test DB and assert the visible-investor-set at every node matches your spec verbatim. That fixture is a good acceptance test to keep permanently, not just for this build.
