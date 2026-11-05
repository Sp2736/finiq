// src/lib/apiClient.ts
/**
 * Fully Intercepted Client-Side API Adapter for FinIQ Demo
 *
 * Simulates a high-performance NestJS backend completely in-memory and
 * in sessionStorage, supporting live mutations, artificial latency (loading states),
 * and rich mock responses without needing an active backend server.
 */

import {
  mockDb,
  loadMockDb,
  getMockFundAnalytics,
  MOCK_ROLES,
  MOCK_HIERARCHY_DATA,
  INITIAL_ACTIVE_THEME,
  generateMockJwt,
} from "./mockDatabase";

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

const NETWORK_LATENCY_MS = 280;

function delay(ms = NETWORK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUrl(endpoint: string) {
  const clean = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const [path, queryStr] = clean.split("?");
  const query = new URLSearchParams(queryStr || "");
  const segments = path.split("/").filter(Boolean);
  return { path, query, segments };
}

/**
 * Generate a realistic downloadable PDF blob for demo report exports
 */
function generateDemoReportPdf(reportTitle: string, investorName = "Aarav Mehta"): Blob {
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 22 Tf
50 730 Td
(FINIQ WEALTH MANAGEMENT PORTFOLIO REPORT) Tj
/F2 12 Tf
0 -30 Td
(Generated on: ${today}) Tj
0 -20 Td
(Client: ${investorName} | PAN: ABCDE1234F | Status: Resident Individual) Tj
0 -30 Td
(--------------------------------------------------------------------------) Tj
0 -30 Td
(Report Type: ${reportTitle}) Tj
0 -20 Td
(Total Portfolio AUM: INR 54,80,250 | Net Gain: INR 12,30,250 [28.95%]) Tj
0 -20 Td
(XIRR Annualized Return: 19.8% | Active SIPs: 4 Schemes) Tj
0 -40 Td
(This is an authentic simulated document generated for demo evaluation.) Tj
0 -20 Td
(Platform: FinIQ Portfolio Suite | Architecture: NestJS + TypeORM + PostgreSQL) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000250 00000 n 
0000000680 00000 n 
0000000755 00000 n 
trailer << /Size 7 /Root 1 0 R >>
startxref
825
%%EOF`;

  return new Blob([pdfContent], { type: "application/pdf" });
}

/**
 * Core Request Router - Resolves all API endpoints to local mock database
 */
async function handleMockRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: any,
): Promise<T> {
  await delay();

  // Strip leading /api or / if present
  let normalized = endpoint;
  if (normalized.startsWith("/api/")) normalized = normalized.replace("/api/", "");
  if (normalized.startsWith("api/")) normalized = normalized.replace("api/", "");
  if (normalized.startsWith("/")) normalized = normalized.slice(1);

  const { path, query, segments } = parseUrl(normalized);
  const now = new Date().toISOString();

  // ─── 1. AUTHENTICATION ENDPOINTS ──────────────────────────────────────────
  if (path === "auth/send-otp") {
    return {
      success: true,
      message: "OTP sent successfully to registered mobile number",
      data: { message: "OTP 123456 generated" },
      timestamp: now,
    } as T;
  }

  if (path === "auth/verify-otp") {
    return {
      success: true,
      message: "Staff authentication successful",
      data: {
        access_token: MOCK_ROLES.distributor.token,
        refresh_token: "mock_refresh_token_staff",
        company_logo_url: null,
        company_info: {
          name: "FinIQ Wealth Partners",
          address: "Level 14, Tower B, Financial District, Mumbai 400051",
          email: "contact@finiq-wealth.example.com",
          phone: "+91 22 6800 0000",
        },
      },
      timestamp: now,
    } as T;
  }

  if (path === "auth/refresh") {
    return {
      success: true,
      message: "Session token refreshed",
      data: {
        access_token: MOCK_ROLES.distributor.token,
        refresh_token: "mock_refresh_token_staff",
      },
      timestamp: now,
    } as T;
  }

  if (path === "investor-auth/login") {
    return {
      success: true,
      message: "Investor authentication successful",
      data: {
        access_token: MOCK_ROLES.investor.token,
        logo_url: null,
        company_info: {
          name: "FinIQ Wealth Partners",
          address: "Level 14, Tower B, Financial District, Mumbai 400051",
          email: "contact@finiq-wealth.example.com",
          phone: "+91 22 6800 0000",
        },
      },
      timestamp: now,
    } as T;
  }

  // ─── 2. DISTRIBUTOR / HOLDINGS CACHE ──────────────────────────────────────
  if (path === "holdings-cache/top-contributors") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.topContributors,
      timestamp: now,
    } as T;
  }

  if (path === "holdings-cache/company-summary") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.summary,
      timestamp: now,
    } as T;
  }

  if (path.startsWith("holdings-cache/investors")) {
    const db = loadMockDb();
    const page = parseInt(query.get("page") || "1", 10);
    const limit = parseInt(query.get("limit") || "30", 10);
    const search = (query.get("search") || "").toLowerCase().trim();

    let filtered = db.investors;
    if (search) {
      filtered = filtered.filter(
        (inv) =>
          inv.name.toLowerCase().includes(search) ||
          inv.pan.toLowerCase().includes(search) ||
          inv.email.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      success: true,
      message: "Success",
      data: {
        data,
        total,
        page,
        limit,
        totalPages,
      },
      timestamp: now,
    } as T;
  }

  // ─── 3. INVESTOR PORTFOLIO & HOLDINGS ─────────────────────────────────────
  if (path === "investors/holdings" || (segments[0] === "investors" && segments[2] === "holdings")) {
    const db = loadMockDb();
    const investorId = segments[1] || "inv-001";
    const foundClient = db.investors.find((i) => i.id === investorId);

    if (foundClient && foundClient.id !== "inv-001") {
      // Scale portfolio values proportionally to client's AUM
      const ratio = foundClient.total_aum / 5480250;
      const scaledFunds = db.funds.map((f, idx) => ({
        ...f,
        invested_capital: Math.round(f.invested_capital * ratio),
        investedCapital: Math.round(f.investedCapital * ratio),
        current_value: Math.round(f.current_value * ratio),
        currentValue: Math.round(f.currentValue * ratio),
        totalCapital: Math.round(f.totalCapital * ratio),
        units: Math.round(f.units * ratio * 100) / 100,
        availableUnits: Math.round(f.availableUnits * ratio * 100) / 100,
        unrealised_gain: Math.round(f.unrealised_gain * ratio),
        unrealisedGain: Math.round(f.unrealisedGain * ratio),
        investorDetails: {
          ...f.investorDetails,
          name: foundClient.name,
          pan: foundClient.pan,
          taxStatus: foundClient.tax_status,
          dob: foundClient.date_of_birth,
        },
        contactDetails: {
          ...f.contactDetails,
          email: foundClient.email,
        },
      }));

      const invested = Math.round(db.portfolio.invested_capital * ratio);
      const current = foundClient.total_aum;
      const gain = current - invested;

      return {
        success: true,
        message: "Success",
        data: {
          ...db.portfolio,
          id: foundClient.id,
          investor_name: foundClient.name,
          clientName: foundClient.name,
          total_capital: current,
          invested_capital: invested,
          investedCapital: invested,
          current_value: current,
          currentValue: current,
          unrealised_gain: gain,
          unrealisedGain: gain,
          net_pl: gain,
          netPL: gain,
          funds: scaledFunds,
        },
        timestamp: now,
      } as T;
    }

    return {
      success: true,
      message: "Success",
      data: db.portfolio,
      timestamp: now,
    } as T;
  }

  // ─── 4. FUND ANALYTICS ───────────────────────────────────────────────────
  if (segments[0] === "fund-analytics") {
    const subRoute = segments[1];
    const amfiCode = segments[2] || "119551";
    const analytics = getMockFundAnalytics(amfiCode);

    if (subRoute === "returns") {
      return { success: true, data: analytics.returns, timestamp: now } as T;
    }
    if (subRoute === "monthly-returns") {
      return { success: true, data: analytics.monthlyReturns, timestamp: now } as T;
    }
    if (subRoute === "composition") {
      return { success: true, data: analytics.composition, timestamp: now } as T;
    }
    if (subRoute === "stylebox") {
      return { success: true, data: analytics.stylebox, timestamp: now } as T;
    }
    if (subRoute === "risk-stats") {
      return { success: true, data: analytics.riskStats, timestamp: now } as T;
    }
    if (subRoute === "sector-allocation") {
      return { success: true, data: analytics.sectorAllocation, timestamp: now } as T;
    }
    if (subRoute === "holdings") {
      return { success: true, data: analytics.holdings, timestamp: now } as T;
    }
  }

  // ─── 5. HIERARCHY EARNINGS ────────────────────────────────────────────────
  if (path.startsWith("brokerage-distribution/detailed-summary")) {
    return {
      success: true,
      message: "Success",
      data: MOCK_HIERARCHY_DATA,
      timestamp: now,
    } as T;
  }

  // ─── 6. BANK ACCOUNTS & LEDGER ────────────────────────────────────────────
  if (path === "admin/bank-accounts" || path === "bank-accounts") {
    if (method === "GET") {
      const db = loadMockDb();
      const subBrokerId = query.get("sub_broker_id");
      let list = db.bankAccounts;
      if (subBrokerId) {
        list = list.filter((b) => b.sub_broker_id === subBrokerId);
      }
      return {
        success: true,
        message: "Success",
        data: list,
        timestamp: now,
      } as T;
    }
    if (method === "POST") {
      const newAccount = {
        id: `ba-${Date.now().toString().slice(-4)}`,
        company_id: body.company_id || "comp-fin-001",
        arn_id: body.arn_id || "ARN-84920",
        sub_broker_id: body.sub_broker_id || null,
        bank_name: body.bank_name || "New Bank Account",
        account_number: `•••• ${String(body.account_number || "1234").slice(-4)}`,
        account_holder_name: body.account_holder_name || "Account Holder",
        ifsc_code: body.ifsc_code || "IFSC0001234",
        upi_id: body.upi_id || null,
        is_primary: !!body.is_primary,
        created_at: now,
      };
      mockDb.updateState((s) => ({
        ...s,
        bankAccounts: [newAccount, ...s.bankAccounts],
      }));
      return {
        success: true,
        message: "Bank account created successfully",
        data: newAccount,
        timestamp: now,
      } as T;
    }
  }

  if (path === "brokerage-distribution/ledger/summary") {
    const db = loadMockDb();
    const totalTransfers = db.ledgerEntries.reduce((sum, item) => sum + (item.transfer_amount || 0), 0);
    return {
      success: true,
      message: "Success",
      data: {
        total_transfers: totalTransfers,
        active_accounts: db.bankAccounts.length,
        pending_settlement: 18500,
      },
      timestamp: now,
    } as T;
  }

  if (segments[0] === "brokerage-distribution" && segments[1] === "ledger" && segments[2] === "transactions") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.ledgerEntries,
      timestamp: now,
    } as T;
  }

  if (path === "brokerage-distribution/ledger-entries") {
    if (method === "POST") {
      const db = loadMockDb();
      const src = db.bankAccounts.find((b) => b.id === body.source_account_id);
      const dst = db.bankAccounts.find((b) => b.id === body.destination_account_id);

      const newEntry = {
        id: `led-${Date.now().toString().slice(-4)}`,
        reference_id: body.reference_id || `UTR-${Date.now().toString().slice(-8)}`,
        source_account_id: body.source_account_id,
        destination_account_id: body.destination_account_id,
        source_account_name: src ? `${src.bank_name} (${src.account_number})` : "Source Account",
        destination_account_name: dst ? `${dst.bank_name} (${dst.account_number})` : "Destination Account",
        transfer_amount: Number(body.transfer_amount) || 0,
        payment_mode: body.payment_mode || "NEFT",
        status: "COMPLETED",
        created_at: now,
      };

      mockDb.updateState((s) => ({
        ...s,
        ledgerEntries: [newEntry, ...s.ledgerEntries],
      }));

      return {
        success: true,
        message: "Ledger entry recorded successfully",
        data: newEntry,
        timestamp: now,
      } as T;
    }
  }

  // ─── 7. SIP TRACKING & SYSTEMATIC TRANSACTIONS ────────────────────────────
  if (path.startsWith("sips/company/summary")) {
    const db = loadMockDb();
    const search = (query.get("search") || "").toLowerCase().trim();
    let breakdown = db.sipSummary.investor_breakdown;
    if (search) {
      breakdown = breakdown.filter((item) => item.investor_name.toLowerCase().includes(search));
    }
    return {
      success: true,
      message: "Success",
      data: {
        total_company_sips: db.sipSummary.total_company_sips,
        total_company_value: db.sipSummary.total_company_value,
        investor_breakdown: breakdown,
      },
      timestamp: now,
    } as T;
  }

  if (segments[0] === "sips" && segments[1] === "investor") {
    const db = loadMockDb();
    const sips = db.funds
      .filter((f) => f.sip_status === "Active")
      .map((f, i) => ({
        id: `sip-${f.amfi_code}-${i}`,
        source: (i % 2 === 0 ? "CAMS" : "KARVY") as "CAMS" | "KARVY",
        product_name: f.fund_name,
        folio_no: f.folio_number,
        installment_amount: 10000,
        frequency: "Monthly",
        status: "Active",
        start_date: f.purchase_date,
        end_date: null,
      }));
    return {
      success: true,
      message: "Success",
      data: sips,
      timestamp: now,
    } as T;
  }

  if (segments[0] === "sips" && segments[1] === "detail") {
    return {
      success: true,
      message: "Success",
      data: {
        rta: segments[2] || "CAMS",
        scheme_name: "FinIQ Horizon Bluechip Equity Fund - Direct Growth",
        folio_no: "FOL-892011/0",
        sip_amount: 15000,
        from_date: "2023-04-10",
        to_date: "2028-04-10",
        frequency: "Monthly",
        status: "Active",
        investor_name: "Aarav Mehta",
        remarks: "Active automated bank mandate via NACH/e-Mandate",
      },
      timestamp: now,
    } as T;
  }

  if (path === "sips/systematic-report" || path === "my-portfolio/systematic-report") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.systematicItems,
      timestamp: now,
    } as T;
  }

  // ─── 8. INVESTOR MAPPING ──────────────────────────────────────────────────
  if (path === "companies/investor-mapping/brokers") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.assignableBrokers,
      timestamp: now,
    } as T;
  }

  if (path.startsWith("companies/investor-mapping/investors")) {
    const db = loadMockDb();
    const status = query.get("status") || "all";
    const search = (query.get("search") || "").toLowerCase().trim();
    const brokerId = query.get("sub_broker_id");

    let list = db.mappableInvestors;
    if (status === "mapped") {
      list = list.filter((i) => !!i.current_sub_broker_id);
    } else if (status === "unmapped") {
      list = list.filter((i) => !i.current_sub_broker_id);
    }
    if (brokerId) {
      list = list.filter((i) => i.current_sub_broker_id === brokerId);
    }
    if (search) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          i.pan.toLowerCase().includes(search),
      );
    }

    return {
      success: true,
      message: "Success",
      data: {
        data: list,
        total: list.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
      timestamp: now,
    } as T;
  }

  if (path.startsWith("companies/investor-mapping/history")) {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: {
        data: db.mappingHistory,
        total: db.mappingHistory.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
      timestamp: now,
    } as T;
  }

  if (path === "companies/investor-mapping/assign") {
    const { investor_ids, sub_broker_id } = body;
    const db = loadMockDb();
    const broker = db.assignableBrokers.find((b) => b.id === sub_broker_id);
    const brokerName = broker ? broker.name : "Sub-Broker";

    const updatedMappable = db.mappableInvestors.map((inv) => {
      if (investor_ids.includes(inv.id)) {
        return {
          ...inv,
          current_sub_broker_id: sub_broker_id,
          current_sub_broker_name: brokerName,
        };
      }
      return inv;
    });

    const newHistoryEntries = investor_ids.map((id: string, i: number) => {
      const inv = db.mappableInvestors.find((item) => item.id === id);
      return {
        id: `hist-${Date.now()}-${i}`,
        action: "ASSIGNED",
        created_at: now,
        investor_name: inv ? inv.name : "Investor",
        investor_pan: inv ? inv.pan : "PAN-XXXXX",
        sub_broker_name: brokerName,
        performed_by_name: "Rajesh Sharma",
      };
    });

    mockDb.updateState((s) => ({
      ...s,
      mappableInvestors: updatedMappable,
      mappingHistory: [...newHistoryEntries, ...s.mappingHistory],
    }));

    return {
      success: true,
      message: "Investors assigned successfully",
      data: null,
      timestamp: now,
    } as T;
  }

  if (path === "companies/investor-mapping/unassign") {
    const { investor_ids } = body;
    const db = loadMockDb();

    const updatedMappable = db.mappableInvestors.map((inv) => {
      if (investor_ids.includes(inv.id)) {
        return {
          ...inv,
          current_sub_broker_id: null,
          current_sub_broker_name: null,
        };
      }
      return inv;
    });

    const newHistoryEntries = investor_ids.map((id: string, i: number) => {
      const inv = db.mappableInvestors.find((item) => item.id === id);
      return {
        id: `hist-un-${Date.now()}-${i}`,
        action: "UNASSIGNED",
        created_at: now,
        investor_name: inv ? inv.name : "Investor",
        investor_pan: inv ? inv.pan : "PAN-XXXXX",
        sub_broker_name: "Unassigned",
        performed_by_name: "Rajesh Sharma",
      };
    });

    mockDb.updateState((s) => ({
      ...s,
      mappableInvestors: updatedMappable,
      mappingHistory: [...newHistoryEntries, ...s.mappingHistory],
    }));

    return {
      success: true,
      message: "Investors unassigned successfully",
      data: null,
      timestamp: now,
    } as T;
  }

  // ─── 9. USER MANAGEMENT (SUB-BROKERS) ────────────────────────────────────
  if (path === "admin/users" || (segments[0] === "admin" && segments[1] === "users")) {
    if (method === "GET") {
      const db = loadMockDb();
      return {
        success: true,
        message: "Success",
        data: { sub_brokers: db.companyUsers },
        timestamp: now,
      } as T;
    }

    if (method === "POST") {
      const newUser = {
        id: `sb-team-${Date.now().toString().slice(-4)}`,
        name: body.name || "New Sub-Broker",
        email: body.email || "subbroker@example.com",
        role: body.role || "Sub-Broker",
        company_id: "comp-fin-001",
        arn_id: body.arn_id || "ARN-84920-NEW",
        parent_id: body.parent_id || "sb-master-01",
        parent_name: "Rajesh Sharma",
        share_percentage: body.share_percentage || 70,
        created_at: now,
      };

      mockDb.updateState((s) => ({
        ...s,
        companyUsers: [newUser, ...s.companyUsers],
      }));

      return {
        success: true,
        message: "User created successfully",
        data: newUser,
        timestamp: now,
      } as T;
    }

    if (method === "PUT") {
      const targetId = segments[2];
      mockDb.updateState((s) => ({
        ...s,
        companyUsers: s.companyUsers.map((u) =>
          u.id === targetId ? { ...u, ...body } : u,
        ),
      }));

      return {
        success: true,
        message: "User updated successfully",
        data: body,
        timestamp: now,
      } as T;
    }

    if (method === "DELETE") {
      const targetId = segments[2];
      mockDb.updateState((s) => ({
        ...s,
        companyUsers: s.companyUsers.filter((u) => u.id !== targetId),
      }));

      return {
        success: true,
        message: "User deleted successfully",
        data: null,
        timestamp: now,
      } as T;
    }
  }

  // ─── 10. THEMES API ───────────────────────────────────────────────────────
  if (path === "themes/active") {
    const db = loadMockDb();
    return {
      success: true,
      message: "Success",
      data: db.activeTheme,
      timestamp: now,
    } as T;
  }

  if (path === "themes/saved") {
    if (method === "GET") {
      const db = loadMockDb();
      return {
        success: true,
        message: "Success",
        data: db.savedThemes,
        timestamp: now,
      } as T;
    }

    if (method === "POST") {
      const newTheme = {
        id: `th-${Date.now().toString().slice(-4)}`,
        name: body.name || "Custom Palette",
        variables: body.variables || {},
      };
      mockDb.updateState((s) => ({
        ...s,
        savedThemes: [...s.savedThemes, newTheme],
      }));
      return {
        success: true,
        message: "Theme saved successfully",
        data: newTheme,
        timestamp: now,
      } as T;
    }
  }

  if (segments[0] === "themes" && segments[1] === "activate") {
    const themeId = segments[2];
    const db = loadMockDb();
    const targetTheme = db.savedThemes.find((th) => th.id === themeId);
    if (targetTheme) {
      mockDb.updateState((s) => ({
        ...s,
        activeTheme: {
          theme_name: targetTheme.name,
          active_theme_id: targetTheme.id,
          theme_variables: targetTheme.variables,
        },
      }));
    }
    return {
      success: true,
      message: "Theme activated",
      data: db.activeTheme,
      timestamp: now,
    } as T;
  }

  if (path === "themes/activate-default") {
    mockDb.updateState((s) => ({
      ...s,
      activeTheme: INITIAL_ACTIVE_THEME,
    }));
    return {
      success: true,
      message: "Default theme restored",
      data: INITIAL_ACTIVE_THEME,
      timestamp: now,
    } as T;
  }

  if (segments[0] === "themes" && segments[1] === "saved") {
    const themeId = segments[2];
    if (method === "PUT") {
      mockDb.updateState((s) => ({
        ...s,
        savedThemes: s.savedThemes.map((th) =>
          th.id === themeId
            ? { ...th, name: body.name || th.name, variables: body.variables || th.variables }
            : th,
        ),
      }));
      return { success: true, message: "Theme updated", data: null, timestamp: now } as T;
    }
    if (method === "DELETE") {
      mockDb.updateState((s) => ({
        ...s,
        savedThemes: s.savedThemes.filter((th) => th.id !== themeId),
      }));
      return { success: true, message: "Theme deleted", data: null, timestamp: now } as T;
    }
  }

  // ─── 11. COMPANY LOGO & METADATA ──────────────────────────────────────────
  if (segments[0] === "companies" && segments[2] === "logo-url") {
    return {
      success: true,
      message: "Success",
      data: { logo_url: null },
      timestamp: now,
    } as T;
  }

  // Fallback for any unmatched request
  return {
    success: true,
    message: "Operation completed",
    data: null,
    timestamp: now,
  } as T;
}

export const apiClient = {
  get: <T>(endpoint: string, _options?: RequestInit) =>
    handleMockRequest<T>("GET", endpoint),

  post: <T>(endpoint: string, data: any, _options?: RequestInit) =>
    handleMockRequest<T>("POST", endpoint, data),

  put: <T>(endpoint: string, data: any, _options?: RequestInit) =>
    handleMockRequest<T>("PUT", endpoint, data),

  delete: <T>(endpoint: string, _options?: RequestInit) =>
    handleMockRequest<T>("DELETE", endpoint),

  /**
   * Report Export Interceptor - Generates real, downloadable PDF files
   */
  postForFile: async (
    endpoint: string,
    data: any,
    fallbackFilename = "FinIQ_Report.pdf",
    _options?: RequestInit,
  ): Promise<DownloadedFile> => {
    await delay();

    let title = "Portfolio Valuation Statement";
    let filename = fallbackFilename;

    if (endpoint.includes("capital-gains")) {
      title = "Capital Gains Tax Statement (FIFO Indexation)";
      filename = fallbackFilename || "Capital_Gains_Statement.pdf";
    } else if (endpoint.includes("transactions")) {
      title = "Transaction Ledger & Historical Statement";
      filename = fallbackFilename || "Transaction_Report.pdf";
    } else if (endpoint.includes("systematic-report")) {
      title = "Systematic Investment Plans (SIP/STP/SWP) Audit";
      filename = fallbackFilename || "Systematic_Transactions_Report.pdf";
    } else if (endpoint.includes("holdings")) {
      title = "Holdings Valuation & Asset Allocation Report";
      filename = fallbackFilename || "Holdings_Valuation_Report.pdf";
    }

    const investorName = data?.investorLabel || data?.investor_name || "Aarav Mehta";
    const blob = generateDemoReportPdf(title, investorName);

    return { blob, filename };
  },
};
