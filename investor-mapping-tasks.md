# Investor Mapping — Module Build Guide (Antigravity Agent Instructions)

## 0. READ THIS FIRST — Context & Ground Truth

This is **not a greenfield module**. A partial backend implementation of "Investor Mapping"
already exists in `finiq-api`. Do not scaffold a new module from scratch — **extend the
existing one**. The existing implementation only supports `COMPANY_ADMIN`, only supports
assign/unassign (no listing/read endpoints), and has zero frontend. Your job is to complete
it end-to-end with proper role-based scoping, list/read endpoints, and a full frontend
screen.

Everything stated below was verified directly against the uploaded source (`finiq-api`,
`finiq` frontend) and the uploaded Postgres schema dump. Do not assume anything about table
columns beyond what is documented here — the schema section is exhaustive for the tables
that matter to this feature.

### 0.1 Existing backend files (already present — study, then extend)

```
finiq-api/src/entities/investor-mapping.entity.ts
finiq-api/src/entities/investor-mapping-history.entity.ts
finiq-api/src/entities/investor.entity.ts
finiq-api/src/entities/sub-broker.entity.ts
finiq-api/src/entities/user-profile.entity.ts
finiq-api/src/modules/investor-mapping/investor-mapping.module.ts
finiq-api/src/modules/investor-mapping/investor-mapping.controller.ts
finiq-api/src/modules/investor-mapping/investor-mapping.service.ts
finiq-api/src/modules/investor-mapping/dto/investor-mapping.dto.ts
```

Current behaviour of the existing module:
- `POST /api/companies/investor-mapping/assign` — `@Roles(COMPANY_ADMIN)` only. Body:
  `{ investor_ids: string[], sub_broker_id: string }`. Deactivates any other active mapping
  for each investor (business rule: **one active mapping per investor at a time**), then
  activates/creates the mapping to the target `sub_broker_id`, and logs an
  `InvestorMappingHistory` row.
- `POST /api/companies/investor-mapping/unassign` — `@Roles(COMPANY_ADMIN)` only. Same body
  shape. Deactivates the mapping and logs history.
- **No GET/list endpoints exist at all.** There is no way today to fetch "investors mapped to
  broker X" or "unmapped investors" or "mapping history" from this module.
- Both endpoints hard-require the caller's role entry to be exactly `COMPANY_ADMIN`
  (`adminPayload.roles.find(r => r.role === UserRole.COMPANY_ADMIN)`), so a `BROKER` or
  `SUB_BROKER` calling these endpoints today gets `RoleGuard` 403/false — extending the
  `@Roles` decorator is necessary but is NOT sufficient by itself, because the service method
  bodies specifically look up `COMPANY_ADMIN` in the roles array and will throw
  `BadRequestException('Invalid Company Admin context')` for anyone else. **This logic must
  be rewritten**, not just have its guard relaxed. Full detail in Task 2.

### 0.2 The critical missing link — READ BEFORE WRITING ANY SCOPING LOGIC

The single most important gap you must fix before role-based scoping can work at all:

**There is currently no way to know which `sub_broker_id` a logged-in `BROKER` or
`SUB_BROKER` user corresponds to.**

Verified from the schema dump (`sub_brokers` table) and `sub-broker.entity.ts`:
```sql
CREATE TABLE public.sub_brokers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    arn_id character varying,
    parent_id uuid,
    path character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    email character varying(100)
);
```
There is **no `user_id` column**, and the JWT payload (`UserMapper.mapRoles` →
`generateAuthResponse` in `authentication.service.ts`) only carries
`{ id (user_profile.id), role, tenant_id, company_id, company_name, first_name, last_name,
email }` per role entry — **no `sub_broker_id`**.

The existing codebase's *only* workaround elsewhere (`UserManagementService.updateSubBroker`)
is to match `sub_brokers.email` against `user_profiles.email` at request time — fragile
(breaks if emails are ever edited independently, blank, or duplicated) and not something to
extend further.

**You must add a proper `user_id` column to `sub_brokers` and thread it through login.** This
is a schema change — see Task 1. Once in place, every subsequent scoping decision in this
guide becomes a simple, reliable lookup instead of guesswork.

> Note for SP: this is the same underlying gap flagged in your ongoing "sub-broker
> auto-provisioning" work (linking `sub_brokers` to `users` via `user_id`). If you've already
> shipped that column in a different session/branch by the time this runs, the agent should
> detect it (see Task 1.3 "Idempotency check") and skip re-adding it, but must still verify the
> JWT payload actually carries `sub_broker_id` — that part is very likely still missing even if
> the column exists.

---

## 1. Database Schema Changes Required

### 1.1 Add `user_id` to `sub_brokers`

```sql
ALTER TABLE public.sub_brokers
  ADD COLUMN user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sub_brokers_user_id
  ON public.sub_brokers (user_id)
  WHERE user_id IS NOT NULL;
```
- Nullable, because historically-created `sub_brokers` rows (created before this change, or
  created without an accompanying login) won't have one. `UserManagementService.createSubBroker`
  already creates the `User` row and the `SubBroker` row in the same transaction — from now on
  it must also stamp `user_id` on creation (Task 1.2).
- Unique-when-not-null: one user account should not silently back two different SubBroker
  hierarchy nodes.
- `ON DELETE SET NULL` (not CASCADE) — deleting a `User` login must not delete the
  hierarchy/commission node.

### 1.2 Backfill existing rows (best-effort, by email match)

