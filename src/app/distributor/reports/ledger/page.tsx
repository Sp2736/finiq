"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  Building2,
  CreditCard,
  CheckCircle2,
  X,
  FileText,
  Landmark,
  User,
  Hash,
  Type,
  Smartphone,
  Star,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  distributorService,
  CompanyUser,
  BankAccount,
} from "@/services/distributor.service";

// ─── CUSTOM THEMED DROPDOWN COMPONENT ───
const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  isLoading = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: {
    value: string;
    label: string | React.ReactNode;
    icon?: React.ReactNode;
  }[];
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`w-full p-3 flex justify-between items-center bg-white border border-slate-200 rounded-md text-sm font-semibold outline-none transition-all shadow-sm ${
          disabled || isLoading
            ? "opacity-60 bg-slate-50 cursor-not-allowed text-slate-500"
            : "text-slate-700 hover:border-slate-300 focus:ring-4 focus:ring-distributor-500/10 focus:border-distributor-500"
        }`}
      >
        <span className="truncate">
          {isLoading
            ? "Loading..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-distributor-600" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && !disabled && !isLoading && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-md shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <ul className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {options.length === 0 ? (
                <li className="p-3 text-sm text-slate-500 text-center font-medium">
                  No options available
                </li>
              ) : (
                options.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`p-3 text-sm cursor-pointer rounded-md mx-0.5 my-0.5 transition-colors flex items-center gap-2 ${
                      value === opt.value
                        ? "bg-distributor-50 text-distributor-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    {opt.icon && (
                      <span className="text-slate-400 shrink-0">
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default function BrokerLedgerPage() {
  // --- Dynamic Data States ---
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<BankAccount[]>([]);
  const [destAccounts, setDestAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal & UI States ---
  const [showAddBank, setShowAddBank] = useState(false);
  const [isClosingBank, setIsClosingBank] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isClosingConfirm, setIsClosingConfirm] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // --- Transfer Form States ---
  const [sourceAcc, setSourceAcc] = useState("");
  const [receiver, setReceiver] = useState("");
  const [destAcc, setDestAcc] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("NEFT");
  const [referenceId, setReferenceId] = useState("");

  const [newBank, setNewBank] = useState({
    targetType: "",
    companyId: "9d034353-d658-4fa5-b5a1-e46253cdbc0c", // Shrinathji Investments ID
    arnId: "",
    subBrokerId: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    upiId: "",
    isPrimary: false,
  });

  // --- 1. Initial Page Load (Fetch Users & Company Banks) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [usersRes, companyAccountsRes] = await Promise.all([
          distributorService.getCompanyUsers(),
          distributorService.getBankAccounts(),
        ]);

        if (usersRes.success) setUsers(usersRes.data.sub_brokers || []);

        if (companyAccountsRes.success) {
          const accounts = companyAccountsRes.data || [];
          setCompanyAccounts(accounts);
          if (accounts.length > 0) setSourceAcc(accounts[0].id);
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- 2. Dynamic Destination Account Fetching ---
  useEffect(() => {
    const fetchDestAccounts = async () => {
      if (!receiver) {
        setDestAccounts([]);
        return;
      }
      try {
        const res = await distributorService.getBankAccounts(receiver);
        if (res.success) {
          setDestAccounts(res.data || []);
          if (res.data?.length === 1) setDestAcc(res.data[0].id);
          else if (res.data?.length > 1) setDestAcc("");
        }
      } catch (error) {
        console.error("Failed to fetch destination accounts", error);
        setDestAccounts([]);
      }
    };

    fetchDestAccounts();
  }, [receiver]);

  // --- Submit Handlers ---
  const handleSubmitBank = async () => {
    setIsSubmittingBank(true);
    try {
      const payload = {
        company_id: newBank.companyId,
        arn_id: newBank.arnId || null,
        sub_broker_id: newBank.subBrokerId || null,
        bank_name: newBank.bankName,
        account_number: newBank.accountNumber,
        account_holder_name: newBank.accountHolderName,
        ifsc_code: newBank.ifscCode,
        upi_id: newBank.upiId || null,
        is_primary: newBank.isPrimary,
      };

      await distributorService.addBankAccount(payload);
      alert("Bank account successfully added to database!");

      if (newBank.targetType === "COMPANY") {
        const res = await distributorService.getBankAccounts();
        if (res.success) {
          setCompanyAccounts(res.data);
          if (res.data.length === 1) setSourceAcc(res.data[0].id);
        }
      }

      handleCloseAddBank();
    } catch (error: any) {
      alert(`Failed to add bank account: ${error.message}`);
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleSubmitLedger = async () => {
    setIsSubmittingTransfer(true);
    try {
      await distributorService.addLedgerEntry({
        source_account_id: sourceAcc,
        destination_account_id: destAcc,
        payment_mode: mode,
        transfer_amount: Number(amount),
        reference_id: referenceId,
      });

      alert("Ledger entry recorded successfully!");
      handleCloseConfirm();

      setReceiver("");
      setDestAcc("");
      setAmount("");
      setReferenceId("");
      setDestAccounts([]);
    } catch (error: any) {
      alert(`Failed to submit ledger entry: ${error.message}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleCloseConfirm = () => {
    setIsClosingConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      setIsClosingConfirm(false);
    }, 250);
  };

  const handleCloseAddBank = () => {
    setIsClosingBank(true);
    setTimeout(() => {
      setShowAddBank(false);
      setIsClosingBank(false);
      setNewBank({
        targetType: "",
        companyId: newBank.companyId,
        arnId: "",
        subBrokerId: "",
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        ifscCode: "",
        upiId: "",
        isPrimary: false,
      });
    }, 250);
  };

  const getDynamicRefLabel = () => {
    switch (mode) {
      case "CHEQUE":
        return "Cheque Number";
      case "UPI":
        return "UPI Transaction ID";
      default:
        return "Bank Reference (UTR)";
    }
  };

  const selectedSourceObj = companyAccounts.find((a) => a.id === sourceAcc);
  const selectedUserObj = users.find((u) => u.id === receiver);
  const selectedDestObj = destAccounts.find((a) => a.id === destAcc);

  if (isLoading) {
    return (
      <div className="flex-1 w-full h-[calc(100vh-5rem)] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-distributor-600 rounded-full animate-spin"></div>
          <p className="text-sm font-bold animate-pulse">
            Establishing secure connection to Ledger...
          </p>
        </div>
      </div>
    );
  }

  const sourceOptions = companyAccounts.map((a) => ({
    value: a.id,
    label: `${a.bank_name} ••• ${a.account_number.slice(-4)}`,
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name,
    icon: <User className="w-3.5 h-3.5" />,
  }));

  const destOptions = destAccounts.map((a) => ({
    value: a.id,
    label: `${a.bank_name} - ••• ${a.account_number.slice(-4)}`,
  }));

  const modeOptions = [
    { value: "NEFT", label: "NEFT" },
    { value: "RTGS", label: "RTGS" },
    { value: "IMPS", label: "IMPS" },
    { value: "UPI", label: "UPI" },
    { value: "CHEQUE", label: "CHEQUE" },
  ];

  const ownerOptions = [
    { value: "self", label: "🏢 Company Main (Self)" },
    ...users.map((u) => ({ value: u.id, label: `👤 ${u.name}` })),
  ];

  return (
    // FULL PAGE CONTAINER: Locked to viewport height, forces internal scrolling
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-4 sm:gap-6">
      {/* ─── HEADER (Shrink-0 prevents it from squishing) ─── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            Broker <span className="text-distributor-600">Ledger</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Initiate and record manual payouts to sub-brokers.
          </p>
        </div>
        <button
          onClick={() => setShowAddBank(true)}
          className="group w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-distributor-700 border border-distributor-200 px-5 py-2.5 rounded-md text-sm font-bold shadow-sm hover:bg-distributor-50 hover:-translate-y-0.5 hover:shadow transition-all duration-200"
        >
          <Plus className="w-4 h-4 shrink-0 group-hover:rotate-90 transition-transform duration-300" />
          Add Bank Details
        </button>
      </div>

      {/* ─── SCROLLABLE FORM CARD ─── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full">
        {/* Form Content: Scrolls internally if the screen is too short */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-full">
            <div className="p-5 sm:p-6 lg:p-8 flex flex-col gap-6 bg-slate-50/30 transition-colors duration-300 hover:bg-slate-50/80">
              <div className="flex items-center gap-2 text-distributor-700 mb-1">
                <Landmark className="w-4 h-4" />
                <h3 className="text-sm font-black tracking-wide uppercase">
                  Transfer Route
                </h3>
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Source Account
                </label>
                <CustomSelect
                  value={sourceAcc}
                  onChange={setSourceAcc}
                  options={sourceOptions}
                  placeholder={
                    companyAccounts.length === 0
                      ? "No accounts found"
                      : "Select source account..."
                  }
                  disabled={companyAccounts.length <= 1}
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Transfer To (User)
                </label>
                <CustomSelect
                  value={receiver}
                  onChange={(val) => {
                    setReceiver(val);
                    setDestAcc("");
                  }}
                  options={userOptions}
                  placeholder="Select user..."
                  disabled={users.length === 0}
                />
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8 flex flex-col gap-6 transition-colors duration-300 hover:bg-slate-50/30">
              <div className="flex items-center gap-2 text-distributor-700 mb-1">
                <CreditCard className="w-4 h-4" />
                <h3 className="text-sm font-black tracking-wide uppercase">
                  Destination & Value
                </h3>
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Destination Account
                </label>
                <CustomSelect
                  value={destAcc}
                  onChange={setDestAcc}
                  options={destOptions}
                  placeholder={
                    !receiver
                      ? "Select user first..."
                      : destAccounts.length === 0
                        ? "No accounts found"
                        : "Select destination..."
                  }
                  disabled={!receiver || destAccounts.length <= 1}
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:ring-4 focus:ring-distributor-500/10 focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8 flex flex-col gap-6 bg-slate-50/30 transition-colors duration-300 hover:bg-slate-50/80">
              <div className="flex items-center gap-2 text-distributor-700 mb-1">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-black tracking-wide uppercase">
                  Execution Details
                </h3>
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Payment Mode
                </label>
                <CustomSelect
                  value={mode}
                  onChange={(val) => {
                    setMode(val);
                    setReferenceId("");
                  }}
                  options={modeOptions}
                  placeholder="Select mode..."
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {getDynamicRefLabel()}
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder={`Enter ${getDynamicRefLabel().toLowerCase()}...`}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-distributor-500/10 focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons: Always visible at bottom of card */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end items-center gap-3 rounded-b-2xl shrink-0">
          <button
            onClick={() => {
              setReceiver("");
              setDestAcc("");
              setAmount("");
              setReferenceId("");
              setDestAccounts([]);
            }}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-md transition-colors border border-slate-200 sm:border-none"
          >
            Clear Fields
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={
              !sourceAcc || !receiver || !destAcc || !amount || !referenceId
            }
            className="w-full sm:w-auto px-8 py-2.5 bg-distributor-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-distributor-700 disabled:opacity-50 transition-all"
          >
            Review & Confirm
          </button>
        </div>
      </div>

      {/* ─── ADD BANK ACCOUNT MODAL ─── */}
      {showAddBank && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={handleCloseAddBank} />

          <div
            className={`relative w-full max-w-2xl bg-white rounded-md shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-200/50 transition-all ${isClosingBank ? "animate-out zoom-out-95 fade-out duration-200" : "animate-in zoom-in-90 fade-in duration-200"}`}
          >
            <div className="flex justify-between items-center bg-white border-b border-slate-100 p-5 px-6 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Add Bank Account
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Register a new bank account to the system.
                </p>
              </div>
              <button
                onClick={handleCloseAddBank}
                disabled={isSubmittingBank}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50 flex-1 space-y-6">
              <div className="space-y-2 group bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-distributor-600" />
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Account Owner
                  </label>
                </div>
                <CustomSelect
                  value={
                    newBank.targetType === "COMPANY"
                      ? "self"
                      : newBank.subBrokerId
                  }
                  onChange={(val) => {
                    if (val === "self") {
                      setNewBank({
                        ...newBank,
                        targetType: "COMPANY",
                        subBrokerId: "",
                        arnId: "",
                      });
                    } else {
                      const selectedUser = users.find((r) => r.id === val);
                      setNewBank({
                        ...newBank,
                        targetType: "SUB_BROKER",
                        subBrokerId: val,
                        arnId: selectedUser?.arn_id || "",
                      });
                    }
                  }}
                  options={ownerOptions}
                  placeholder="Select owner..."
                  disabled={isSubmittingBank}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <input
                  type="text"
                  value={newBank.bankName}
                  onChange={(e) =>
                    setNewBank({ ...newBank, bankName: e.target.value })
                  }
                  placeholder="Bank Name"
                  disabled={isSubmittingBank}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
                <input
                  type="text"
                  value={newBank.accountNumber}
                  onChange={(e) =>
                    setNewBank({ ...newBank, accountNumber: e.target.value })
                  }
                  placeholder="Account Number"
                  disabled={isSubmittingBank}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
                <input
                  type="text"
                  value={newBank.accountHolderName}
                  onChange={(e) =>
                    setNewBank({
                      ...newBank,
                      accountHolderName: e.target.value,
                    })
                  }
                  placeholder="Account Holder Name"
                  disabled={isSubmittingBank}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
                <input
                  type="text"
                  value={newBank.ifscCode}
                  onChange={(e) =>
                    setNewBank({
                      ...newBank,
                      ifscCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="IFSC Code"
                  disabled={isSubmittingBank}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold uppercase focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
                <input
                  type="text"
                  value={newBank.upiId}
                  onChange={(e) =>
                    setNewBank({
                      ...newBank,
                      upiId: e.target.value.toLowerCase(),
                    })
                  }
                  placeholder="UPI ID (Optional)"
                  disabled={isSubmittingBank}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold sm:col-span-2 focus:border-distributor-500 outline-none transition-all shadow-sm"
                />
              </div>

              <div
                onClick={() => {
                  if (!isSubmittingBank)
                    setNewBank({ ...newBank, isPrimary: !newBank.isPrimary });
                }}
                className={`flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all ${newBank.isPrimary ? "bg-distributor-50 border-distributor-200" : "bg-white border-slate-200 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${newBank.isPrimary ? "bg-distributor-600 text-white" : "bg-slate-100 text-slate-400"}`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold transition-colors ${newBank.isPrimary ? "text-distributor-800" : "text-slate-700"}`}
                    >
                      Set as Primary Account
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Default for payouts.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${newBank.isPrimary ? "bg-distributor-500" : "bg-slate-200"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${newBank.isPrimary ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 px-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={handleCloseAddBank}
                disabled={isSubmittingBank}
                className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBank}
                disabled={
                  !newBank.targetType ||
                  !newBank.bankName ||
                  !newBank.accountNumber ||
                  !newBank.accountHolderName ||
                  !newBank.ifscCode ||
                  isSubmittingBank
                }
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-distributor-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-distributor-700 disabled:opacity-50 transition-all"
              >
                {isSubmittingBank ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSubmittingBank ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRANSFER CONFIRMATION MODAL ─── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={handleCloseConfirm} />

          <div
            className={`relative w-full max-w-4xl bg-white rounded-md shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-200/50 transition-all ${isClosingConfirm ? "animate-out zoom-out-95 fade-out duration-200" : "animate-in zoom-in-90 fade-in duration-200"}`}
          >
            <div className="flex justify-between items-center bg-white border-b border-slate-100 p-5 px-6 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Finalize Payout
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Please review the details before committing.
                </p>
              </div>
              <button
                onClick={handleCloseConfirm}
                disabled={isSubmittingTransfer}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50 flex-1">
              <div className="text-center mb-8 sm:mb-10 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Amount to Transfer
                </p>
                <div className="w-full px-2">
                  <span className="text-4xl sm:text-6xl font-black text-distributor-700 tracking-tighter">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
                  <span className="text-[10px] font-bold text-distributor-700 uppercase bg-distributor-50 border border-distributor-100 px-4 py-2 rounded-md">
                    Mode: {mode}
                  </span>
                  <span className="text-[10px] font-bold text-distributor-700 uppercase bg-distributor-50 border border-distributor-100 px-4 py-2 rounded-md">
                    Ref: {referenceId}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 max-w-3xl mx-auto">
                <div className="flex-1 bg-white border border-slate-200 rounded-md p-5 w-full text-center shadow-sm">
                  <div className="w-10 h-10 bg-slate-50 text-slate-500 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    From Account
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedSourceObj?.bank_name}
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    {selectedSourceObj?.account_number}
                  </p>
                </div>

                <div className="hidden sm:flex flex-col items-center shrink-0 text-slate-300">
                  <ArrowRight className="w-8 h-8" />
                </div>

                <div className="flex-1 bg-distributor-50/50 border border-distributor-200 rounded-md p-5 w-full text-center shadow-sm">
                  <div className="w-10 h-10 bg-white text-distributor-600 border border-distributor-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-distributor-600/70 uppercase mb-1">
                    To User
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedUserObj?.name}
                  </p>
                  <p className="text-xs font-mono text-distributor-600/70 mt-1">
                    {selectedDestObj?.account_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 px-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={handleCloseConfirm}
                disabled={isSubmittingTransfer}
                className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmitLedger}
                disabled={isSubmittingTransfer}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-distributor-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-distributor-700 disabled:opacity-50 transition-all"
              >
                {isSubmittingTransfer ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSubmittingTransfer ? "Submitting..." : "Submit Ledger Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
