"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Server,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  HardDrive,
  Workflow,
  Search,
  Filter,
  Lock,
  PieChart,
  Wallet,
  Users,
  FileSpreadsheet,
  Building2,
  FileText,
  Sliders,
  Send,
  Zap,
  Info,
  Check,
} from "lucide-react";

interface ApiDocumentationItem {
  id: string;
  category:
    | "auth"
    | "portfolio"
    | "tax"
    | "distributor"
    | "systematic"
    | "banking"
    | "ingestion"
    | "telemetry";
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  name: string;
  purpose: string;
  authGuard: string;
  requestContract: string;
  responseContract: string;
  underTheHoodWorkflow: string;
}

const API_DOCUMENTARY_ENTRIES: ApiDocumentationItem[] = [
  // ─── 1. AUTHENTICATION & RBAC ──────────────────────────────────────────
  {
    id: "auth-investor-login",
    category: "auth",
    method: "POST",
    path: "/api/investor-auth/login",
    name: "Investor Passwordless / Password Authentication",
    purpose:
      "Authenticates retail investors using their registered PAN, email, or mobile identifier. Issues a scoped JWT token encoding investor ID, tenant scope, and investor-level role permissions.",
    authGuard: "Public (Rate Limited: 5 req/min)",
    requestContract: `{
  "identifier": "aarav.mehta@example.com", // PAN, Email, or Phone
  "password": "••••••••••••"
}`,
    responseContract: `{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "expires_in": 3600,
    "investor": {
      "id": "inv-001",
      "name": "Aarav Mehta",
      "email": "aarav.mehta@example.com",
      "company_id": "comp-fin-001"
    }
  }
}`,
    underTheHoodWorkflow:
      "1. Validates payload schema with class-validator. 2. Hashes incoming credentials and executes indexed lookup on the Investor entity. 3. Signs JWT containing investor claims and company tenant ID. 4. Dispatches an audit event to the security logger.",
  },
  {
    id: "auth-distributor-otp",
    category: "auth",
    method: "POST",
    path: "/api/auth/send-otp",
    name: "Distributor Multi-Factor OTP Dispatch",
    purpose:
      "Initiates multi-factor authentication for distributors and sub-brokers by dispatching an encrypted 6-digit one-time code to their verified mobile phone number.",
    authGuard: "Public (SMS Rate Limited)",
    requestContract: `{
  "phoneNumber": "+919876500002"
}`,
    responseContract: `{
  "success": true,
  "message": "OTP successfully dispatched to registered mobile number",
  "data": {
    "sessionId": "otp_sess_9a8f2e4c",
    "expiresInSeconds": 300
  }
}`,
    underTheHoodWorkflow:
      "1. Verifies the phone number belongs to an active staff/distributor record. 2. Generates an encrypted 6-digit TOTP with a 5-minute TTL stored in Redis. 3. Enqueues an SMS notification task in BullMQ to communicate with the SMS gateway.",
  },
  {
    id: "auth-distributor-verify",
    category: "auth",
    method: "POST",
    path: "/api/auth/verify-otp",
    name: "Distributor OTP Verification & Session Issuance",
    purpose:
      "Validates the distributor's one-time code against Redis, returning staff access tokens and company branding metadata.",
    authGuard: "Public (OTP Session Guard)",
    requestContract: `{
  "phoneNumber": "+919876500002",
  "otp": "482910"
}`,
    responseContract: `{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "refresh_token": "ref_9a8f2e4c...",
    "user": {
      "id": "usr-dist-01",
      "name": "Rajesh Sharma",
      "role": "distributor",
      "sub_broker_id": "sb-master-01",
      "company_id": "comp-fin-001"
    }
  }
}`,
    underTheHoodWorkflow:
      "1. Atomically reads and deletes the OTP key from Redis to prevent replay attacks. 2. Retrieves distributor hierarchy role and assigned sub-broker node. 3. Generates short-lived access JWT and cryptographically secure refresh token in PostgreSQL.",
  },

  // ─── 2. INVESTOR PORTFOLIO & HOLDINGS ──────────────────────────────────
  {
    id: "investor-portfolio-summary",
    category: "portfolio",
    method: "GET",
    path: "/api/investors/portfolio-summary",
    name: "Investor Consolidated Portfolio Summary",
    purpose:
      "Aggregates total invested principal, current market valuation, absolute returns, XIRR, and asset allocation percentages (Equity vs. Debt vs. Hybrid) for the authenticated investor.",
    authGuard: "JWT Bearer (Role: Investor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?currency=INR`,
    responseContract: `{
  "success": true,
  "data": {
    "investor_id": "inv-001",
    "total_invested": 14200000,
    "current_value": 18540000,
    "total_gain": 4340000,
    "gain_percentage": 30.56,
    "xirr": 14.82,
    "asset_allocation": {
      "equity": 68.5,
      "debt": 24.0,
      "hybrid": 5.5,
      "cash": 2.0
    }
  }
}`,
    underTheHoodWorkflow:
      "1. Extracts investor identity from JWT claims. 2. Queries active folio balances joining current AMFI Net Asset Values (NAV). 3. Computes weighted internal rate of return (XIRR) using the Newton-Raphson approximation algorithm over transaction cash flows.",
  },
  {
    id: "investor-holdings-list",
    category: "portfolio",
    method: "GET",
    path: "/api/investors/holdings",
    name: "Investor Granular Fund Holdings & Folio Breakdown",
    purpose:
      "Lists every mutual fund scheme held by the investor, including units, purchase NAV, latest NAV, folio numbers, and unrealized profit/loss.",
    authGuard: "JWT Bearer (Role: Investor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?folio=all&status=ACTIVE`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "id": "hld-01",
      "fund_name": "Axis Bluechip Fund - Growth",
      "folio_number": "AX99201928",
      "units": 24800.5,
      "avg_buy_nav": 52.40,
      "current_nav": 68.20,
      "invested_amount": 1300000,
      "current_value": 1691394,
      "unrealized_gain": 391394,
      "gain_percentage": 30.15
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Performs an indexed join between `investor_folios`, `fund_schemes`, and `daily_nav_history`. 2. Applies current-day closing NAVs cached in Redis. 3. Formats precise unit quantities and localized currency amounts.",
  },

  // ─── 3. CAPITAL GAINS TAX ENGINE (FIFO) ─────────────────────────────────
  {
    id: "tax-capital-gains-fifo",
    category: "tax",
    method: "GET",
    path: "/api/tax/capital-gains",
    name: "FIFO Capital Gains Realized Tax Assessment",
    purpose:
      "Processes all realized redemption transactions using a strict First-In First-Out (FIFO) tax lot matching algorithm. Segregates gains into Short-Term (STCG) and Long-Term (LTCG), applying Indian Income Tax Section 112A rules and grandfathering relief.",
    authGuard: "JWT Bearer (Role: Investor | Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?financial_year=2024-2025&asset_class=EQUITY`,
    responseContract: `{
  "success": true,
  "data": {
    "financial_year": "2024-2025",
    "stcg_taxable_gain": 85400,
    "ltcg_total_gain": 342000,
    "ltcg_exempt_amount": 100000, // Sec 112A ₹1L relief
    "ltcg_taxable_gain": 242000,
    "total_tax_liability": 51340,
    "matched_lots": [
      {
        "scheme_name": "Parag Parikh Flexi Cap Fund",
        "sell_date": "2024-11-15",
        "units_sold": 500,
        "matched_buy_date": "2022-04-10",
        "holding_days": 949,
        "is_long_term": true,
        "gain": 42500
      }
    ]
  }
}`,
    underTheHoodWorkflow:
      "1. Fetches all purchase and sale lots ordered chronologically by transaction execution date. 2. The tax engine executes an in-memory queue matching sale units with earliest available acquisition tranches. 3. Inspects acquisition dates prior to Jan 31, 2018 to apply grandfathering formula: max(cost, min(fair_market_value, sale_price)). 4. Emits tax bracket breakdowns.",
  },
  {
    id: "tax-export-pdf",
    category: "tax",
    method: "POST",
    path: "/api/tax/download-capital-gains-report",
    name: "Tax P&L Statement & Form 16A PDF Generation",
    purpose:
      "Generates an official, auditor-ready Capital Gains Tax Statement PDF formatted with transaction-by-transaction lot matches for Chartered Accountants and tax filing.",
    authGuard: "JWT Bearer (Role: Investor | Distributor)",
    requestContract: `{
  "financialYear": "2024-2025",
  "format": "PDF",
  "includeGrandfatheringSchedule": true
}`,
    responseContract: `// Binary PDF Stream (Content-Type: application/pdf)
// In Demo Mode: Intercepted and generated client-side via jsPDF`,
    underTheHoodWorkflow:
      "1. Compiles the tax ledger. 2. In production, writes statement to AWS S3 and returns a signed pre-authenticated download URL. 3. In the demo export, the client-side API client intercepts this and synthesizes an authentic PDF directly in the browser.",
  },

  // ─── 4. DISTRIBUTOR OPERATIONS & MULTI-TIER BROKERAGE ──────────────────
  {
    id: "distributor-dashboard-summary",
    category: "distributor",
    method: "GET",
    path: "/api/distributors/dashboard-summary",
    name: "Distributor Institutional Metrics & Overview",
    purpose:
      "Delivers the distributor's key performance indicators: total Assets Under Management (AUM), monthly gross inflows, net commissions earned, active SIP book count, and client retention rates.",
    authGuard: "JWT Bearer (Role: Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?period=MTD`,
    responseContract: `{
  "success": true,
  "data": {
    "total_aum": 245000000,
    "active_clients": 18,
    "monthly_commission": 142500,
    "gross_inflow": 3850000,
    "sip_book_value": 485000,
    "active_sips_count": 42
  }
}`,
    underTheHoodWorkflow:
      "1. Resolves distributor's sub-broker node in the organization tree. 2. Performs a recursive CTE query traversing all nested sub-brokers and direct clients. 3. Aggregates live asset valuations and brokerage accruals.",
  },
  {
    id: "distributor-clients-list",
    category: "distributor",
    method: "GET",
    path: "/api/distributors/clients",
    name: "Distributor Client Registry & Portfolio Valuations",
    purpose:
      "Retrieves the paginated list of all high-net-worth clients mapped to this distributor, showing individual AUM, risk profile, active schemes count, and contact records.",
    authGuard: "JWT Bearer (Role: Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?limit=20&sort=aum_desc`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "id": "cl-001",
      "name": "Aarav Mehta",
      "email": "aarav.mehta@example.com",
      "aum": 18540000,
      "risk_profile": "Aggressive Growth",
      "assigned_sub_broker": "Apex Financial Services",
      "last_invested_date": "2026-05-10"
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Queries `distributor_client_mappings` with tenant isolation. 2. Joins client portfolio snapshots and sub-broker metadata. 3. Masks sensitive PII according to compliance and privacy protocols.",
  },
  {
    id: "distributor-hierarchy-earnings",
    category: "distributor",
    method: "GET",
    path: "/api/distributors/hierarchy-earnings",
    name: "Multi-Tier Sub-Broker Hierarchy & Commission Splits",
    purpose:
      "Visualizes the distributor's hierarchical network (Master Broker -> Franchise -> Sub-Broker -> Agent) and calculates tiered commission share percentages for trail brokerage.",
    authGuard: "JWT Bearer (Role: Distributor | Admin)",
    requestContract: `// Headers: Authorization: Bearer <token>`,
    responseContract: `{
  "success": true,
  "data": {
    "sub_broker_id": "sb-master-01",
    "name": "FinIQ Master Distributors",
    "tier_level": 1,
    "total_network_aum": 245000000,
    "direct_commission": 95400,
    "override_commission": 47100,
    "children": [
      {
        "sub_broker_id": "sb-tier2-01",
        "name": "Apex Wealth Partners",
        "tier_level": 2,
        "aum": 112000000,
        "share_percentage": 65.0
      }
    ]
  }
}`,
    underTheHoodWorkflow:
      "1. Executes a PostgreSQL recursive Common Table Expression (WITH RECURSIVE hierarchy_tree AS ...). 2. Computes the commission trail basis point split for each parent-child tier based on contractual fee sharing schedules.",
  },

  // ─── 5. SYSTEMATIC TRANSACTIONS (SIP / STP / SWP) ──────────────────────
  {
    id: "systematic-sips-list",
    category: "systematic",
    method: "GET",
    path: "/api/systematic-transactions/active-sips",
    name: "Systematic Investment Plan (SIP) Schedules & Mandates",
    purpose:
      "Fetches all recurring active SIPs, next installment execution dates, NACH mandate registration statuses, and historical debit success rates.",
    authGuard: "JWT Bearer (Role: Investor | Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "sip_id": "sip-001",
      "scheme_name": "Mirae Asset Large Cap Fund",
      "monthly_amount": 25000,
      "debit_day": 5,
      "next_debit_date": "2026-06-05",
      "mandate_status": "APPROVED",
      "bank_name": "Horizon National Bank",
      "total_installments_paid": 36
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Queries `systematic_mandates` joined with NPCI e-NACH status records. 2. Pre-calculates the next calendar debit date skipping banking holidays and weekends.",
  },
  {
    id: "systematic-stp-swp",
    category: "systematic",
    method: "GET",
    path: "/api/systematic-transactions/systematic-list",
    name: "Systematic Transfer (STP) & Systematic Withdrawal (SWP) Ledger",
    purpose:
      "Monitors automated transfers from liquid funds into equity growth schemes (STP) and recurring monthly pension-style cash withdrawals (SWP).",
    authGuard: "JWT Bearer (Role: Investor | Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>`,
    responseContract: `{
  "success": true,
  "data": {
    "stp_schedules": [
      {
        "id": "stp-01",
        "source_fund": "ICICI Prudential Liquid Fund",
        "target_fund": "ICICI Prudential Bluechip Fund",
        "frequency": "MONTHLY",
        "amount": 50000,
        "remaining_installments": 18
      }
    ],
    "swp_schedules": []
  }
}`,
    underTheHoodWorkflow:
      "1. Inspects active automated transfer instructions. 2. Validates source folio free unit balance against redemption thresholds before each execution cycle.",
  },

  // ─── 6. BANKING, LEDGER & SETTLEMENT ───────────────────────────────────
  {
    id: "banks-accounts-list",
    category: "banking",
    method: "GET",
    path: "/api/banks/accounts",
    name: "Linked Bank Accounts & Penny-Drop Verification",
    purpose:
      "Lists verified investor and distributor bank accounts with IFSC validation, mandate limits, and NPCI penny-drop name match statuses.",
    authGuard: "JWT Bearer (Role: Investor | Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "id": "bnk-01",
      "bank_name": "Horizon National Bank",
      "account_number": "••••••••5819",
      "ifsc_code": "HZNB0001928",
      "account_type": "SAVINGS",
      "penny_drop_status": "VERIFIED",
      "is_primary": true
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Queries `bank_accounts` table. 2. Masks account digits maintaining last 4 visible digits for PCI/RBI compliance. 3. Checks validation status against banking webhook callbacks.",
  },
  {
    id: "distributor-ledger",
    category: "banking",
    method: "GET",
    path: "/api/distributors/reports/ledger",
    name: "Distributor Accounting Ledger & Commission Disbursals",
    purpose:
      "Provides double-entry accounting records of gross trail brokerage accrued, TDS (Tax Deducted at Source) withholdings, and net bank settlements.",
    authGuard: "JWT Bearer (Role: Distributor)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?from=2026-01-01&to=2026-05-31`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "entry_id": "ldg-001",
      "date": "2026-05-01",
      "description": "Trail Brokerage - Axis AMC April 2026",
      "gross_credit": 42500,
      "tds_deducted": 2125,
      "net_settled": 40375,
      "status": "SETTLED"
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Aggregates monthly broker billing statements. 2. Applies Section 194H 5% TDS deduction. 3. Reconciles with NEFT/RTGS transaction IDs.",
  },

  // ─── 7. AUTOMATED RTA STATEMENT INGESTION (CAMS / KFINTECH) ────────────
  {
    id: "ingestion-cams-karvy",
    category: "ingestion",
    method: "POST",
    path: "/api/statements/upload-rta",
    name: "CAMS & KFintech RTA Statement Ingestion & Reconciliation",
    purpose:
      "Ingests raw WBR9, WBR2, and Karvy mailback feeds (DBF, Excel, CSV), extracting transaction rows, folio updates, and dividend reinvestments into the core database asynchronously.",
    authGuard: "JWT Bearer (Role: Distributor | Admin)",
    requestContract: `// Multipart Form Data:
// file: CAMS_WBR9_FEED_202605.csv
// rta_type: "CAMS"
// statement_type: "TRANSACTIONS"`,
    responseContract: `{
  "success": true,
  "data": {
    "job_id": "job_rta_991828",
    "status": "QUEUED",
    "total_records_detected": 1420,
    "message": "File accepted. BullMQ worker pipeline initiated in background."
  }
}`,
    underTheHoodWorkflow:
      "1. Streams file to private S3 bucket. 2. Pushes job onto Redis BullMQ `statement-processing` queue. 3. Worker streams chunks of 100 records, parsing PANs, folios, NAVs, and units into temporary staging tables. 4. Executes upserts with duplicate idempotency checks.",
  },
  {
    id: "ingestion-queue-status",
    category: "ingestion",
    method: "GET",
    path: "/api/statements/queue-status",
    name: "RTA Worker Pipeline Health & Processing Progress",
    purpose:
      "Polls or streams real-time status of asynchronous background parsing workers, error counts, and successfully reconciled folio count.",
    authGuard: "JWT Bearer (Role: Distributor | Admin)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?job_id=job_rta_991828`,
    responseContract: `{
  "success": true,
  "data": {
    "job_id": "job_rta_991828",
    "status": "COMPLETED",
    "processed_rows": 1420,
    "failed_rows": 0,
    "reconciled_folios": 18,
    "duration_seconds": 3.8
  }
}`,
    underTheHoodWorkflow:
      "1. Queries Redis job hash key. 2. Reports instantaneous worker progress metrics back to frontend progress bars.",
  },

  // ─── 8. PLATFORM TELEMETRY & MULTI-TENANT THEMING ──────────────────────
  {
    id: "themes-active",
    category: "telemetry",
    method: "GET",
    path: "/api/themes/active",
    name: "Multi-Tenant Dynamic Theme Configuration",
    purpose:
      "Retrieves the active tenant's customized color palette (brand scales, backgrounds, surfaces, buttons, borders). Injected as dynamic CSS variables to seamlessly style white-label partner instances.",
    authGuard: "Public / Tenant Scoped",
    requestContract: `// Headers: Authorization: Bearer <token> (Optional)`,
    responseContract: `{
  "success": true,
  "data": {
    "theme_name": "System Default",
    "active_theme_id": null,
    "theme_variables": {
      "--fin-brand-50": "#f0f4fa",
      "--fin-brand-600": "#3d60ab",
      "--fin-page-bg": "#f0f4fa"
    }
  }
}`,
    underTheHoodWorkflow:
      "1. Resolves tenant identifier from subdomain or user token. 2. Queries active tenant theme from PostgreSQL. 3. Caches payload in Redis and browser localStorage to prevent Flash of Unstyled Content (FOUC).",
  },
  {
    id: "admin-audit-logs",
    category: "telemetry",
    method: "GET",
    path: "/api/admin/audit-logs",
    name: "System-Wide Security Audits & Service Telemetry",
    purpose:
      "Streams structured application events, login attempts, background worker heartbeats, and database query latency metrics for infrastructure monitoring.",
    authGuard: "JWT Bearer (Role: SuperAdmin)",
    requestContract: `// Headers: Authorization: Bearer <token>
// Query params: ?level=ALL&limit=50`,
    responseContract: `{
  "success": true,
  "data": [
    {
      "id": "log-001",
      "timestamp": "2026-05-18T10:30:00Z",
      "service": "TaxEngineService",
      "level": "INFO",
      "message": "FIFO Capital gains batch processed for 18 folios in 12ms",
      "metadata": { "batch_size": 18, "latency_ms": 12 }
    }
  ]
}`,
    underTheHoodWorkflow:
      "1. Enforces strict SuperAdmin RBAC guard. 2. Retrieves telemetry records from time-series log tables indexed on timestamp and severity level.",
  },
];