Run once, after the column exists, to link up whatever can be reliably matched using the
existing (fragile) email-based convention already in use elsewhere in the codebase:

```sql
UPDATE public.sub_brokers sb
SET user_id = up.user_id
FROM public.user_profiles up
WHERE sb.user_id IS NULL
  AND sb.email IS NOT NULL
  AND up.email IS NOT NULL
  AND lower(sb.email) = lower(up.email)
  AND up.role IN ('BROKER', 'SUB_BROKER')
  AND up.company_id = sb.company_id;
```
Log/print how many rows were updated vs. how many `sub_brokers` rows remain `user_id IS NULL`
afterward — report that count back to SP, since any remaining nulls mean those
brokers/sub-brokers cannot log in and use Investor Mapping scoped to themselves until fixed
manually (their `SubBroker` record needs a `user_id` set, or a new one to be created).

### 1.3 Idempotency check before running the above

Before running the `ALTER TABLE`, check whether the column already exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sub_brokers' AND column_name = 'user_id';
```
If it already exists, skip 1.1 and go straight to verifying 1.2's backfill state.

### 1.4 No other schema changes are required

`investor_mappings` and `investor_mapping_history` already have everything this feature
needs (`company_id`, `investor_id`, `sub_broker_id`, `is_active`, `performed_by_id`,
timestamps). Do not alter these tables. Do not add a `distributor_id` column anywhere —
"distributor" is a **business-vocabulary term** for a root-level (`parent_id IS NULL`)
`sub_brokers` row with role `BROKER`; there is no separate distributors table. Confirmed via:
```sql
CREATE TABLE public.investor_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    sub_broker_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.investor_mapping_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    sub_broker_id uuid NOT NULL,
    action public.mapping_action_enum NOT NULL,
    performed_by_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### 1.5 Role/hierarchy model recap (for correctness of every task below)

- `user_profiles.role` enum: `FINIQ_ADMIN, TENANT_ADMIN, COMPANY_ADMIN, COMPANY_USER, BROKER,
  SUB_BROKER` (`user-profile.entity.ts`).
- `sub_brokers` is a **single self-referencing table** for both "distributors" (top-level,
  `parent_id IS NULL`, role `BROKER`) and "sub-brokers" (`parent_id` set, role `SUB_BROKER`),
  linked via `parent_id` + a precomputed `path` enumeration column
  (`"grandparentId/parentId"`, not including the node's own id — see
  `UserManagementService.createSubBroker`/`rebuildDescendantPaths`).
- An investor is mapped to exactly one `sub_broker_id` at a time (unique-active constraint
  enforced in `InvestorMappingService.assignInvestors`, not a DB constraint — the DB has
  `@Unique(['investor_id','sub_broker_id'])` on the entity which allows a historical inactive
  row to exist per pair, while activity toggles via `is_active`).
- Frontend's own working definition of "distributor" (see
  `frontend/src/app/distributor/users/page.tsx`, `extractRole()`): a `sub_brokers` row with no
  `parent_id` is a "Distributor", one with a `parent_id` is a "Sub Broker". Reuse this exact
  convention in the new screen for consistency — do not invent a different label scheme.

---

## 2. Backend Changes — `finiq-api`

### 2.1 Update `SubBroker` entity

`src/entities/sub-broker.entity.ts` — add the `user_id` column and relation:

```ts
import { User } from './user.entity'; // add this import

// ... inside class SubBroker, alongside existing columns:

@Column({ type: 'uuid', nullable: true })
user_id: string | null;

@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'user_id' })
user: User | null;
```
Confirm `User` entity path/name first (`src/entities/user.entity.ts` exports `User`) before
adding the import — do not guess the export name.

### 2.2 Stamp `user_id` when creating a sub-broker

In `UserManagementService.createSubBroker` (`src/modules/user-management/user-management.service.ts`),
the `SubBroker` is created a few lines after `savedUser` — thread the id through:

```ts
const subBroker = manager.create(SubBroker, {
  name: dto.name,
  email: dto.email,
  arn_id: dto.arn,
  parent_id: parentId,
  path: path || undefined,
  company_id: dto.company_id,
  user_id: savedUser.id,   // ADD THIS LINE
} as any);
```
This is the only creation path for `SubBroker` rows in the codebase (confirmed by
`grep -rn "manager.create(SubBroker\|new SubBroker(" src`) — no other place needs updating for
new records going forward.

### 2.3 Add `sub_broker_id` to the JWT payload for BROKER/SUB_BROKER roles

In `AuthenticationService.generateAuthResponse` (`src/modules/auth/authentication.service.ts`),
`UserMapper.mapRoles(profiles)` builds the `roles` array embedded in the JWT. Extend
`UserMapper.mapRoles` (`src/common/utils/user.mapper.ts`) to also resolve and attach
`sub_broker_id` for role entries that are `BROKER` or `SUB_BROKER`. Because `UserMapper` is a
static method with no DB access today, you have two clean options — **pick Option A** (keeps
`UserMapper` a pure function, avoids surprise async calls sprinkled through unrelated call
sites of `mapRoles`, e.g. `getMe()`):

**Option A (recommended):** resolve `sub_broker_id` in `AuthenticationService` itself, right
after computing `roles`, and merge it in before signing/returning:

