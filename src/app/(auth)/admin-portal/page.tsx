"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInputForm from "@/components/layouts/PhoneInputForm";
import OTPVerificationForm from "@/components/layouts/OTPVerificationForm";
import FluidBackground from "@/components/layouts/FluidBackground";
import { setAuthCookie } from "@/lib/authClient";

type Step = "phone" | "otp";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneInfo, setPhoneInfo] = useState({ countryCode: "+1", number: "" });
  const router = useRouter();

  const activeRole = "Company Admin";
  const portalName = "Admin";

  const handlePhoneSubmit = (info: { countryCode: string; number: string }) => {
    setPhoneInfo(info);
    setStep("otp");
  };

  const handleOTPVerify = (otp: string) => {
    if (otp === "1234") {
      setAuthCookie("mock-admin-token-1234");
      router.push("/admin");
    } else {
      alert("Invalid OTP. Try 1234 for testing.");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary relative flex items-center justify-center overflow-x-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-slate-200" />
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px] pointer-events-none" />

      <div
        className="absolute top-0 left-0 w-full lg:w-[65%] h-full opacity-[0.85] pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
        }}
      >
        <FluidBackground />
      </div>

      <div className="absolute -top-40 -left-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-rose-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-indigo-500/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12 lg:gap-20">
        
        <div className="w-full lg:w-3/5 flex flex-col justify-center items-center md:items-start">
          <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full animate-[shine_4s_infinite]" />
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-3xl font-black tracking-tight text-slate-900">
              FinIQ <span className="text-rose-600 font-light">| {portalName}</span>
            </div>
          </div>

          <div className="hidden md:block w-full">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-6">
              System Control, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-slate-800 to-slate-900">
                Secured.
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-medium max-w-xl leading-relaxed mb-8 sm:mb-12">
              Internal infrastructure access. Please verify your identity to manage platform operations and user data.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative z-20">
          <div
            className="w-full max-w-[440px] md:max-w-[500px] lg:max-w-[440px] bg-white/95 backdrop-blur-3xl border border-white shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 relative overflow-hidden"
            style={{ animation: "slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-80" />

            {step === "phone" && (
              <div style={{ animation: "fadeIn 0.4s ease-out forwards" }}>
                <div className="mb-8 sm:mb-10 text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
                    Admin Portal
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    Enter your authorized phone number.
                  </p>
                </div>

                <div className="relative z-10">
                  <PhoneInputForm onSubmit={handlePhoneSubmit} />
                </div>
              </div>
            )}

            {step === "otp" && (
              <div style={{ animation: "slideFadeUp 0.4s ease-out forwards" }}>
                <OTPVerificationForm
                  onVerify={handleOTPVerify}
                  onBack={() => setStep("phone")}
                  phoneInfo={phoneInfo}
                />
              </div>
            )}

            <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-200/80 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Restricted Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shine {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
      `}} />
    </div>
  );
}