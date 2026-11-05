// src/lib/mockDatabase.ts
/**
 * 100% Client-Side Mock Database for FinIQ Demo
 *
 * CRITICAL DATA RULE:
 * Strictly fictional dummy data. Under no circumstances are real names,
 * real PAN numbers, real email addresses, or real financial figures used.
 */

export interface MockUserSession {
  user_id: string;
  name: string;
  role: "admin" | "distributor" | "investor";
  phone_number?: string;
  mobile?: string;
  email?: string;
  arn_id?: string;
  company_id: string;
  company_name: string;
  sub_broker_id?: string;
  investor_id?: string;
  token: string;
}

// Helper to generate a fake JWT that our client-side decodeJwt() parses properly
export function generateMockJwt(payload: Record<string, any>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
    ...payload,
  };

  const b64 = (obj: any) => {
    try {
      const jsonStr = JSON.stringify(obj);
      if (typeof window !== "undefined") {
        return btoa(unescape(encodeURIComponent(jsonStr)))
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
      }
      return Buffer.from(jsonStr).toString("base64url");
    } catch {
      return "dummy";
    }
  };

  return `${b64(header)}.${b64(fullPayload)}.mock_signature_${now}`;
}

export const MOCK_ROLES: Record<string, MockUserSession> = {
  admin: {
    user_id: "usr-admin-01",
    name: "Alex Morgan",
    role: "admin",
    phone_number: "+91 99000 00001",
    company_id: "comp-fin-001",
    company_name: "FinIQ Wealth Partners",
    token: generateMockJwt({
      sub: "usr-admin-01",
      phone_number: "+91 99000 00001",
      company_id: "comp-fin-001",
      roles: [
        {
          id: "role-admin-01",
          role: "admin",
          tenant_id: "tenant-corp-01",
          company_id: "comp-fin-001",
          company_name: "FinIQ Wealth Partners",
          first_name: "Alex",
          last_name: "Morgan",
        },
      ],
    }),
  },
  distributor: {
    user_id: "usr-dist-01",
    name: "Rajesh Sharma",
    role: "distributor",
    phone_number: "+91 98765 00002",
    arn_id: "ARN-84920",
    company_id: "comp-fin-001",
    company_name: "FinIQ Wealth Partners",
    sub_broker_id: "sb-master-01",
    token: generateMockJwt({
      sub: "usr-dist-01",
      phone_number: "+91 98765 00002",
      company_id: "comp-fin-001",
      roles: [
        {
          id: "role-dist-01",
          role: "distributor",
          tenant_id: "tenant-corp-01",
          company_id: "comp-fin-001",
          company_name: "FinIQ Wealth Partners",
          first_name: "Rajesh",
          last_name: "Sharma",
          sub_broker_id: "sb-master-01",
        },
      ],
    }),
  },
  investor: {
    user_id: "usr-inv-01",
    investor_id: "inv-001",
    name: "Aarav Mehta",
    role: "investor",
    mobile: "+91 98765 43210",
    email: "aarav.mehta@example.com",
    company_id: "comp-fin-001",
    company_name: "FinIQ Wealth Partners",
    token: generateMockJwt({
      investor_id: "inv-001",
      mobile: "+91 98765 43210",
      username: "aarav.mehta",
      email: "aarav.mehta@example.com",
      company_id: "comp-fin-001",
      name: "Aarav Mehta",
    }),
  },
};

// ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
const INITIAL_DISTRIBUTOR_SUMMARY = {
  total_invested: 31300000,
  total_current: 40340250,
  investor_count: 18,
};

const INITIAL_TOP_CONTRIBUTORS = [
  {
    id: "inv-001",
    name: "Aarav Mehta",
    pan: "ABCDE1234F",
    total_current: 5480250,
    total_invested: 4250000,
    notional_pl: 1230250,
    abs_pct: 28.95,
  },
  {
    id: "inv-002",
    name: "Priya Sharma",
    pan: "BCDEF2345G",
    total_current: 4620000,
    total_invested: 3500000,
    notional_pl: 1120000,
    abs_pct: 32.0,
  },
  {
    id: "inv-003",
    name: "Rohan Verma",
    pan: "CDEFG3456H",
    total_current: 3450000,
    total_invested: 2800000,
    notional_pl: 650000,
    abs_pct: 23.21,
  },
  {
    id: "inv-004",
    name: "Ananya Iyer",
    pan: "DEFGH4567I",
    total_current: 8150000,
    total_invested: 6200000,
    notional_pl: 1950000,
    abs_pct: 31.45,
  },
  {
    id: "inv-005",
    name: "Vikram Patel",
    pan: "EFGHI5678J",
    total_current: 6320000,
    total_invested: 5100000,
    notional_pl: 1220000,
    abs_pct: 23.92,
  },
  {
    id: "inv-006",
    name: "Sunita Rao",
    pan: "FGHIJ6789K",
    total_current: 2480000,
    total_invested: 1950000,
    notional_pl: 530000,
    abs_pct: 27.18,
  },
  {
    id: "inv-007",
    name: "Kabir Malhotra",
    pan: "GHIJK7890L",
    total_current: 5890000,
    total_invested: 4400000,
    notional_pl: 1490000,
    abs_pct: 33.86,
  },
  {
    id: "inv-008",
    name: "Neha Kulkarni",
    pan: "HIJKL8901M",
    total_current: 3950000,
    total_invested: 3100000,
    notional_pl: 850000,
    abs_pct: 27.42,
  },
];

const INITIAL_INVESTORS = [
  {
    id: "inv-001",
    name: "Aarav Mehta",
    tax_status: "Resident Individual",
    pan: "ABCDE1234F",
    email: "aarav.mehta@example.com",
    login_identifier: "9876543210",
    date_of_birth: "1988-06-15",
    total_aum: 5480250,
  },
  {
    id: "inv-002",
    name: "Priya Sharma",
    tax_status: "Resident Individual",
    pan: "BCDEF2345G",
    email: "priya.sharma@example.com",
    login_identifier: "9876543211",
    date_of_birth: "1992-11-20",
    total_aum: 4620000,
  },
  {
    id: "inv-003",
    name: "Rohan Verma",
    tax_status: "Resident Individual",
    pan: "CDEFG3456H",
    email: "rohan.verma@example.com",
    login_identifier: "9876543212",
    date_of_birth: "1984-03-08",
    total_aum: 3450000,
  },
  {
    id: "inv-004",
    name: "Ananya Iyer",
    tax_status: "Non-Resident Indian (NRI)",
    pan: "DEFGH4567I",
    email: "ananya.iyer@example.com",
    login_identifier: "9876543213",
    date_of_birth: "1980-09-12",
    total_aum: 8150000,
  },
  {
    id: "inv-005",
    name: "Vikram Patel",
    tax_status: "HUF",
    pan: "EFGHI5678J",
    email: "vikram.patel@example.com",
    login_identifier: "9876543214",
    date_of_birth: "1976-12-05",
    total_aum: 6320000,
  },
  {
    id: "inv-006",
    name: "Sunita Rao",
    tax_status: "Resident Individual",
    pan: "FGHIJ6789K",
    email: "sunita.rao@example.com",
    login_identifier: "9876543215",
    date_of_birth: "1995-01-28",
    total_aum: 2480000,
  },
  {
    id: "inv-007",
    name: "Kabir Malhotra",
    tax_status: "Resident Individual",
    pan: "GHIJK7890L",
    email: "kabir.malhotra@example.com",
    login_identifier: "9876543216",
    date_of_birth: "1987-07-19",
    total_aum: 5890000,
  },
  {
    id: "inv-008",
    name: "Neha Kulkarni",
    tax_status: "Resident Individual",
    pan: "HIJKL8901M",
    email: "neha.kulkarni@example.com",
    login_identifier: "9876543217",
    date_of_birth: "1991-04-03",
    total_aum: 3950000,
  },
  {
    id: "inv-009",
    name: "Devendra Joshi",
    tax_status: "Resident Individual",
    pan: "IJKLM9012N",
    email: "devendra.joshi@example.com",
    login_identifier: "9876543218",
    date_of_birth: "1982-10-14",
    total_aum: 1850000,
  },
  {
    id: "inv-010",
    name: "Meera Nambiar",
    tax_status: "Non-Resident Indian (NRI)",
    pan: "JKLMN0123O",
    email: "meera.nambiar@example.com",
    login_identifier: "9876543219",
    date_of_birth: "1989-08-22",
    total_aum: 2980000,
  },
  {
    id: "inv-011",
    name: "Arjun Kapoor",
    tax_status: "Resident Individual",
    pan: "KLMNO1234P",
    email: "arjun.kapoor@example.com",
    login_identifier: "9876543220",
    date_of_birth: "1993-05-30",
    total_aum: 2200000,
  },
  {
    id: "inv-012",
    name: "Kavita Deshmukh",
    tax_status: "Resident Individual",
    pan: "LMNOP2345Q",
    email: "kavita.deshmukh@example.com",
    login_identifier: "9876543221",
    date_of_birth: "1979-02-17",
    total_aum: 4100000,
  },
  {
    id: "inv-013",
    name: "Sanjay Singhania",
    tax_status: "Corporate / Trust",
    pan: "MNOPQ3456R",
    email: "sanjay.singhania@example.com",
    login_identifier: "9876543222",
    date_of_birth: "1973-11-09",
    total_aum: 7450000,
  },
  {
    id: "inv-014",
    name: "Pooja Bhatia",
    tax_status: "Resident Individual",
    pan: "NOPQR4567S",
    email: "pooja.bhatia@example.com",
    login_identifier: "9876543223",
    date_of_birth: "1996-09-01",
    total_aum: 1650000,
  },
  {
    id: "inv-015",
    name: "Rajiv Nanda",
    tax_status: "Resident Individual",
    pan: "OPQRS5678T",
    email: "rajiv.nanda@example.com",
    login_identifier: "9876543224",
    date_of_birth: "1985-12-25",
    total_aum: 3120000,
  },
  {
    id: "inv-016",
    name: "Shweta Sen",
    tax_status: "Resident Individual",
    pan: "PQRST6789U",
    email: "shweta.sen@example.com",
    login_identifier: "9876543225",
    date_of_birth: "1990-07-07",
    total_aum: 2840000,
  },
  {
    id: "inv-017",
    name: "Aditya Roy",
    tax_status: "Resident Individual",
    pan: "QRSTU7890V",
    email: "aditya.roy@example.com",
    login_identifier: "9876543226",
    date_of_birth: "1994-03-18",
    total_aum: 1920000,
  },
  {
    id: "inv-018",
    name: "Nandini Pillai",
    tax_status: "Resident Individual",
    pan: "RSTUV8901W",
    email: "nandini.pillai@example.com",
    login_identifier: "9876543227",
    date_of_birth: "1986-10-31",
    total_aum: 3680000,
  },
];