```ts
// in generateAuthResponse(), after: const roles = UserMapper.mapRoles(profiles);

const brokerRole = roles.find(r => r.role === UserRole.BROKER || r.role === UserRole.SUB_BROKER);
if (brokerRole) {
  const linkedSubBroker = await this.repository.findSubBrokerByUserId(user.id); // add this repo method
  if (linkedSubBroker) {
    (brokerRole as any).sub_broker_id = linkedSubBroker.id;
  }
}
```
Add `findSubBrokerByUserId(userId: string)` to `AuthenticationRepository`
(`src/modules/auth/authentication.repository.ts`) — inject/query the `SubBroker` repository
(`@InjectRepository(SubBroker)`) with `findOne({ where: { user_id: userId } })`. Check the
existing constructor of `AuthenticationRepository` for the pattern already used to inject other
repos there before adding a new one.

Apply the same merge inside `getMe()` (same service) so `/api/auth/me` responses also reflect
`sub_broker_id` — the frontend's `decodeJwt` reads it straight from the token, but keep `getMe`
consistent since other code may rely on it later.

Also update `DecodedStaffToken` in `frontend/src/lib/authClient.ts` — add the optional field
to the array-item type:
```ts
roles: Array<{
  id: string;
  role: string;
  tenant_id: string | null;
  company_id: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  sub_broker_id?: string | null; // ADD THIS
}>;
```

> This does mean every BROKER/SUB_BROKER user must log out and back in (or hit refresh-token,
> which re-signs via the same `generateAuthResponse` path) to pick up the new claim after this
> change ships. That's expected and fine — no migration needed for already-issued tokens, they
> simply won't have scoped Investor Mapping access until they get a fresh token, at which point
> your role-guarded endpoints below should treat a missing `sub_broker_id` for a BROKER/SUB_BROKER
> caller as "no accessible sub_broker_id" (empty result set / 403 on write), not as a crash.

### 2.4 Rewrite `InvestorMappingService` for three-tier scoping

Replace the `COMPANY_ADMIN`-only lookups in `assignInvestors`/`unassignInvestors`, and add the
new read endpoints. Full target file (`src/modules/investor-mapping/investor-mapping.service.ts`):

