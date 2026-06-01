import { useState, useRef, useEffect } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import Link from "next/link";

const CALCULATOR_OPTIONS = [
  { name: "MF Returns", path: "/investor/calculators/mf-returns" },
  { name: "Goal Calculator", path: "/investor/calculators/goal" },
  { name: "Fixed Deposit", path: "/investor/calculators/fd" },
  { name: "SWP Calculator", path: "/investor/calculators/swp" },
  { name: "STP Calculator", path: "/investor/calculators/stp" },
  { name: "Reverse EMI", path: "/investor/calculators/reverse-emi" },
];

// todo: change the URLs to open the calculator pages INSIDE the investor role

const CalculatorsModules = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-slate-700 font-bold text-sm shadow-sm hover:border-distributor-300 transition-all active:scale-95"
      >
        <Calculator className="w-4 h-4 text-distributor-600" />
        <span>Calculators</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="py-1">
            {CALCULATOR_OPTIONS.map((opt) => (
              <li key={opt.path}>
                <Link
                  href={opt.path}
                  className="block px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-distributor-50 hover:text-distributor-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {opt.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalculatorsModules;