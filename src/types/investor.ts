// src/types/investor.ts
export type Transaction = {
  id: string;
  transactionDate: string;
  transactionType: string;
  amount: number;
  sttCharges: number;
  nav: number;
  units: number;
  balanceUnits: number;
  holdingDays: number;
  capitalGain: number;
};

export type UnifiedFund = {
  // Desktop & Shared Fields
  folioNo: string;
  fundName: string;
  purchaseDate: string;
  totalCapital: number;
  investedCapital: number;
  currentValue: number;
  availableUnits: number;
  currentNAV: number;
  avgNAV: number;
  dividendPayout: number;
  unrealisedGain: number;
  unrealisedGainPercent: number;
  realisedGain: number;
  statusTag: string;
  category: string;
  amc: string;
  securityType: string;
  transactions: Transaction[];

  // Mobile-Specific Extended Fields
  sipStatus: string;
  xirr: number;
  oneDayChange: number;
  oneDayPercent: number;
  valuationDate: string;
  avgHoldingDays: number;
  investorDetails: { name: string; pan: string; dob: string; taxStatus: string; holdingType: string; };
  contactDetails: { email: string; mobile: string; address: string; };
  bankDetails: { bankName: string; accountNumber: string; accountType: string; branch: string; };
  nomineeDetails: { name: string; relation: string; };
  jointHolderDetails: { name: string; pan: string; } | null;
};

export type ClientPortfolio = {
  id: string;
  clientName: string;
  totalCapital: number;
  investedCapital: number;
  currentValue: number;
  dividendPayout: number;
  unrealisedGain: number;
  unrealisedGainPercent: number;
  realisedGain: number;
  netPL: number;
  todaysGain: number;
  todaysGainPercent: number;
  xirr: number;
  absReturn: number;
  avgHoldingDays: number;
  funds: UnifiedFund[];
};

export type GlobalStats = {
  currentValue: number;    // Sum of current value of all funds
  investedAmount: number;  // Sum of all invested capital
  totalGain: number;       // currentValue - investedAmount
  totalGainPercent: number;// (totalGain / investedAmount) * 100
  oneDayChange: number;    // Sum of today's absolute gain/loss across all funds
  oneDayPercent: number;   // Percentage change for today
  xirr: number;            // Annualized return (needs a specific financial formula based on all cash flows)
};