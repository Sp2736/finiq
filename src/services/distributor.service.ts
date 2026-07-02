import { apiClient } from "@/lib/apiClient";

export interface TopContributor {
  id: string;
  name: string;
  pan: string;
  total_current: number;
  total_invested: number;
  notional_pl: number;
  abs_pct: number;
}

export interface CompanySummary {
  total_invested: number;
  total_current: number;
  investor_count: number;
}

export interface Investor {
  id: string;
  name: string;
  tax_status: string;
  pan: string;
  email: string;
  login_identifier: string;
  date_of_birth: string;
  total_aum: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  company_id?: string;
  arn_id: string | null;
  parent_id: string | null;
  parent_name: string | null;
  share_percentage: number | null;
  created_at: string;
}

export interface CompanyUserPayload {
  company_id?: string;
  email?: string;
  phone_number: string;
  role: string;
  name: string;
  arn_id: string;
  parent_id: string | null;
  share_percentage: number | null;
}

export interface CompanyUsersResponse {
  sub_brokers: CompanyUser[];
}

export interface CapitalGainsPayload {
  investor_id: string;
  start_date: string;
  end_date: string;
}

// ─── NEW INTERFACES FOR LEDGER & BANK ACCOUNTS ───
export interface BankAccount {
  id: string;
  company_id: string;
  arn_id: string | null;
  sub_broker_id: string | null;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  upi_id: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface BankAccountPayload {
  company_id: string;
  arn_id: string | null;
  sub_broker_id: string | null;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  upi_id: string | null;
  is_primary: boolean;
}

export interface LedgerEntryPayload {
  source_account_id: string;
  destination_account_id: string;
  payment_mode: string;
  transfer_amount: number;
  reference_id: string;
}

export interface SipSummary {
  total_company_sips: number;
  total_company_value: number;
  investor_breakdown: {
    investor_id: string;
    investor_name: string;
    total_sips: number;
    total_sip_value: number;
  }[];
}

export interface InvestorSip {
  id: string;
  source: "CAMS" | "KARVY";
  product_name: string;
  folio_no: string;
  installment_amount: number;
  frequency: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface SipDetail {
  rta: string;
  scheme_name: string;
  folio_no: string;
  sip_amount: number;
  from_date: string;
  to_date: string;
  frequency: string;
  status: string;
  investor_name: string;
  remarks?: string;
}

export interface SystematicReportPayload {
  types: string[];
}

export interface SystematicReportItem {
  trxn_no: string;
  folio_number: string;
  scheme_name: string;
  investor_name: string;
  amount: number;
  start_date: string;
  end_date: string;
  target_scheme: string | null;
  systematic_type: string;
  source: string;
  termination_date: string | null;
  amc_name: string;
}

// ─── INVESTOR MAPPING INTERFACES ───
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
  action: string;
  created_at: string;
  investor_name: string;
  investor_pan: string;
  sub_broker_name: string;
  performed_by_name: string;
}

const analyticsApiCache = new Map<string, Promise<any>>();

const cachedApiGet = (url: string) => {
  if (analyticsApiCache.has(url)) {
    return analyticsApiCache.get(url)!;
  }
  const promise = apiClient.get(url);
  analyticsApiCache.set(url, promise);
  promise.catch(() => analyticsApiCache.delete(url));
  return promise;
};

export const distributorService = {
  getTopContributors: async (): Promise<ApiResponse<TopContributor[]>> => {
    return apiClient.get<ApiResponse<TopContributor[]>>(
      "/holdings-cache/top-contributors",
    );
  },
  getCompanySummary: async (): Promise<ApiResponse<CompanySummary>> => {
    return apiClient.get<ApiResponse<CompanySummary>>(
      "/holdings-cache/company-summary",
    );
  },

  getInvestors: async (
    page: number = 1,
    limit: number = 30,
    search: string = "",
  ): Promise<ApiResponse<PaginatedResponse<Investor>>> => {
    let url = `/holdings-cache/investors?page=${page}&limit=${limit}`;
    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return apiClient.get<ApiResponse<PaginatedResponse<Investor>>>(url);
  },

  downloadInvestorList: async (
    page: number = 1,
    limit: number = 100,
    search: string = "",
  ): Promise<ApiResponse<PaginatedResponse<Investor>>> => {
    let url = `/holdings-cache/investors?page=${page}&limit=${limit}`;
    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return apiClient.get<ApiResponse<PaginatedResponse<Investor>>>(url);
  },

  // Fetches the entire investor list in one bulk call instead of paging.
  // A cheap probe (limit=1) tells us the true total, then a single request
  // sized to that total pulls everything — no fixed page-size cap anywhere.
  getAllInvestors: async (
    search: string = "",
  ): Promise<ApiResponse<PaginatedResponse<Investor>>> => {
    const probe = await distributorService.downloadInvestorList(1, 1, search);
    const total = probe?.data?.total ?? 0;
    if (total <= 0) return probe;
    return distributorService.downloadInvestorList(1, total, search);
  },

  // for hierarchy earnings page
  getBrokerageSummary: async (
    fromDate: string,
    toDate: string,
    groupBy: string = "AMC",
  ): Promise<ApiResponse<any>> => {
    const query = new URLSearchParams({ fromDate, toDate });
    if (
      groupBy.toLowerCase() === "client" ||
      groupBy.toLowerCase() === "investor" ||
      groupBy.toLowerCase() === "family"
    ) {
      query.append("groupBy", "investor");
    }
    return apiClient.get<ApiResponse<any>>(
      `/brokerage-distribution/detailed-summary?${query.toString()}`,
    );
  },

  getClientPortfolio: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(`/investors/${id}/holdings`);
  },

  // for user management page
  getCompanyUsers: async (): Promise<ApiResponse<CompanyUsersResponse>> => {
    return apiClient.get<ApiResponse<CompanyUsersResponse>>("/admin/users");
  },

  createCompanyUser: async (
    data: CompanyUserPayload,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>("/admin/users", data);
  },

  updateCompanyUser: async (
    id: string,
    data: CompanyUserPayload,
  ): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(`/admin/users/${id}`, data);
  },

  deleteCompanyUser: async (id: string) => {
    return apiClient.delete(`/admin/users/${id}`);
  },

  // for fund analytics modal

  getFundReturns: async (amfiCode: string) => {
    const response = await cachedApiGet(`/fund-analytics/returns/${amfiCode}`);
    return response.data;
  },
  getFundMonthlyReturns: async (amfiCode: string) => {
    const response = await cachedApiGet(
      `/fund-analytics/monthly-returns/${amfiCode}`,
    );
    return response.data;
  },
  getFundComposition: async (amfiCode: string) => {
    const response = await cachedApiGet(
      `/fund-analytics/composition/${amfiCode}`,
    );
    return response.data;
  },
  getFundStyleBox: async (amfiCode: string) => {
    const response = await cachedApiGet(`/fund-analytics/stylebox/${amfiCode}`);
    return response.data;
  },
  getFundRiskStats: async (amfiCode: string) => {
    const response = await cachedApiGet(
      `/fund-analytics/risk-stats/${amfiCode}`,
    );
    return response.data;
  },
  getFundSectorAllocation: async (amfiCode: string) => {
    const response = await cachedApiGet(
      `/fund-analytics/sector-allocation/${amfiCode}`,
    );
    return response.data;
  },
  getFundHoldings: async (amfiCode: string) => {
    const response = await cachedApiGet(`/fund-analytics/holdings/${amfiCode}`);
    return response.data;
  },

  // for the Broker Ledger page
  getBankAccounts: async (
    subBrokerId?: string,
  ): Promise<ApiResponse<BankAccount[]>> => {
    const url = subBrokerId
      ? `/admin/bank-accounts?sub_broker_id=${subBrokerId}`
      : "/admin/bank-accounts";
    return apiClient.get<ApiResponse<BankAccount[]>>(url);
  },

  addBankAccount: async (
    data: BankAccountPayload,
  ): Promise<ApiResponse<BankAccount>> => {
    return apiClient.post<ApiResponse<BankAccount>>(
      "/admin/bank-accounts",
      data,
    );
  },

  createBankAccount: async (bankData: any) => {
    // This now hits your secure NestJS backend instead of the local DB
    return apiClient.post("/bank-accounts", bankData);
  },

  addLedgerEntry: async (
    data: LedgerEntryPayload,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      "/brokerage-distribution/ledger-entries",
      data,
    );
  },

  getBrokerLedgerSummary: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(
      "/brokerage-distribution/ledger/summary",
    );
  },

  getBrokerTransactionHistory: async (
    subBrokerId: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(
      `/brokerage-distribution/ledger/transactions/${subBrokerId}`,
    );
  },

  // ─── SIP TRACKING ENDPOINTS ───

  getCompanySipSummary: async (
    search?: string,
  ): Promise<ApiResponse<SipSummary>> => {
    // Append the search query if it exists
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<ApiResponse<SipSummary>>(
      `/sips/company/summary${query}`,
    );
  },

  getInvestorSips: async (
    investorId: string,
  ): Promise<ApiResponse<InvestorSip[]>> => {
    return apiClient.get<ApiResponse<InvestorSip[]>>(
      `/sips/investor/${investorId}`,
    );
  },

  getSipDetail: async (
    source: string,
    id: string,
  ): Promise<ApiResponse<SipDetail>> => {
    return apiClient.get<ApiResponse<SipDetail>>(
      `/sips/detail/${source}/${id}`,
    );
  },

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

  // ─── INVESTOR MAPPING ENDPOINTS ───

  getAssignableBrokers: async (): Promise<ApiResponse<AssignableBroker[]>> => {
    return apiClient.get<ApiResponse<AssignableBroker[]>>(
      "/companies/investor-mapping/brokers",
    );
  },

  getMappableInvestors: async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    status: "all" | "mapped" | "unmapped" = "all",
    sub_broker_id?: string,
  ): Promise<ApiResponse<PaginatedResponse<MappableInvestor>>> => {
    let url = `/companies/investor-mapping/investors?page=${page}&limit=${limit}&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sub_broker_id) url += `&sub_broker_id=${sub_broker_id}`;
    return apiClient.get<ApiResponse<PaginatedResponse<MappableInvestor>>>(url);
  },

  getMappingHistory: async (
    page: number = 1,
    limit: number = 20,
    sub_broker_id?: string,
  ): Promise<ApiResponse<PaginatedResponse<MappingHistoryEntry>>> => {
    let url = `/companies/investor-mapping/history?page=${page}&limit=${limit}`;
    if (sub_broker_id) url += `&sub_broker_id=${sub_broker_id}`;
    return apiClient.get<ApiResponse<PaginatedResponse<MappingHistoryEntry>>>(
      url,
    );
  },

  assignInvestors: async (
    investor_ids: string[],
    sub_broker_id: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      "/companies/investor-mapping/assign",
      {
        investor_ids,
        sub_broker_id,
      },
    );
  },

  unassignInvestors: async (
    investor_ids: string[],
    sub_broker_id: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      "/companies/investor-mapping/unassign",
      {
        investor_ids,
        sub_broker_id,
      },
    );
  },
};