```ts
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { InvestorMapping } from 'src/entities/investor-mapping.entity';
import { InvestorMappingHistory, MappingAction } from 'src/entities/investor-mapping-history.entity';
import { Investor } from 'src/entities/investor.entity';
import { SubBroker } from 'src/entities/sub-broker.entity';
import { UserProfile, UserRole } from 'src/entities/user-profile.entity';
import { AssignInvestorsDto, UnassignInvestorsDto } from './dto/investor-mapping.dto';

interface AccessContext {
  companyId: string;
  performedById: string;
  // null = unrestricted (COMPANY_ADMIN); otherwise the exact set of sub_broker ids
  // (self + all descendants) the caller is allowed to assign/unassign/view.
  allowedSubBrokerIds: string[] | null;
}

@Injectable()
export class InvestorMappingService {
  private readonly logger = new Logger(InvestorMappingService.name);

  constructor(
    @InjectRepository(InvestorMapping) private readonly mappingRepo: Repository<InvestorMapping>,
    @InjectRepository(InvestorMappingHistory) private readonly historyRepo: Repository<InvestorMappingHistory>,
    @InjectRepository(Investor) private readonly investorRepo: Repository<Investor>,
    @InjectRepository(SubBroker) private readonly subBrokerRepo: Repository<SubBroker>,
    @InjectRepository(UserProfile) private readonly userProfileRepo: Repository<UserProfile>,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // ACCESS RESOLUTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Resolves the caller's company_id, performedById (user_profile id used for
   * history logging), and the set of sub_broker ids they're allowed to touch.
   *
   *  - COMPANY_ADMIN → allowedSubBrokerIds = null (unrestricted within their company)
   *  - BROKER        → self + all descendants (their whole downline)
   *  - SUB_BROKER     → self + all descendants (their own downline, if any)
   *  - anything else  → throws ForbiddenException
   */
  private async resolveAccess(userPayload: any): Promise<AccessContext> {
    const roles: any[] = userPayload?.roles || [];

    const adminRole = roles.find(r => r.role === UserRole.COMPANY_ADMIN);
    if (adminRole) {
      if (!adminRole.company_id) throw new BadRequestException('Invalid Company Admin context');
      return {
        companyId: adminRole.company_id,
        performedById: adminRole.id,
        allowedSubBrokerIds: null,
      };
    }

    const brokerRole = roles.find(r => r.role === UserRole.BROKER || r.role === UserRole.SUB_BROKER);
    if (brokerRole) {
      if (!brokerRole.company_id) throw new BadRequestException('Invalid broker context');
      if (!brokerRole.sub_broker_id) {
        // JWT predates the sub_broker_id claim, or this account has no linked
        // SubBroker row at all — fail closed, not open.
        throw new ForbiddenException(
          'Your account is not linked to a broker record. Please log out and log back in; ' +
          'if the issue persists, contact your administrator.',
        );
      }
      const descendantIds = await this.getDescendantSubBrokerIds(brokerRole.sub_broker_id);
      return {
        companyId: brokerRole.company_id,
        performedById: brokerRole.id,
        allowedSubBrokerIds: [brokerRole.sub_broker_id, ...descendantIds],
      };
    }

    throw new ForbiddenException('You do not have permission to access Investor Mapping.');
  }

  /** BFS over parent_id within the company; also usable via the `path` column for a
   *  single indexed query — using BFS here for parity with the existing
   *  UserManagementService.getDescendantBrokerIds() approach used elsewhere in the codebase. */
  private async getDescendantSubBrokerIds(rootId: string): Promise<string[]> {
    const all = await this.subBrokerRepo.find({ select: ['id', 'parent_id'] });
    const ids: string[] = [];
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      const children = all.filter(b => b.parent_id === current);
      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  }

  private assertSubBrokerAllowed(access: AccessContext, subBrokerId: string) {
    if (access.allowedSubBrokerIds === null) return; // COMPANY_ADMIN, unrestricted
    if (!access.allowedSubBrokerIds.includes(subBrokerId)) {
      throw new ForbiddenException('You do not have permission to manage investors for this broker.');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // READ — listing endpoints (NEW)
  // ─────────────────────────────────────────────────────────────

  /** Brokers/sub-brokers the caller is allowed to allot/remove investors for,
   *  used to populate the target-selection dropdown/tree in the UI. */
  async getAssignableBrokers(userPayload: any) {
    const access = await this.resolveAccess(userPayload);
    const where: any = { company_id: access.companyId };
    if (access.allowedSubBrokerIds !== null) {
      where.id = In(access.allowedSubBrokerIds);
    }
    const brokers = await this.subBrokerRepo.find({ where, order: { name: 'ASC' } });
    return brokers.map(b => ({
      id: b.id,
      name: b.name,
      arn_id: b.arn_id,
      parent_id: b.parent_id,
      is_distributor: !b.parent_id,
    }));
  }

  /** Investors in the company, annotated with their current active mapping (if any),
   *  filterable by mapped/unmapped and by a specific target sub_broker. */
  async getInvestors(
    userPayload: any,
    opts: { page: number; limit: number; search?: string; status?: 'all' | 'mapped' | 'unmapped'; sub_broker_id?: string },
  ) {
    const access = await this.resolveAccess(userPayload);

    const qb = this.investorRepo.createQueryBuilder('investor')
      .leftJoin(InvestorMapping, 'mapping', 'mapping.investor_id = investor.id AND mapping.is_active = true')
      .leftJoin(SubBroker, 'broker', 'broker.id = mapping.sub_broker_id')
      .where('investor.company_id = :companyId', { companyId: access.companyId });

    if (access.allowedSubBrokerIds !== null) {
      // A BROKER/SUB_BROKER may only see investors that are EITHER already mapped
      // somewhere within their own downline, OR completely unmapped (so they can
      // allot fresh investors to themselves/their downline). They must never see
      // investors that belong to a sibling/unrelated branch.
      qb.andWhere('(mapping.sub_broker_id IN (:...allowed) OR mapping.id IS NULL)', {
        allowed: access.allowedSubBrokerIds,
      });
    }

    if (opts.status === 'mapped') qb.andWhere('mapping.id IS NOT NULL');
    if (opts.status === 'unmapped') qb.andWhere('mapping.id IS NULL');
    if (opts.sub_broker_id) qb.andWhere('mapping.sub_broker_id = :sb', { sb: opts.sub_broker_id });
    if (opts.search?.trim()) {
      qb.andWhere('(investor.investor_name ILIKE :s OR investor.pan_no ILIKE :s)', { s: `%${opts.search.trim()}%` });
    }

    qb.select([
      'investor.id AS id',
      'investor.investor_name AS name',
      'investor.pan_no AS pan',
      'investor.email AS email',
      'investor.mobile_no AS mobile',
      'mapping.sub_broker_id AS current_sub_broker_id',
      'broker.name AS current_sub_broker_name',
    ]);

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const total = await qb.getCount();
    const rows = await qb.orderBy('investor.investor_name', 'ASC').offset((page - 1) * limit).limit(limit).getRawMany();

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  /** Mapping history, scoped the same way as the investor listing. */
  async getHistory(userPayload: any, opts: { page: number; limit: number; sub_broker_id?: string }) {
    const access = await this.resolveAccess(userPayload);

    const qb = this.historyRepo.createQueryBuilder('h')
      .leftJoin(Investor, 'investor', 'investor.id = h.investor_id')
      .leftJoin(SubBroker, 'broker', 'broker.id = h.sub_broker_id')
      .leftJoin(UserProfile, 'performer', 'performer.id = h.performed_by_id')
      .where('h.company_id = :companyId', { companyId: access.companyId });

    if (access.allowedSubBrokerIds !== null) {
      qb.andWhere('h.sub_broker_id IN (:...allowed)', { allowed: access.allowedSubBrokerIds });
    }
    if (opts.sub_broker_id) qb.andWhere('h.sub_broker_id = :sb', { sb: opts.sub_broker_id });

    qb.select([
      'h.id AS id',
      'h.action AS action',
      'h.created_at AS created_at',
      'investor.investor_name AS investor_name',
      'investor.pan_no AS investor_pan',
      'broker.name AS sub_broker_name',
      "performer.first_name || ' ' || COALESCE(performer.last_name, '') AS performed_by_name",
    ]);

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const total = await qb.getCount();
    const rows = await qb.orderBy('h.created_at', 'DESC').offset((page - 1) * limit).limit(limit).getRawMany();

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  // ─────────────────────────────────────────────────────────────
  // WRITE — assign / unassign (REWRITTEN for scoping)
  // ─────────────────────────────────────────────────────────────

  async assignInvestors(userPayload: any, dto: AssignInvestorsDto) {
    const access = await this.resolveAccess(userPayload);
    this.assertSubBrokerAllowed(access, dto.sub_broker_id);

    const targetBroker = await this.subBrokerRepo.findOne({ where: { id: dto.sub_broker_id, company_id: access.companyId } });
    if (!targetBroker) throw new NotFoundException('Target broker not found in your company');

    const investors = await this.investorRepo.find({ where: { id: In(dto.investor_ids), company_id: access.companyId } });
    if (investors.length !== dto.investor_ids.length) {
      throw new BadRequestException('Some investors not found or do not belong to your company');
    }

    // Non-admins may only reassign investors that are currently unmapped, or already
    // mapped somewhere inside their own downline — never "steal" an investor that
    // belongs to an unrelated branch of the company.
    if (access.allowedSubBrokerIds !== null) {
      const existing = await this.mappingRepo.find({
        where: { investor_id: In(dto.investor_ids), is_active: true },
      });
      const outOfScope = existing.filter(m => !access.allowedSubBrokerIds!.includes(m.sub_broker_id));
      if (outOfScope.length > 0) {
        throw new ForbiddenException('One or more selected investors are already mapped outside your downline.');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const investor of investors) {
        await queryRunner.manager.update(InvestorMapping, { investor_id: investor.id, is_active: true }, { is_active: false });

        let mapping = await queryRunner.manager.findOne(InvestorMapping, {
          where: { investor_id: investor.id, sub_broker_id: targetBroker.id, company_id: access.companyId },
        });
        if (mapping) {
          mapping.is_active = true;
          await queryRunner.manager.save(InvestorMapping, mapping);
        } else {
          mapping = new InvestorMapping();
          mapping.company_id = access.companyId;
          mapping.investor_id = investor.id;
          mapping.sub_broker_id = targetBroker.id;
          mapping.is_active = true;
          await queryRunner.manager.save(InvestorMapping, mapping);
        }
        await this.logHistory(queryRunner, access.companyId, investor.id, targetBroker.id, MappingAction.ASSIGNED, access.performedById);
      }
      await queryRunner.commitTransaction();
      return { success: true, message: 'Investors assigned successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Assignment failed for sub_broker ${dto.sub_broker_id}: ${error.message}`, error.stack);
      throw new BadRequestException(`Mapping failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async unassignInvestors(userPayload: any, dto: UnassignInvestorsDto) {
    const access = await this.resolveAccess(userPayload);
    this.assertSubBrokerAllowed(access, dto.sub_broker_id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const investorId of dto.investor_ids) {
        const mapping = await queryRunner.manager.findOne(InvestorMapping, {
          where: { investor_id: investorId, sub_broker_id: dto.sub_broker_id, company_id: access.companyId, is_active: true },
        });
        if (mapping) {
          mapping.is_active = false;
          await queryRunner.manager.save(InvestorMapping, mapping);
          await this.logHistory(queryRunner, access.companyId, investorId, dto.sub_broker_id, MappingAction.UNASSIGNED, access.performedById);
        }
      }
      await queryRunner.commitTransaction();
      return { success: true, message: 'Investors unassigned successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Unassignment failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Unmapping failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private async logHistory(queryRunner, companyId, investorId, subBrokerId, action: MappingAction, performedById) {
    const history = new InvestorMappingHistory();
    history.company_id = companyId;
    history.investor_id = investorId;
    history.sub_broker_id = subBrokerId;
    history.action = action;
    history.performed_by_id = performedById;
    await queryRunner.manager.save(InvestorMappingHistory, history);
  }
}
```

Notes on deviations from the original file, called out explicitly so nothing gets silently
lost in the rewrite:
- `unassignInvestors` previously used `adminPayload.id` (root JWT `sub`, i.e. `users.id`) as
  `performed_by_id`, while `assignInvestors` used `adminRole.id` (the `user_profiles.id`).
  `InvestorMappingHistory.performed_by_id` has an FK-shaped relation to `UserProfile`
  (`@ManyToOne(() => UserProfile)`), so the `unassignInvestors` original code was passing the
  wrong id type (users.id, not user_profiles.id) — **this was a latent bug**. The rewrite above
  uses `access.performedById` (`user_profiles.id`) consistently for both operations. Flag this
  fix in your PR/commit message since it changes what gets written to
  `investor_mapping_history.performed_by_id` for unassign actions going forward — worth a
  one-time sanity check on any existing history rows if this ever gets inspected for audit
  purposes (no destructive migration needed, historical rows are simply left as-is).

### 2.5 Controller — add read endpoints, open up write endpoints to all three roles

`src/modules/investor-mapping/investor-mapping.controller.ts`:

```ts
import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { InvestorMappingService } from './investor-mapping.service';
import { AssignInvestorsDto, UnassignInvestorsDto } from './dto/investor-mapping.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/entities/user-profile.entity';
import { ResponseFormatter } from 'src/common';

const MAPPING_ROLES = [UserRole.COMPANY_ADMIN, UserRole.BROKER, UserRole.SUB_BROKER];

@Controller('api/companies/investor-mapping')
@UseGuards(JwtAuthGuard, RoleGuard)
export class InvestorMappingController {
    constructor(private readonly service: InvestorMappingService) { }

    @Get('brokers')
    @Roles(...MAPPING_ROLES)
    async getAssignableBrokers(@Request() req) {
        const result = await this.service.getAssignableBrokers(req.user);
        return ResponseFormatter.success(result, 'Brokers fetched successfully');
    }

    @Get('investors')
    @Roles(...MAPPING_ROLES)
    async getInvestors(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: 'all' | 'mapped' | 'unmapped',
        @Query('sub_broker_id') sub_broker_id?: string,
    ) {
        const result = await this.service.getInvestors(req.user, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search,
            status: status || 'all',
            sub_broker_id,
        });
        return ResponseFormatter.paginated(result.data, result.total, result.page, result.limit);
    }

    @Get('history')
    @Roles(...MAPPING_ROLES)
    async getHistory(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sub_broker_id') sub_broker_id?: string,
    ) {
        const result = await this.service.getHistory(req.user, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            sub_broker_id,
        });
        return ResponseFormatter.paginated(result.data, result.total, result.page, result.limit);
    }

    @Post('assign')
    @Roles(...MAPPING_ROLES)
    @HttpCode(HttpStatus.OK)
    async assign(@Request() req, @Body() dto: AssignInvestorsDto) {
        const result = await this.service.assignInvestors(req.user, dto);
        return ResponseFormatter.success(result, 'Investors assigned successfully');
    }

    @Post('unassign')
    @Roles(...MAPPING_ROLES)
    @HttpCode(HttpStatus.OK)
    async unassign(@Request() req, @Body() dto: UnassignInvestorsDto) {
        const result = await this.service.unassignInvestors(req.user, dto);
        return ResponseFormatter.success(result, 'Investors unassigned successfully');
    }
}
```
Check `ResponseFormatter.paginated` signature (`src/common/utils/response.formatter.ts`) before
wiring this up — confirmed shape is `paginated(data: T[], total, page, limit)`, do not pass any
other shape.

### 2.6 Module wiring

`investor-mapping.module.ts` already imports everything this needs
(`InvestorMapping, InvestorMappingHistory, Investor, UserProfile, SubBroker`). No changes
required there. Confirm `InvestorMappingModule` is imported into `AppModule`
(`src/app.module.ts`) — if it's missing from that import list, add it; check first, don't
assume.

### 2.7 DTOs — no changes needed for assign/unassign

`AssignInvestorsDto`/`UnassignInvestorsDto` are unchanged. The new GET endpoints use plain
`@Query()` params validated inline in the controller (matches the existing convention seen in
`UserManagementController.getAllUsersPaginated`) rather than a new query DTO class — keep it
consistent with that precedent, don't introduce a parallel pattern.

---

## 3. Frontend Changes — `finiq`

### 3.1 New service methods

Add to `frontend/src/services/distributor.service.ts` (follow the exact `apiClient` +
`ApiResponse<T>` / `PaginatedResponse<T>` conventions already used throughout this file —
study the top of the file for those generic interfaces before adding new ones):

```ts
// ─── INVESTOR MAPPING ───

export interface AssignableBroker {
  id: string;
  name: string;
  arn_id: string | null;
  parent_id: string | null;
  is_distributor: boolean;
}

export interface MappableInvestor {
  id: string;
  name: string;
  pan: string;
  email: string | null;
  mobile: string | null;
  current_sub_broker_id: string | null;
  current_sub_broker_name: string | null;
}

export interface MappingHistoryEntry {
  id: string;
  action: 'ASSIGNED' | 'UNASSIGNED';
  created_at: string;
  investor_name: string;
  investor_pan: string;
  sub_broker_name: string;
  performed_by_name: string;
}

// ... inside `export const distributorService = { ... }`:

getAssignableBrokers: async (): Promise<ApiResponse<AssignableBroker[]>> => {
  return apiClient.get<ApiResponse<AssignableBroker[]>>('/companies/investor-mapping/brokers');
},

getMappableInvestors: async (
  page: number = 1,
  limit: number = 20,
  search: string = '',
  status: 'all' | 'mapped' | 'unmapped' = 'all',
  subBrokerId?: string,
): Promise<ApiResponse<PaginatedResponse<MappableInvestor>>> => {
  let url = `/companies/investor-mapping/investors?page=${page}&limit=${limit}&status=${status}`;
  if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
  if (subBrokerId) url += `&sub_broker_id=${subBrokerId}`;
  return apiClient.get<ApiResponse<PaginatedResponse<MappableInvestor>>>(url);
},

getMappingHistory: async (
  page: number = 1,
  limit: number = 20,
  subBrokerId?: string,
): Promise<ApiResponse<PaginatedResponse<MappingHistoryEntry>>> => {
  let url = `/companies/investor-mapping/history?page=${page}&limit=${limit}`;
  if (subBrokerId) url += `&sub_broker_id=${subBrokerId}`;
  return apiClient.get<ApiResponse<PaginatedResponse<MappingHistoryEntry>>>(url);
},

assignInvestors: async (investor_ids: string[], sub_broker_id: string) => {
  return apiClient.post('/companies/investor-mapping/assign', { investor_ids, sub_broker_id });
},

unassignInvestors: async (investor_ids: string[], sub_broker_id: string) => {
  return apiClient.post('/companies/investor-mapping/unassign', { investor_ids, sub_broker_id });
},
```
Before adding these, `grep` the file for an existing `PaginatedResponse` import/definition —
it's already defined near the top per the earlier investigation (`getInvestors`/
`downloadInvestorList` already return it) — reuse it, don't redeclare.