export const MOCK_FUNDS_DATA = [
  {
    amfi_code: "119551",
    amfiCode: "119551",
    folio_number: "FOL-892011/0",
    folioNo: "FOL-892011/0",
    fund_name: "FinIQ Horizon Bluechip Equity Fund - Direct Growth",
    fundName: "FinIQ Horizon Bluechip Equity Fund - Direct Growth",
    category: "Equity - Large Cap",
    amc: "FinIQ Asset Management",
    securityType: "Equity",
    statusTag: "SIP",
    sip_status: "Active",
    purchase_date: "2023-04-10",
    purchaseDate: "2023-04-10",
    invested_capital: 800000,
    investedCapital: 800000,
    current_value: 1184888,
    currentValue: 1184888,
    totalCapital: 1184888,
    units: 4820.537,
    availableUnits: 4820.537,
    current_nav: 245.8,
    currentNAV: 245.8,
    avg_nav: 165.95,
    avgNAV: 165.95,
    dividend_payout: 12000,
    dividendPayout: 12000,
    unrealised_gain: 384888,
    unrealisedGain: 384888,
    unrealised_gain_percent: 48.11,
    unrealisedGainPercent: 48.11,
    realised_gain: 65000,
    realisedGain: 65000,
    xirr: 24.3,
    oneDayChange: 8450,
    oneDayPercent: 0.72,
    valuationDate: "2026-11-04",
    avgHoldingDays: 580,
    transactions: [
      {
        id: "tx-001",
        transactionDate: "2023-04-10",
        transactionType: "PURCHASE",
        amount: 300000,
        sttCharges: 30,
        nav: 150.0,
        units: 2000.0,
        balanceUnits: 2000.0,
        holdingDays: 940,
        capitalGain: 0,
      },
      {
        id: "tx-002",
        transactionDate: "2023-10-15",
        transactionType: "SIP",
        amount: 250000,
        sttCharges: 25,
        nav: 175.0,
        units: 1428.571,
        balanceUnits: 3428.571,
        holdingDays: 752,
        capitalGain: 0,
      },
      {
        id: "tx-003",
        transactionDate: "2024-05-20",
        transactionType: "SIP",
        amount: 250000,
        sttCharges: 25,
        nav: 180.0,
        units: 1391.966,
        balanceUnits: 4820.537,
        holdingDays: 534,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
  {
    amfi_code: "119552",
    amfiCode: "119552",
    folio_number: "FOL-892011/1",
    folioNo: "FOL-892011/1",
    fund_name: "FinIQ Emerging Leaders Midcap Fund - Growth",
    fundName: "FinIQ Emerging Leaders Midcap Fund - Growth",
    category: "Equity - Mid Cap",
    amc: "FinIQ Asset Management",
    securityType: "Equity",
    statusTag: "SIP",
    sip_status: "Active",
    purchase_date: "2023-08-15",
    purchaseDate: "2023-08-15",
    invested_capital: 550000,
    investedCapital: 550000,
    current_value: 765417,
    currentValue: 765417,
    totalCapital: 765417,
    units: 2450.118,
    availableUnits: 2450.118,
    current_nav: 312.4,
    currentNAV: 312.4,
    avg_nav: 224.48,
    avgNAV: 224.48,
    dividend_payout: 0,
    dividendPayout: 0,
    unrealised_gain: 215417,
    unrealisedGain: 215417,
    unrealised_gain_percent: 39.17,
    unrealisedGainPercent: 39.17,
    realised_gain: 30000,
    realisedGain: 30000,
    xirr: 26.8,
    oneDayChange: 6200,
    oneDayPercent: 0.82,
    valuationDate: "2026-11-04",
    avgHoldingDays: 450,
    transactions: [
      {
        id: "tx-004",
        transactionDate: "2023-08-15",
        transactionType: "PURCHASE",
        amount: 300000,
        sttCharges: 30,
        nav: 210.0,
        units: 1428.571,
        balanceUnits: 1428.571,
        holdingDays: 812,
        capitalGain: 0,
      },
      {
        id: "tx-005",
        transactionDate: "2024-02-15",
        transactionType: "SIP",
        amount: 250000,
        sttCharges: 25,
        nav: 244.73,
        units: 1021.547,
        balanceUnits: 2450.118,
        holdingDays: 629,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
  {
    amfi_code: "119553",
    amfiCode: "119553",
    folio_number: "FOL-554109/3",
    folioNo: "FOL-554109/3",
    fund_name: "Apex Opportunities Multicap Fund - Direct Growth",
    fundName: "Apex Opportunities Multicap Fund - Direct Growth",
    category: "Equity - Multi Cap",
    amc: "Apex Asset Management",
    securityType: "Equity",
    statusTag: "Lump Sum",
    sip_status: "Inactive",
    purchase_date: "2023-02-20",
    purchaseDate: "2023-02-20",
    invested_capital: 900000,
    investedCapital: 900000,
    current_value: 1099525,
    currentValue: 1099525,
    totalCapital: 1099525,
    units: 6100.0,
    availableUnits: 6100.0,
    current_nav: 180.25,
    currentNAV: 180.25,
    avg_nav: 147.54,
    avgNAV: 147.54,
    dividend_payout: 5000,
    dividendPayout: 5000,
    unrealised_gain: 199525,
    unrealisedGain: 199525,
    unrealised_gain_percent: 22.17,
    unrealisedGainPercent: 22.17,
    realised_gain: 45000,
    realisedGain: 45000,
    xirr: 18.2,
    oneDayChange: 7100,
    oneDayPercent: 0.65,
    valuationDate: "2026-11-04",
    avgHoldingDays: 625,
    transactions: [
      {
        id: "tx-006",
        transactionDate: "2023-02-20",
        transactionType: "PURCHASE",
        amount: 900000,
        sttCharges: 90,
        nav: 147.54,
        units: 6100.0,
        balanceUnits: 6100.0,
        holdingDays: 989,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
  {
    amfi_code: "119554",
    amfiCode: "119554",
    folio_number: "FOL-332901/7",
    folioNo: "FOL-332901/7",
    fund_name: "Zenith Dynamic Bond Debt Fund - Growth",
    fundName: "Zenith Dynamic Bond Debt Fund - Growth",
    category: "Debt - Dynamic Bond",
    amc: "Zenith Capital AMC",
    securityType: "Debt",
    statusTag: "Lump Sum",
    sip_status: "Inactive",
    purchase_date: "2023-06-05",
    purchaseDate: "2023-06-05",
    invested_capital: 600000,
    investedCapital: 600000,
    current_value: 639920,
    currentValue: 639920,
    totalCapital: 639920,
    units: 15200.0,
    availableUnits: 15200.0,
    current_nav: 42.1,
    currentNAV: 42.1,
    avg_nav: 39.47,
    avgNAV: 39.47,
    dividend_payout: 7500,
    dividendPayout: 7500,
    unrealised_gain: 39920,
    unrealisedGain: 39920,
    unrealised_gain_percent: 6.65,
    unrealisedGainPercent: 6.65,
    realised_gain: 15000,
    realisedGain: 15000,
    xirr: 8.9,
    oneDayChange: 120,
    oneDayPercent: 0.02,
    valuationDate: "2026-11-04",
    avgHoldingDays: 518,
    transactions: [
      {
        id: "tx-007",
        transactionDate: "2023-06-05",
        transactionType: "PURCHASE",
        amount: 600000,
        sttCharges: 0,
        nav: 39.47,
        units: 15200.0,
        balanceUnits: 15200.0,
        holdingDays: 883,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
  {
    amfi_code: "119555",
    amfiCode: "119555",
    folio_number: "FOL-776201/2",
    folioNo: "FOL-776201/2",
    fund_name: "Nova Tech & Digital Innovations Sectoral Fund",
    fundName: "Nova Tech & Digital Innovations Sectoral Fund",
    category: "Equity - Sectoral",
    amc: "Nova Wealth AMC",
    securityType: "Equity",
    statusTag: "SIP",
    sip_status: "Active",
    purchase_date: "2023-11-12",
    purchaseDate: "2023-11-12",
    invested_capital: 650000,
    investedCapital: 650000,
    current_value: 962667,
    currentValue: 962667,
    totalCapital: 962667,
    units: 1850.75,
    availableUnits: 1850.75,
    current_nav: 520.15,
    currentNAV: 520.15,
    avg_nav: 351.21,
    avgNAV: 351.21,
    dividend_payout: 0,
    dividendPayout: 0,
    unrealised_gain: 312667,
    unrealisedGain: 312667,
    unrealised_gain_percent: 48.1,
    unrealisedGainPercent: 48.1,
    realised_gain: 20000,
    realisedGain: 20000,
    xirr: 31.4,
    oneDayChange: 8200,
    oneDayPercent: 0.86,
    valuationDate: "2026-11-04",
    avgHoldingDays: 360,
    transactions: [
      {
        id: "tx-008",
        transactionDate: "2023-11-12",
        transactionType: "PURCHASE",
        amount: 350000,
        sttCharges: 35,
        nav: 320.0,
        units: 1093.75,
        balanceUnits: 1093.75,
        holdingDays: 723,
        capitalGain: 0,
      },
      {
        id: "tx-009",
        transactionDate: "2024-04-10",
        transactionType: "SIP",
        amount: 300000,
        sttCharges: 30,
        nav: 396.3,
        units: 757.0,
        balanceUnits: 1850.75,
        holdingDays: 574,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
  {
    amfi_code: "119556",
    amfiCode: "119556",
    folio_number: "FOL-109284/5",
    folioNo: "FOL-109284/5",
    fund_name: "Horizon Balanced Advantage Hybrid Fund - Growth",
    fundName: "Horizon Balanced Advantage Hybrid Fund - Growth",
    category: "Hybrid - Balanced",
    amc: "Horizon AMC",
    securityType: "Hybrid",
    statusTag: "SIP",
    sip_status: "Active",
    purchase_date: "2024-01-20",
    purchaseDate: "2024-01-20",
    invested_capital: 750000,
    investedCapital: 750000,
    current_value: 827833,
    currentValue: 827833,
    totalCapital: 827833,
    units: 5403.61,
    availableUnits: 5403.61,
    current_nav: 153.2,
    currentNAV: 153.2,
    avg_nav: 138.8,
    avgNAV: 138.8,
    dividend_payout: 0,
    dividendPayout: 0,
    unrealised_gain: 77833,
    unrealisedGain: 77833,
    unrealised_gain_percent: 10.38,
    unrealisedGainPercent: 10.38,
    realised_gain: 10000,
    realisedGain: 10000,
    xirr: 14.5,
    oneDayChange: 2280,
    oneDayPercent: 0.28,
    valuationDate: "2026-11-04",
    avgHoldingDays: 290,
    transactions: [
      {
        id: "tx-010",
        transactionDate: "2024-01-20",
        transactionType: "PURCHASE",
        amount: 400000,
        sttCharges: 40,
        nav: 135.0,
        units: 2962.963,
        balanceUnits: 2962.963,
        holdingDays: 655,
        capitalGain: 0,
      },
      {
        id: "tx-011",
        transactionDate: "2024-06-15",
        transactionType: "SIP",
        amount: 350000,
        sttCharges: 35,
        nav: 143.4,
        units: 2440.647,
        balanceUnits: 5403.61,
        holdingDays: 508,
        capitalGain: 0,
      },
    ],
    investorDetails: {
      name: "Aarav Mehta",
      pan: "ABCDE1234F",
      dob: "1988-06-15",
      taxStatus: "Resident Individual",
      holdingType: "Single",
    },
    contactDetails: {
      email: "aarav.mehta@example.com",
      mobile: "+91 98765 43210",
      address: "402, Starlight Residency, Tech District, Pune 411001",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "•••• 4920",
      accountType: "Savings",
      branch: "Tech Park, Hinjawadi",
    },
    nomineeDetails: {
      name: "Radhika Mehta",
      relation: "Spouse",
    },
    jointHolderDetails: null,
  },
];

export const MOCK_INVESTOR_PORTFOLIO = {
  id: "inv-001",
  investor_name: "Aarav Mehta",
  clientName: "Aarav Mehta",
  total_capital: 4250000,
  invested_capital: 4250000,
  investedCapital: 4250000,
  current_value: 5480250,
  currentValue: 5480250,
  dividend_payout: 24500,
  dividendPayout: 24500,
  unrealised_gains_lt: 980250,
  unrealised_gains_st: 250000,
  unrealised_gain: 1230250,
  unrealisedGain: 1230250,
  unrealised_gain_percent: 28.95,
  unrealisedGainPercent: 28.95,
  abs_percent: 28.95,
  realised_gain: 185000,
  realisedGain: 185000,
  net_pl: 1415250,
  netPL: 1415250,
  todays_pnl: 32400,
  todaysGain: 32400,
  todays_pnl_percent: 0.59,
  todaysGainPercent: 0.59,
  xirr_percent: 19.8,
  xirr: 19.8,
  abs: 28.95,
  avg_days: 642,
  avgHoldingDays: 642,
  funds: MOCK_FUNDS_DATA,
};

// ─── FUND ANALYTICS MOCK GENERATOR ───
export function getMockFundAnalytics(amfiCode: string) {
  return {
    returns: {
      returns: [
        { period: "1M", fundReturn: 2.15, categoryAvg: 1.82, benchmark: 1.95 },
        { period: "3M", fundReturn: 6.42, categoryAvg: 5.1, benchmark: 5.8 },
        { period: "6M", fundReturn: 14.8, categoryAvg: 11.9, benchmark: 12.75 },
        { period: "1Y", fundReturn: 28.45, categoryAvg: 22.1, benchmark: 24.3 },
        { period: "3Y", fundReturn: 21.6, categoryAvg: 17.5, benchmark: 18.9 },
        { period: "5Y", fundReturn: 19.2, categoryAvg: 15.8, benchmark: 16.4 },
        { period: "SI", fundReturn: 18.75, categoryAvg: 14.9, benchmark: 15.6 },
      ],
    },
    monthlyReturns: {
      years: [
        {
          year: 2026,
          returns: [
            { month: "Jan", returnVal: 1.8 },
            { month: "Feb", returnVal: -0.9 },
            { month: "Mar", returnVal: 3.2 },
            { month: "Apr", returnVal: 2.4 },
            { month: "May", returnVal: 1.1 },
            { month: "Jun", returnVal: -0.4 },
            { month: "Jul", returnVal: 4.1 },
            { month: "Aug", returnVal: 1.9 },
            { month: "Sep", returnVal: 2.7 },
            { month: "Oct", returnVal: -1.2 },
          ],
        },
        {
          year: 2025,
          returns: [
            { month: "Jan", returnVal: 2.4 },
            { month: "Feb", returnVal: 1.5 },
            { month: "Mar", returnVal: 0.8 },
            { month: "Apr", returnVal: 3.9 },
            { month: "May", returnVal: 2.1 },
            { month: "Jun", returnVal: 1.4 },
            { month: "Jul", returnVal: -0.6 },
            { month: "Aug", returnVal: 3.2 },
            { month: "Sep", returnVal: 1.8 },
            { month: "Oct", returnVal: 2.9 },
            { month: "Nov", returnVal: 1.1 },
            { month: "Dec", returnVal: 2.8 },
          ],
        },
      ],
    },
    composition: {
      equity: 86.4,
      debt: 8.2,
      cash: 5.4,
      largeCap: 58.2,
      midCap: 26.5,
      smallCap: 9.9,
    },
    stylebox: {
      largeValue: 18,
      largeBlend: 26,
      largeGrowth: 28,
      midValue: 8,
      midBlend: 10,
      midGrowth: 6,
      smallValue: 2,
      smallBlend: 1,
      smallGrowth: 1,
    },
    riskStats: {
      alpha: 3.42,
      beta: 0.89,
      sharpeRatio: 1.48,
      standardDeviation: 13.8,
      sortinoRatio: 1.94,
      rSquared: 0.92,
    },
    sectorAllocation: [
      { sector: "Financial Services", percentage: 32.4 },
      { sector: "Information Technology", percentage: 19.8 },
      { sector: "Consumer Goods & Retail", percentage: 13.5 },
      { sector: "Healthcare & Pharma", percentage: 11.2 },
      { sector: "Automobile & Auto Parts", percentage: 8.6 },
      { sector: "Energy, Oil & Power", percentage: 6.9 },
      { sector: "Metals & Mining", percentage: 4.1 },
      { sector: "Others / Cash Equivalents", percentage: 3.5 },
    ],
    holdings: [
      {
        company: "Acme Technologies Ltd.",
        sector: "Information Technology",
        percentage: 8.4,
        value: 1250000,
      },
      {
        company: "Horizon National Bank",
        sector: "Financial Services",
        percentage: 7.9,
        value: 1180000,
      },
      {
        company: "Apex Enterprise Infotech",
        sector: "Information Technology",
        percentage: 6.8,
        value: 1010000,
      },
      {
        company: "Zenith Pharmaceuticals",
        sector: "Healthcare",
        percentage: 5.9,
        value: 880000,
      },
      {
        company: "Starlight Energy Solutions",
        sector: "Energy",
        percentage: 5.2,
        value: 775000,
      },
      {
        company: "Pinnacle Consumer Goods",
        sector: "Consumer Goods",
        percentage: 4.8,
        value: 715000,
      },
      {
        company: "Olympus Automotive Corp",
        sector: "Automobile",
        percentage: 4.3,
        value: 640000,
      },
      {
        company: "United Infrastructure Ltd",
        sector: "Infrastructure",
        percentage: 3.9,
        value: 580000,
      },
      {
        company: "Metro Telecom Services",
        sector: "Telecommunication",
        percentage: 3.5,
        value: 520000,
      },
      {
        company: "Federal Chemical Industries",
        sector: "Chemicals",
        percentage: 3.1,
        value: 460000,
      },
    ],
  };
}

// ─── HIERARCHY EARNINGS MOCK DATA ──────────────────────────────────────────
export const MOCK_HIERARCHY_DATA = {
  sub_brokers: [
    {
      sub_broker_id: "sb-master-01",
      sub_broker_name: "Rajesh Sharma (Principal)",
      broker_type: "DIRECT",
      share_percentage: 100,
      amc_wise_brokerage: [
        {
          amc_name: "FinIQ Asset Management",
          total_brokerage: 184500,
          paid_brokerage: 160000,
        },
        {
          amc_name: "Apex Asset Management",
          total_brokerage: 122000,
          paid_brokerage: 110000,
        },
        {
          amc_name: "Zenith Capital AMC",
          total_brokerage: 78500,
          paid_brokerage: 70000,
        },
        {
          amc_name: "Nova Wealth AMC",
          total_brokerage: 94200,
          paid_brokerage: 82000,
        },
        {
          amc_name: "Horizon AMC",
          total_brokerage: 63800,
          paid_brokerage: 55000,
        },
      ],
      investor_wise_brokerage: [
        {
          investor_id: "inv-001",
          investor_name: "Aarav Mehta",
          total_brokerage: 82500,
          paid_brokerage: 75000,
        },
        {
          investor_id: "inv-004",
          investor_name: "Ananya Iyer",
          total_brokerage: 124000,
          paid_brokerage: 115000,
        },
        {
          investor_id: "inv-005",
          investor_name: "Vikram Patel",
          total_brokerage: 96000,
          paid_brokerage: 85000,
        },
        {
          investor_id: "inv-013",
          investor_name: "Sanjay Singhania",
          total_brokerage: 140500,
          paid_brokerage: 125000,
        },
      ],
    },
    {
      sub_broker_id: "sb-team-02",
      sub_broker_name: "Vikas Gupta (Senior Manager)",
      broker_type: "SUB_BROKER",
      share_percentage: 80,
      amc_wise_brokerage: [
        {
          amc_name: "FinIQ Asset Management",
          total_brokerage: 112000,
          paid_brokerage: 95000,
        },
        {
          amc_name: "Apex Asset Management",
          total_brokerage: 84000,
          paid_brokerage: 72000,
        },
        {
          amc_name: "Nova Wealth AMC",
          total_brokerage: 61000,
          paid_brokerage: 50000,
        },
      ],
      investor_wise_brokerage: [
        {
          investor_id: "inv-002",
          investor_name: "Priya Sharma",
          total_brokerage: 68000,
          paid_brokerage: 60000,
        },
        {
          investor_id: "inv-007",
          investor_name: "Kabir Malhotra",
          total_brokerage: 89000,
          paid_brokerage: 78000,
        },
        {
          investor_id: "inv-012",
          investor_name: "Kavita Deshmukh",
          total_brokerage: 62000,
          paid_brokerage: 54000,
        },
      ],
    },
    {
      sub_broker_id: "sb-team-03",
      sub_broker_name: "Sneha Reddy (Wealth Consultant)",
      broker_type: "SUB_BROKER",
      share_percentage: 70,
      amc_wise_brokerage: [
        {
          amc_name: "FinIQ Asset Management",
          total_brokerage: 72000,
          paid_brokerage: 60000,
        },
        {
          amc_name: "Zenith Capital AMC",
          total_brokerage: 48000,
          paid_brokerage: 40000,
        },
        {
          amc_name: "Horizon AMC",
          total_brokerage: 39000,
          paid_brokerage: 32000,
        },
      ],
      investor_wise_brokerage: [
        {
          investor_id: "inv-003",
          investor_name: "Rohan Verma",
          total_brokerage: 52000,
          paid_brokerage: 44000,
        },
        {
          investor_id: "inv-008",
          investor_name: "Neha Kulkarni",
          total_brokerage: 59000,
          paid_brokerage: 50000,
        },
        {
          investor_id: "inv-018",
          investor_name: "Nandini Pillai",
          total_brokerage: 48000,
          paid_brokerage: 38000,
        },
      ],
    },
    {
      sub_broker_id: "sb-team-04",
      sub_broker_name: "Deepak Chawla (Associate Advisor)",
      broker_type: "SUB_BROKER",
      share_percentage: 65,
      amc_wise_brokerage: [
        {
          amc_name: "FinIQ Asset Management",
          total_brokerage: 45000,
          paid_brokerage: 38000,
        },
        {
          amc_name: "Apex Asset Management",
          total_brokerage: 36000,
          paid_brokerage: 30000,
        },
      ],
      investor_wise_brokerage: [
        {
          investor_id: "inv-006",
          investor_name: "Sunita Rao",
          total_brokerage: 37000,
          paid_brokerage: 31000,
        },
        {
          investor_id: "inv-011",
          investor_name: "Arjun Kapoor",
          total_brokerage: 33000,
          paid_brokerage: 28000,
        },
      ],
    },
  ],
};

// ─── BANK ACCOUNTS & LEDGER ────────────────────────────────────────────────
export const INITIAL_BANK_ACCOUNTS = [
  {
    id: "ba-001",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920",
    sub_broker_id: null,
    bank_name: "HDFC Bank",
    account_number: "•••• 9021",
    account_holder_name: "FinIQ Wealth Partners - Primary Escrow",
    ifsc_code: "HDFC0001021",
    upi_id: "finiq.escrow@okhdfcbank",
    is_primary: true,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "ba-002",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920",
    sub_broker_id: null,
    bank_name: "ICICI Bank",
    account_number: "•••• 4410",
    account_holder_name: "FinIQ Wealth Partners - Operations",
    ifsc_code: "ICIC0002244",
    upi_id: "finiq.ops@okicici",
    is_primary: false,
    created_at: "2024-02-01T11:30:00Z",
  },
  {
    id: "ba-003",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920",
    sub_broker_id: "sb-team-02",
    bank_name: "Axis Bank",
    account_number: "•••• 3309",
    account_holder_name: "Vikas Gupta - Sub Broker Escrow",
    ifsc_code: "UTIB0001122",
    upi_id: "vikas.gupta@axisbank",
    is_primary: false,
    created_at: "2024-03-10T14:15:00Z",
  },
  {
    id: "ba-004",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920",
    sub_broker_id: "sb-team-03",
    bank_name: "State Bank of India",
    account_number: "•••• 7718",
    account_holder_name: "Sneha Reddy - Sub Broker Account",
    ifsc_code: "SBIN0008819",
    upi_id: "sneha.reddy@sbi",
    is_primary: false,
    created_at: "2024-04-05T09:45:00Z",
  },
];

export const INITIAL_LEDGER_ENTRIES = [
  {
    id: "led-001",
    reference_id: "UTR-20261101-8492",
    source_account_id: "ba-001",
    destination_account_id: "ba-003",
    source_account_name: "HDFC Bank (•••• 9021)",
    destination_account_name: "Axis Bank - Vikas Gupta (•••• 3309)",
    transfer_amount: 85000,
    payment_mode: "NEFT",
    status: "COMPLETED",
    created_at: "2026-11-01T11:20:00Z",
  },
  {
    id: "led-002",
    reference_id: "UTR-20261025-4190",
    source_account_id: "ba-001",
    destination_account_id: "ba-004",
    source_account_name: "HDFC Bank (•••• 9021)",
    destination_account_name: "SBI - Sneha Reddy (•••• 7718)",
    transfer_amount: 52000,
    payment_mode: "RTGS",
    status: "COMPLETED",
    created_at: "2026-10-25T15:40:00Z",
  },
  {
    id: "led-003",
    reference_id: "UTR-20261018-7712",
    source_account_id: "ba-002",
    destination_account_id: "ba-003",
    source_account_name: "ICICI Bank (•••• 4410)",
    destination_account_name: "Axis Bank - Vikas Gupta (•••• 3309)",
    transfer_amount: 40000,
    payment_mode: "IMPS",
    status: "COMPLETED",
    created_at: "2026-10-18T09:15:00Z",
  },
];

// ─── SIPS & SYSTEMATIC REPORTS ──────────────────────────────────────────────
export const INITIAL_SIP_SUMMARY = {
  total_company_sips: 142,
  total_company_value: 1850000,
  investor_breakdown: [
    {
      investor_id: "inv-001",
      investor_name: "Aarav Mehta",
      total_sips: 4,
      total_sip_value: 45000,
    },
    {
      investor_id: "inv-002",
      investor_name: "Priya Sharma",
      total_sips: 5,
      total_sip_value: 55000,
    },
    {
      investor_id: "inv-003",
      investor_name: "Rohan Verma",
      total_sips: 3,
      total_sip_value: 30000,
    },
    {
      investor_id: "inv-004",
      investor_name: "Ananya Iyer",
      total_sips: 8,
      total_sip_value: 120000,
    },
    {
      investor_id: "inv-005",
      investor_name: "Vikram Patel",
      total_sips: 6,
      total_sip_value: 80000,
    },
    {
      investor_id: "inv-006",
      investor_name: "Sunita Rao",
      total_sips: 2,
      total_sip_value: 20000,
    },
    {
      investor_id: "inv-007",
      investor_name: "Kabir Malhotra",
      total_sips: 5,
      total_sip_value: 65000,
    },
    {
      investor_id: "inv-008",
      investor_name: "Neha Kulkarni",
      total_sips: 4,
      total_sip_value: 40000,
    },
  ],
};

export const INITIAL_SYSTEMATIC_ITEMS = [
  {
    trxn_no: "SYS-99401",
    folio_number: "FOL-892011/0",
    scheme_name: "FinIQ Horizon Bluechip Equity Fund - Direct Growth",
    investor_name: "Aarav Mehta",
    amount: 15000,
    start_date: "2023-04-10",
    end_date: "2028-04-10",
    target_scheme: null,
    systematic_type: "SIP",
    source: "CAMS",
    termination_date: null,
    amc_name: "FinIQ Asset Management",
  },
  {
    trxn_no: "SYS-99402",
    folio_number: "FOL-892011/1",
    scheme_name: "FinIQ Emerging Leaders Midcap Fund - Growth",
    investor_name: "Aarav Mehta",
    amount: 10000,
    start_date: "2023-08-15",
    end_date: "2028-08-15",
    target_scheme: null,
    systematic_type: "SIP",
    source: "KARVY",
    termination_date: null,
    amc_name: "FinIQ Asset Management",
  },
  {
    trxn_no: "SYS-99403",
    folio_number: "FOL-776201/2",
    scheme_name: "Nova Tech & Digital Innovations Sectoral Fund",
    investor_name: "Aarav Mehta",
    amount: 10000,
    start_date: "2023-11-12",
    end_date: "2028-11-12",
    target_scheme: null,
    systematic_type: "SIP",
    source: "CAMS",
    termination_date: null,
    amc_name: "Nova Wealth AMC",
  },
  {
    trxn_no: "SYS-99404",
    folio_number: "FOL-109284/5",
    scheme_name: "Horizon Balanced Advantage Hybrid Fund - Growth",
    investor_name: "Aarav Mehta",
    amount: 10000,
    start_date: "2024-01-20",
    end_date: "2027-01-20",
    target_scheme: null,
    systematic_type: "SIP",
    source: "KARVY",
    termination_date: null,
    amc_name: "Horizon AMC",
  },
  {
    trxn_no: "SYS-99405",
    folio_number: "FOL-332901/7",
    scheme_name: "Zenith Dynamic Bond Debt Fund - Growth",
    investor_name: "Aarav Mehta",
    amount: 15000,
    start_date: "2024-03-01",
    end_date: "2026-03-01",
    target_scheme: "FinIQ Horizon Bluechip Equity Fund",
    systematic_type: "STP",
    source: "CAMS",
    termination_date: null,
    amc_name: "Zenith Capital AMC",
  },
];

// ─── INVESTOR MAPPING & USERS ──────────────────────────────────────────────
export const INITIAL_ASSIGNABLE_BROKERS = [
  {
    id: "sb-master-01",
    name: "Rajesh Sharma (Principal)",
    arn_id: "ARN-84920",
    parent_id: null,
    is_distributor: true,
  },
  {
    id: "sb-team-02",
    name: "Vikas Gupta (Senior Manager)",
    arn_id: "ARN-84920-A",
    parent_id: "sb-master-01",
    is_distributor: false,
  },
  {
    id: "sb-team-03",
    name: "Sneha Reddy (Wealth Consultant)",
    arn_id: "ARN-84920-B",
    parent_id: "sb-master-01",
    is_distributor: false,
  },
  {
    id: "sb-team-04",
    name: "Deepak Chawla (Associate Advisor)",
    arn_id: "ARN-84920-C",
    parent_id: "sb-master-01",
    is_distributor: false,
  },
];

export const INITIAL_MAPPABLE_INVESTORS = [
  {
    id: "inv-001",
    name: "Aarav Mehta",
    pan: "ABCDE1234F",
    email: "aarav.mehta@example.com",
    mobile: "+91 98765 43210",
    current_sub_broker_id: "sb-master-01",
    current_sub_broker_name: "Rajesh Sharma (Principal)",
  },
  {
    id: "inv-002",
    name: "Priya Sharma",
    pan: "BCDEF2345G",
    email: "priya.sharma@example.com",
    mobile: "+91 98765 43211",
    current_sub_broker_id: "sb-team-02",
    current_sub_broker_name: "Vikas Gupta (Senior Manager)",
  },
  {
    id: "inv-003",
    name: "Rohan Verma",
    pan: "CDEFG3456H",
    email: "rohan.verma@example.com",
    mobile: "+91 98765 43212",
    current_sub_broker_id: "sb-team-03",
    current_sub_broker_name: "Sneha Reddy (Wealth Consultant)",
  },
  {
    id: "inv-004",
    name: "Ananya Iyer",
    pan: "DEFGH4567I",
    email: "ananya.iyer@example.com",
    mobile: "+91 98765 43213",
    current_sub_broker_id: "sb-master-01",
    current_sub_broker_name: "Rajesh Sharma (Principal)",
  },
  {
    id: "inv-005",
    name: "Vikram Patel",
    pan: "EFGHI5678J",
    email: "vikram.patel@example.com",
    mobile: "+91 98765 43214",
    current_sub_broker_id: "sb-master-01",
    current_sub_broker_name: "Rajesh Sharma (Principal)",
  },
  {
    id: "inv-006",
    name: "Sunita Rao",
    pan: "FGHIJ6789K",
    email: "sunita.rao@example.com",
    mobile: "+91 98765 43215",
    current_sub_broker_id: "sb-team-04",
    current_sub_broker_name: "Deepak Chawla (Associate Advisor)",
  },
  {
    id: "inv-007",
    name: "Kabir Malhotra",
    pan: "GHIJK7890L",
    email: "kabir.malhotra@example.com",
    mobile: "+91 98765 43216",
    current_sub_broker_id: "sb-team-02",
    current_sub_broker_name: "Vikas Gupta (Senior Manager)",
  },
  {
    id: "inv-008",
    name: "Neha Kulkarni",
    pan: "HIJKL8901M",
    email: "neha.kulkarni@example.com",
    mobile: "+91 98765 43217",
    current_sub_broker_id: "sb-team-03",
    current_sub_broker_name: "Sneha Reddy (Wealth Consultant)",
  },
  {
    id: "inv-009",
    name: "Devendra Joshi",
    pan: "IJKLM9012N",
    email: "devendra.joshi@example.com",
    mobile: "+91 98765 43218",
    current_sub_broker_id: null,
    current_sub_broker_name: null,
  },
  {
    id: "inv-010",
    name: "Meera Nambiar",
    pan: "JKLMN0123O",
    email: "meera.nambiar@example.com",
    mobile: "+91 98765 43219",
    current_sub_broker_id: null,
    current_sub_broker_name: null,
  },
];

export const INITIAL_MAPPING_HISTORY = [
  {
    id: "map-hist-01",
    action: "ASSIGNED",
    created_at: "2026-10-15T14:30:00Z",
    investor_name: "Priya Sharma",
    investor_pan: "BCDEF2345G",
    sub_broker_name: "Vikas Gupta (Senior Manager)",
    performed_by_name: "Rajesh Sharma",
  },
  {
    id: "map-hist-02",
    action: "ASSIGNED",
    created_at: "2026-10-12T11:20:00Z",
    investor_name: "Rohan Verma",
    investor_pan: "CDEFG3456H",
    sub_broker_name: "Sneha Reddy (Wealth Consultant)",
    performed_by_name: "Rajesh Sharma",
  },
  {
    id: "map-hist-03",
    action: "ASSIGNED",
    created_at: "2026-10-05T09:45:00Z",
    investor_name: "Kabir Malhotra",
    investor_pan: "GHIJK7890L",
    sub_broker_name: "Vikas Gupta (Senior Manager)",
    performed_by_name: "Rajesh Sharma",
  },
];

export const INITIAL_COMPANY_USERS = [
  {
    id: "sb-team-02",
    name: "Vikas Gupta",
    email: "vikas.gupta@example.com",
    role: "Sub-Broker",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920-A",
    parent_id: "sb-master-01",
    parent_name: "Rajesh Sharma",
    share_percentage: 80,
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "sb-team-03",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    role: "Sub-Broker",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920-B",
    parent_id: "sb-master-01",
    parent_name: "Rajesh Sharma",
    share_percentage: 70,
    created_at: "2024-03-15T11:30:00Z",
  },
  {
    id: "sb-team-04",
    name: "Deepak Chawla",
    email: "deepak.chawla@example.com",
    role: "Sub-Broker",
    company_id: "comp-fin-001",
    arn_id: "ARN-84920-C",
    parent_id: "sb-master-01",
    parent_name: "Rajesh Sharma",
    share_percentage: 65,
    created_at: "2024-04-20T14:45:00Z",
  },
];

// ─── ADMIN SYSTEM AUDIT LOGS ───────────────────────────────────────────────
export const INITIAL_ADMIN_LOGS = [
  {
    id: "log-101",
    level: "INFO",
    module: "StatementsProcessor",
    action: "CAMS_SYNC_SUCCESS",
    detail: "Validated & ingested 4,120 transaction records from WBR9 feed (hash: 0x8a9f2c...)",
    timestamp: "2026-11-05T08:14:22Z",
    status: "SUCCESS",
  },
  {
    id: "log-102",
    level: "INFO",
    module: "StatementsProcessor",
    action: "KARVY_FEED_INGEST",
    detail: "Processed 1,840 folio balances from KFintech daily feed (batch: KF-20261105-01)",
    timestamp: "2026-11-05T07:45:10Z",
    status: "SUCCESS",
  },
  {
    id: "log-103",
    level: "INFO",
    module: "TaxCalculatorService",
    action: "FIFO_LOT_MATCHING",
    detail: "Executed Section 112A capital gains computation for 156 client redemption orders",
    timestamp: "2026-11-05T06:30:00Z",
    status: "SUCCESS",
  },
  {
    id: "log-104",
    level: "AUDIT",
    module: "BrokerageEngine",
    action: "COMMISSION_SPLIT",
    detail: "Calculated trail commissions across 4-tier sub-broker hierarchy for October 2026",
    timestamp: "2026-11-04T22:15:44Z",
    status: "SUCCESS",
  },
  {
    id: "log-105",
    level: "SECURITY",
    module: "AuthService",
    action: "TOKEN_ROTATION",
    detail: "Refreshed dual JWT sessions for tenant comp-fin-001 (active sessions: 32)",
    timestamp: "2026-11-04T18:00:12Z",
    status: "SUCCESS",
  },
  {
    id: "log-106",
    level: "INFO",
    module: "StorageService",
    action: "S3_STATEMENT_ENCRYPTION",
    detail: "Archived statement PDF batch to finiq-reports-secure bucket with SSE-KMS",
    timestamp: "2026-11-04T14:22:30Z",
    status: "SUCCESS",
  },
];

// ─── THEMES ────────────────────────────────────────────────────────────────
export interface ActiveThemePayload {
  theme_name: string;
  active_theme_id: string | null;
  theme_variables: Record<string, string>;
}

export interface SavedThemePayload {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export const INITIAL_ACTIVE_THEME: ActiveThemePayload = {
  theme_name: "System Default",
  active_theme_id: null,
  theme_variables: {},
};

export const INITIAL_SAVED_THEMES: SavedThemePayload[] = [
  {
    id: "th-default-00",
    name: "System Default",
    variables: {},
  },
  {
    id: "th-slate-01",
    name: "Modern Slate",
    variables: {
      "--fin-brand-500": "#3b82f6",
      "--fin-brand-600": "#2563eb",
      "--fin-brand-700": "#1d4ed8",
      "--fin-page-bg": "#0f172a",
      "--fin-content-surface": "#1e293b",
    },
  },
  {
    id: "th-emerald-02",
    name: "Emerald Wealth",
    variables: {
      "--fin-brand-500": "#10b981",
      "--fin-brand-600": "#059669",
      "--fin-brand-700": "#047857",
      "--fin-page-bg": "#064e3b",
      "--fin-content-surface": "#065f46",
    },
  },
  {
    id: "th-navy-03",
    name: "Royal Navy Elite",
    variables: {
      "--fin-brand-500": "#6366f1",
      "--fin-brand-600": "#4f46e5",
      "--fin-brand-700": "#4338ca",
      "--fin-page-bg": "#0a0f1d",
      "--fin-content-surface": "#131b31",
    },
  },
];

// ─── STATE MANAGER (SESSION STORAGE PERSISTED) ──────────────────────────────
const DB_STORAGE_KEY = "finiq_demo_mock_db";

interface MockDatabaseState {
  summary: typeof INITIAL_DISTRIBUTOR_SUMMARY;
  topContributors: typeof INITIAL_TOP_CONTRIBUTORS;
  investors: typeof INITIAL_INVESTORS;
  funds: typeof MOCK_FUNDS_DATA;
  portfolio: typeof MOCK_INVESTOR_PORTFOLIO;
  bankAccounts: typeof INITIAL_BANK_ACCOUNTS;
  ledgerEntries: typeof INITIAL_LEDGER_ENTRIES;
  sipSummary: typeof INITIAL_SIP_SUMMARY;
  systematicItems: typeof INITIAL_SYSTEMATIC_ITEMS;
  assignableBrokers: typeof INITIAL_ASSIGNABLE_BROKERS;
  mappableInvestors: typeof INITIAL_MAPPABLE_INVESTORS;
  mappingHistory: typeof INITIAL_MAPPING_HISTORY;
  companyUsers: typeof INITIAL_COMPANY_USERS;
  adminLogs: typeof INITIAL_ADMIN_LOGS;
  activeTheme: ActiveThemePayload;
  savedThemes: SavedThemePayload[];
}

function getInitialDbState(): MockDatabaseState {
  return {
    summary: INITIAL_DISTRIBUTOR_SUMMARY,
    topContributors: INITIAL_TOP_CONTRIBUTORS,
    investors: INITIAL_INVESTORS,
    funds: MOCK_FUNDS_DATA,
    portfolio: MOCK_INVESTOR_PORTFOLIO,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    ledgerEntries: INITIAL_LEDGER_ENTRIES,
    sipSummary: INITIAL_SIP_SUMMARY,
    systematicItems: INITIAL_SYSTEMATIC_ITEMS,
    assignableBrokers: INITIAL_ASSIGNABLE_BROKERS,
    mappableInvestors: INITIAL_MAPPABLE_INVESTORS,
    mappingHistory: INITIAL_MAPPING_HISTORY,
    companyUsers: INITIAL_COMPANY_USERS,
    adminLogs: INITIAL_ADMIN_LOGS,
    activeTheme: INITIAL_ACTIVE_THEME,
    savedThemes: INITIAL_SAVED_THEMES,
  };
}

export function loadMockDb(): MockDatabaseState {
  if (typeof window === "undefined") return getInitialDbState();
  try {
    const raw = sessionStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDbState();
      sessionStorage.setItem(DB_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDbState();
  }
}

export function saveMockDb(state: MockDatabaseState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save mock DB:", e);
  }
}

export const mockDb = {
  getState: loadMockDb,
  updateState: (fn: (current: MockDatabaseState) => MockDatabaseState) => {
    const current = loadMockDb();
    const updated = fn(current);
    saveMockDb(updated);
    return updated;
  },
  reset: () => {
    const fresh = getInitialDbState();
    saveMockDb(fresh);
    return fresh;
  },
};