export default function BackendArchitecturePage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApiId, setExpandedApiId] = useState<string | null>("tax-capital-gains-fifo");

  const categories = [
    { id: "all", label: "All APIs", count: API_DOCUMENTARY_ENTRIES.length },
    { id: "auth", label: "Auth & Identity", count: 3 },
    { id: "portfolio", label: "Investor Portfolios", count: 2 },
    { id: "tax", label: "Capital Gains FIFO", count: 2 },
    { id: "distributor", label: "Distributor & Hierarchy", count: 3 },
    { id: "systematic", label: "Systematic (SIP/STP)", count: 2 },
    { id: "banking", label: "Banking & Ledgers", count: 2 },
    { id: "ingestion", label: "RTA Ingestion Pipeline", count: 2 },
    { id: "telemetry", label: "Telemetry & Theming", count: 2 },
  ];

  const filteredApis = useMemo(() => {
    return API_DOCUMENTARY_ENTRIES.filter((api) => {
      const matchesCat = activeCategory === "all" || api.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg)] text-[var(--fin-heading-primary)] font-sans relative overflow-x-hidden p-6 sm:p-12">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[var(--fin-brand-500)]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-[var(--fin-brand-600)]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* ─── BREADCRUMB & HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--fin-border)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fin-muted-text)] mb-3">
              <Link href="/login" className="hover:text-[var(--fin-brand-600)] transition-colors">
                Portal Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--fin-brand-600)]">Backend Architecture Documentary</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--fin-brand-600)] to-[var(--fin-brand-800)] flex items-center justify-center text-white shadow-lg shadow-[var(--fin-brand-900)]/20">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--fin-heading-primary)]">
                  Backend Architecture & API Documentary
                </h1>
                <p className="text-sm text-[var(--fin-muted-text)] font-medium mt-1">
                  Comprehensive technical documentary of microservice pipelines, data flows, and endpoint specifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl bg-[var(--fin-brand-100)] hover:bg-[var(--fin-brand-200)] border border-[var(--fin-brand-300)] text-xs font-bold text-[var(--fin-brand-800)] transition-all flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Role Selector</span>
            </Link>
          </div>
        </div>

        {/* ─── ARCHITECTURAL BLUEPRINT (DOCUMENTARY SUMMARY) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--fin-heading-primary)]">
              Modular NestJS Core
            </h3>
            <p className="text-xs text-[var(--fin-muted-text)] leading-relaxed">
              Engineered using strict Domain-Driven Design (DDD). Decouples Controllers, Business Services, and Repositories with dependency injection and DTO validations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--fin-heading-primary)]">
              PostgreSQL Relational ACID
            </h3>
            <p className="text-xs text-[var(--fin-muted-text)] leading-relaxed">
              Normalized schema with foreign key constraints, composite b-tree indexes on transaction dates, and serializable transactions for ledger settlements.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--fin-heading-primary)]">
              FIFO Capital Gains Engine
            </h3>
            <p className="text-xs text-[var(--fin-muted-text)] leading-relaxed">
              In-memory lot matching algorithms implementing Indian Income Tax Section 112A equity regulations, grandfathering benchmarks, and indexation formulas.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--fin-heading-primary)]">
              Asynchronous BullMQ Workers
            </h3>
            <p className="text-xs text-[var(--fin-muted-text)] leading-relaxed">
              Redis-backed distributed worker queues process CAMS/KFintech WBR9 feeds and generate intensive PDF reports without blocking synchronous client threads.
            </p>
          </div>
        </div>

        {/* ─── SYSTEM DATA PIPELINE FLOW (VISUAL DOCUMENTARY) ─── */}
        <div className="p-8 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--fin-border)] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)] text-[10px] font-bold uppercase tracking-wider mb-1">
                Data Pipeline Flow
              </div>
              <h2 className="text-xl font-bold text-[var(--fin-heading-primary)]">
                End-to-End Architectural Lifecycle
              </h2>
            </div>
            <span className="text-xs text-[var(--fin-muted-text)]">
              Asynchronous Ingestion • FIFO Matching • Client Presentation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Step 1
                </span>
                <h4 className="text-sm font-bold text-[var(--fin-heading-primary)] mt-2">
                  RTA Feed Ingestion
                </h4>
                <p className="text-[11px] text-[var(--fin-muted-text)] mt-1">
                  Distributor uploads CAMS / Karvy WBR9 statement files or webhook trigger fires.
                </p>
              </div>
              <div className="text-[10px] text-[var(--fin-brand-700)] font-semibold mt-3 pt-2 border-t border-[var(--fin-border)]">
                API: /api/statements/upload-rta
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Step 2
                </span>
                <h4 className="text-sm font-bold text-[var(--fin-heading-primary)] mt-2">
                  BullMQ Queue Dispatch
                </h4>
                <p className="text-[11px] text-[var(--fin-muted-text)] mt-1">
                  File saved to S3. Worker pool streams rows in chunks of 100 with idempotency keys.
                </p>
              </div>
              <div className="text-[10px] text-[var(--fin-brand-700)] font-semibold mt-3 pt-2 border-t border-[var(--fin-border)]">
                Worker: StatementParserProcessor
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Step 3
                </span>
                <h4 className="text-sm font-bold text-[var(--fin-heading-primary)] mt-2">
                  Folio & Ledger Reconcile
                </h4>
                <p className="text-[11px] text-[var(--fin-muted-text)] mt-1">
                  Normalized transactions write to PostgreSQL folios and trail brokerage ledgers.
                </p>
              </div>
              <div className="text-[10px] text-[var(--fin-brand-700)] font-semibold mt-3 pt-2 border-t border-[var(--fin-border)]">
                Service: LedgerSettlementService
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Step 4
                </span>
                <h4 className="text-sm font-bold text-[var(--fin-heading-primary)] mt-2">
                  FIFO Tax Engine
                </h4>
                <p className="text-[11px] text-[var(--fin-muted-text)] mt-1">
                  Redemptions trigger chronological lot matching calculating STCG/LTCG tax brackets.
                </p>
              </div>
              <div className="text-[10px] text-[var(--fin-brand-700)] font-semibold mt-3 pt-2 border-t border-[var(--fin-border)]">
                API: /api/tax/capital-gains
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  Step 5
                </span>
                <h4 className="text-sm font-bold text-[var(--fin-heading-primary)] mt-2">
                  Client Presentation
                </h4>
                <p className="text-[11px] text-[var(--fin-muted-text)] mt-1">
                  Interactive Next.js UI queries APIs via fast JSON payloads with theme variables.
                </p>
              </div>
              <div className="text-[10px] text-[var(--fin-brand-700)] font-semibold mt-3 pt-2 border-t border-[var(--fin-border)]">
                Portals: Investor & Distributor
              </div>
            </div>
          </div>
        </div>

        {/* ─── API DOCUMENTARY CATALOG (ONE BY ONE) ─── */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)] text-[10px] font-bold uppercase tracking-wider mb-1">
                API Catalog Documentary
              </div>
              <h2 className="text-2xl font-bold text-[var(--fin-heading-primary)]">
                Platform API Specifications & Capabilities
              </h2>
              <p className="text-xs text-[var(--fin-muted-text)] mt-0.5">
                Inspect every endpoint used across the platform: method, path, business purpose, security guards, and schemas.
              </p>
            </div>

            {/* Live Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[var(--fin-muted-text)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search API path, name, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-xs text-[var(--fin-heading-primary)] placeholder-[var(--fin-muted-text)] focus:outline-none focus:border-[var(--fin-brand-600)] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Domain Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? "bg-[var(--fin-brand-600)] text-white shadow-md shadow-[var(--fin-brand-600)]/20"
                    : "bg-[var(--fin-table-bg)] text-[var(--fin-muted-text)] hover:text-[var(--fin-heading-primary)] border border-[var(--fin-border)] hover:bg-[var(--fin-brand-50)]"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === cat.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)]"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* API Entries List */}
          <div className="space-y-4">
            {filteredApis.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-muted-text)] text-sm">
                No APIs matched your filter criteria. Try searching for &quot;tax&quot;, &quot;holdings&quot;, or &quot;brokerage&quot;.
              </div>
            ) : (
              filteredApis.map((api) => {
                const isExpanded = expandedApiId === api.id;
                const methodBadgeColor = {
                  GET: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  POST: "bg-blue-100 text-blue-800 border-blue-200",
                  PUT: "bg-amber-100 text-amber-800 border-amber-200",
                  DELETE: "bg-rose-100 text-rose-800 border-rose-200",
                }[api.method];

                return (
                  <div
                    key={api.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                      isExpanded
                        ? "bg-[var(--fin-table-bg)] border-[var(--fin-brand-600)] shadow-md"
                        : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)]"
                    }`}
                  >
                    {/* Collapsible Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedApiId(isExpanded ? null : api.id)}
                      className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase border shrink-0 ${methodBadgeColor}`}
                        >
                          {api.method}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-bold text-[var(--fin-heading-primary)]">
                              {api.path}
                            </span>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-200)]">
                              {api.name}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--fin-muted-text)] mt-1 line-clamp-1">
                            {api.purpose}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] font-bold text-[var(--fin-brand-700)] bg-[var(--fin-brand-100)] px-2.5 py-1 rounded-full border border-[var(--fin-brand-200)]">
                          {api.authGuard}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 text-[var(--fin-muted-text)] transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-[var(--fin-brand-600)]" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded Documentary Details */}
                    {isExpanded && (
                      <div className="p-6 pt-0 border-t border-[var(--fin-border)] space-y-6 mt-2">
                        {/* Purpose Description */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fin-muted-text)] mb-1">
                            Business Purpose & Workflow
                          </h4>
                          <p className="text-xs sm:text-sm text-[var(--fin-heading-primary)] leading-relaxed">
                            {api.purpose}
                          </p>
                        </div>

                        {/* Under the Hood Processing */}
                        <div className="p-4 rounded-xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)]">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--fin-brand-800)] mb-1">
                            <Workflow className="w-4 h-4 text-[var(--fin-brand-600)]" />
                            <span>Backend Processing Pipeline</span>
                          </div>
                          <p className="text-xs text-[var(--fin-muted-text)] leading-relaxed">
                            {api.underTheHoodWorkflow}
                          </p>
                        </div>

                        {/* Request & Response Schemas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-[var(--fin-muted-text)] mb-2">
                              <span>Request Contract (Headers / Body)</span>
                              <span className="font-mono text-[10px] text-[var(--fin-brand-600)]">JSON / DTO</span>
                            </div>
                            <pre className="p-3.5 rounded-xl bg-[var(--fin-content-surface)] border border-[var(--fin-border)] font-mono text-[11px] text-[var(--fin-heading-primary)] overflow-x-auto leading-relaxed">
                              {api.requestContract}
                            </pre>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-[var(--fin-muted-text)] mb-2">
                              <span>Response Schema (Structured JSON)</span>
                              <span className="font-mono text-[10px] text-emerald-600">HTTP 200 OK</span>
                            </div>
                            <pre className="p-3.5 rounded-xl bg-[var(--fin-content-surface)] border border-[var(--fin-border)] font-mono text-[11px] text-[var(--fin-heading-primary)] overflow-x-auto leading-relaxed">
                              {api.responseContract}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── FOOTER & REPOSITORY PRIVACY NOTICE ─── */}
        <div className="p-6 rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--fin-heading-primary)]">
                Proprietary Codebase Protected • Public Architecture Documentary
              </p>
              <p className="text-[11px] text-[var(--fin-muted-text)]">
                This documentary illustrates technical capabilities, contracts, and system workflows without exposing internal backend repository source files.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-700)] text-white text-xs font-bold transition-all shadow-md shadow-[var(--fin-brand-600)]/20 whitespace-nowrap"
          >
            Launch Interactive Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