### 3.2 API proxying — verify before assuming

The uploaded frontend archive only contains `src/`; `next.config.js`/`.ts` (which almost
certainly holds a generic `/api/:path*` rewrite to the backend, since calls like
`/companies/investor-mapping/...`, `/holdings-cache/investors`, etc. are made directly via
`apiClient` without a matching file under `src/app/api/`) was **not included** in this archive
and could not be inspected. Confirmed dedicated proxy route files that DO exist:
`src/app/api/auth/[...path]/route.ts`, `src/app/api/themes/[...path]/route.ts`,
`src/app/api/investor-auth/[...path]/route.ts` — these are special-cased exceptions, not the
general path.

**Action:** open the actual `next.config.js`/`.ts` at the project root (outside this archive) and
confirm it has a `rewrites()` entry that forwards `/api/companies/:path*` (or a catch-all
`/api/:path*`) to `NEXT_PUBLIC_API_URL`. If it does, the new service methods above will work
with zero extra proxy setup, same as the existing `/companies/investor-mapping/assign` calls
presumably already do today from wherever they're currently invoked (if anywhere) — verify by
checking `git log`/existing usages of `assignInvestors` in the frontend if any exist, or just
trust that `/companies/*` already works given `getCompanyUsers`, `getInvestors`, etc. all hit
`/companies/...` or similar unprefixed paths successfully today per the existing code in this
same service file. If the rewrite is missing, add one, or add an explicit
`src/app/api/companies/[...path]/route.ts` mirroring the `auth` proxy route pattern shown in
section 0 investigation (same structure, swap `API_BASE}/auth/${path}` for
`API_BASE}/companies/${path}`).

### 3.3 Auth types — surface `sub_broker_id`

Already covered in backend Task 2.3, restated here for frontend completeness:
`frontend/src/lib/authClient.ts` → `DecodedStaffToken.roles[]` gets an optional
`sub_broker_id?: string | null` field.

### 3.4 New page: `/distributor/investor-mapping`

Create `frontend/src/app/distributor/investor-mapping/page.tsx`. Structure this as a two-pane
workspace, consistent with the visual language of `app/distributor/users/page.tsx` and
`app/distributor/clients/page.tsx` (same CSS custom-property theme tokens —
`var(--fin-brand-*)`, `var(--fin-table-bg)`, `var(--fin-border)`, etc. — same `lucide-react`
icon usage, same `Loader2` spinner conventions, same rounded-md/shadow-sm card styling). Do
not introduce a new visual language for this screen.

Required UI elements:

1. **Header** — title "Investor Mapping", subtitle adapting to role (e.g. "Allot or remove
   investors for any distributor and sub-broker in your company" for COMPANY_ADMIN vs "Allot
   or remove investors for yourself and your sub-brokers" for BROKER/SUB_BROKER — read the
   role off the decoded JWT client-side, exactly like `app/distributor/settings/page.tsx`
   already does via `decodeJwt`).

2. **Left panel — Broker/Distributor selector**: fetch via `getAssignableBrokers()`. Render
   as a searchable tree/list (`parent_id` groups children under their parent, same nesting
   idea as the existing hierarchy `DesktopUserRow` component in `users/page.tsx` — you can
   reuse/adapt that recursive rendering approach rather than reinventing it). Clicking a
   node selects it as the "target" for allotment and also filters the right panel's
   "Currently Mapped" tab down to that node.
   - For a COMPANY_ADMIN this list contains the whole company tree.
   - For a BROKER this list contains themself (root) + their sub-broker descendants.
   - For a SUB_BROKER this list contains themself + any of their own descendants (per the
     stated requirement: "if it is a subbroker logged in... he/she can allot/remove investors
     for himself and the subbrokers under him, **if any**, else nothing" — if the API returns
     just the single self node with no children, render it with no expand affordance; don't
     show an empty/broken tree control).

3. **Right panel — two tabs:**
   - **"Unmapped / Reassignable Investors"** tab: table (desktop) / list (mobile, mirror the
     existing `DesktopClientTable`/`MobileClientList` split pattern from the clients page) of
     investors from `getMappableInvestors(status='unmapped')` plus a status filter dropdown
     (`all / mapped / unmapped`) and a search box (debounced, same 500ms pattern as
     `clients/page.tsx`). Checkboxes for multi-select. An "Allot to <selected broker>" button,
     disabled until both a target broker is selected on the left AND at least one investor is
     checked. On click, call `assignInvestors(selectedIds, selectedBrokerId)`, show a loading
     state, toast/inline success or error, then refetch both the investor list and (if you
     render counts) the broker tree.
   - **"Currently Mapped"** tab: investors from `getMappableInvestors(status='mapped',
     subBrokerId=selectedBrokerId)` — i.e. investors currently under the selected
     broker/distributor node. Each row has a "Remove" action calling
     `unassignInvestors([investorId], selectedBrokerId)` with a confirmation step (a simple
     inline confirm, matching the destructive-action pattern used for delete in
     `users/page.tsx` — check how that page confirms sub-broker deletion and mirror it, don't
     use a raw `window.confirm`).

4. **History tab or collapsible panel** (optional but recommended given
   `InvestorMappingHistory` already exists and is now exposed via `getMappingHistory()`) —
   simple paginated table: Investor, Action (ASSIGNED/UNASSIGNED badge), Broker, Performed By,
   Date. Read-only.

5. **Empty/permission states:**
   - If `getAssignableBrokers()` returns an empty array for a SUB_BROKER (no downline), show a
     clear empty state: "You have no sub-brokers under you. You can still allot unmapped
     investors to yourself." — and still allow selecting **themself** as a target (their own
     node should always be present in the returned list per Task 2.4's
     `getAssignableBrokers`, since `[brokerRole.sub_broker_id, ...descendantIds]` always
     includes self).
   - If the backend returns 403 with the "not linked to a broker record" message from Task
     2.3, surface that message directly and prompt the user to re-login — do not show a
     generic error.

### 3.5 Sidebar entry

Add a new nav item to `frontend/src/components/distributor/Sidebar.tsx`, immediately after
the existing "Investors" (`/distributor/clients`) item and before "User Management", following
the exact same `Link` + active-state + icon markup pattern already used for every other item
in that file (copy the "Investors" block structure verbatim and adapt href/label/icon — do not
introduce a different markup shape). Suggested icon: `Repeat2` or `GitBranch` from
`lucide-react` (avoid reusing `Network`, already used for "Hierarchy Earnings", and `Users`,
already used for "Investors", to keep icons visually distinct in the sidebar) — add the import
to the existing `lucide-react` import block at the top of the file. Label: "Investor Mapping".

The sidebar currently shows every item to every staff-portal role (no existing role-gating
pattern in this file — confirmed by reading the whole file). This is consistent with the
`/distributor/users` behaviour, where BROKER/SUB_BROKER can already see and hit `GET
/api/admin/users` today. Do not add new sidebar-level role gating for this item unless SP asks
for it later — keep behaviour consistent with the rest of this sidebar, and let the backend be
the actual enforcement boundary (which it now is, per Task 2).

### 3.6 Route protection

`frontend/src/middleware.ts` already protects the whole `/distributor/:path*` prefix behind
`isStaffAuthenticated` — the new route falls under that automatically. No middleware changes
needed.

---

## 4. Explicit Non-Goals / Do-Not-Touch List

- Do **not** create a separate `distributors` table or a `Distributor` entity. "Distributor"
  is purely a UI/business label for a root-level `sub_brokers` row, exactly as the existing
  `frontend/src/app/distributor/users/page.tsx` `extractRole()` helper already treats it.
- Do **not** touch `CommissionMapping` logic — revenue share is unrelated to investor
  allotment and out of scope here.
- Do **not** change the one-active-mapping-per-investor business rule (an investor cannot be
  simultaneously live-mapped to two different brokers). If SP wants many-to-many mapping in
  future, that's a separate, larger change — flag it as a question rather than silently
  implementing it.
- Do **not** cascade-delete `sub_brokers.user_id` on user deletion — use `ON DELETE SET NULL`
  as specified in Task 1.1, so historical hierarchy/commission data for a removed login isn't
  destroyed.
- Do **not** modify `investor-mapping.dto.ts` — the existing `AssignInvestorsDto`/
  `UnassignInvestorsDto` shapes are correct and sufficient as-is.
- Do **not** touch anything under `app/admin`, `app/investor`, or `finiq-api`'s
  `investor-auth` module — this feature is exclusively a distributor-portal / staff-side
  (`COMPANY_ADMIN` / `BROKER` / `SUB_BROKER`) feature. Investors themselves never see or
  interact with this screen.

---

## 5. Suggested Build & Verification Order

1. Schema: run 1.1–1.3, report backfill counts back to SP before proceeding.
2. Backend entity + creation-path change (2.1, 2.2) — verify a freshly created sub-broker via
   the existing `/api/admin/users` POST endpoint now gets a `user_id` stamped in the DB.
3. Backend JWT payload change (2.3) — log in as a BROKER or SUB_BROKER test user, decode the
   returned `access_token` (jwt.io or `decodeJwt` in a scratch script), confirm
   `roles[].sub_broker_id` is present and correct.
4. Backend service + controller rewrite (2.4–2.6) — test with Postman/curl as all three roles
   before touching the frontend at all:
   - COMPANY_ADMIN: can list all brokers, all investors, assign/unassign anywhere in company.
   - BROKER: `brokers` list is self+downline only; `investors` list excludes out-of-scope
     mapped investors; assign/unassign to an out-of-scope `sub_broker_id` returns 403.
   - SUB_BROKER with no children: `brokers` list contains only self; assign to self works;
     assign to any other id in the company (even a sibling sub-broker) returns 403.
5. Frontend service methods (3.1) + confirm proxying works (3.2) before building UI.
6. Frontend page (3.4) end-to-end for COMPANY_ADMIN first, then re-verify the same screen
   logged in as BROKER and SUB_BROKER test accounts to confirm the scoping is visibly correct
   (not just theoretically correct from the API).
7. Sidebar entry (3.5) last, once the page itself is confirmed working, so it's never linked
   to a broken/incomplete screen mid-build.

---

## 6. Open Questions for SP (do not guess — ask or leave a clear TODO comment in code)

1. Should a `COMPANY_ADMIN` be able to move an investor from one distributor's downline to a
   *completely unrelated* distributor's downline in a single action (this guide assumes yes,
   since COMPANY_ADMIN has `allowedSubBrokerIds = null`, unrestricted) — confirm this matches
   intent, since it's a meaningful cross-branch data move.
2. Should `BROKER`/`SUB_BROKER` be able to see *which* other branch an out-of-scope investor
   is currently mapped to (even if they can't touch it), or should out-of-scope-mapped
   investors be fully invisible to them in the "Unmapped" list? This guide's
   `getInvestors()` currently only ever returns unmapped-or-in-scope investors to non-admins
   (out-of-scope-mapped investors are filtered out entirely, never shown) — confirm that's the
   desired privacy boundary.
3. Confirm whether historical `sub_brokers` rows that fail the email-backfill in Task 1.2
   (and thus remain `user_id IS NULL`) need a manual data-fix pass from SP, or whether it's
   acceptable for those specific brokers to simply be unable to use this screen (as
   COMPANY_ADMIN still can, on their behalf) until fixed.
