"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EmailPasswordForm from "@/components/layouts/EmailPasswordForm";
import InvestorFluidBackground from "@/components/layouts/InvestorFluidBackground";
import { authService } from "@/services/auth.service";
import { setAuthCookies } from "@/lib/authClient";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const portalName = "Investor";

  const handleLogin = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.loginInvestor(identifier, password);

      // Access via response.data.investor
      if (response.data?.investor?.logo_base64) {
        localStorage.setItem(
          "company-logo-inv",
          response.data.investor.logo_base64,
        );
      }

      // Navigate to the exact location of the token in your JSON
      const actualToken = response.data?.access_token;

      if (!actualToken) {
        throw new Error("API connected, but access_token was missing in the data object.");
      }

      // Store company logo so InvestorSidebar can display it without extra API calls
      if (response.data?.investor?.logo_base64) {
        try {
          localStorage.setItem("company-logo-inv", response.data.investor.logo_base64);
        } catch (_) {}
      }

      // Store access token
      setAuthCookies(actualToken, undefined, "investor");

      // Redirect seamlessly to the dashboard
      router.push("/investor");
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(
        error.message ||
          "Invalid credentials. Please check your identifier and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg)] font-sans selection:bg-[var(--fin-brand-500)]/20 selection:text-[var(--fin-brand-700)] relative flex items-center justify-center overflow-x-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--fin-page-bg)] via-[var(--fin-content-surface)] to-[var(--fin-skeleton-base)]" />
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px] pointer-events-none" />

      <div
        className="absolute top-0 left-0 w-full lg:w-[65%] h-full opacity-[0.85] pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 40%, transparent 100%)",
        }}
      >
        <InvestorFluidBackground />
      </div>

      <div className="absolute -top-40 -left-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[var(--fin-brand-500)]/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-[var(--fin-brand-600)]/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12 lg:gap-20">
        {/* ─── LEFT COLUMN: GRAPHICS & TEXT ─── */}
        <div className="w-full lg:w-3/5 flex flex-col justify-center items-center md:items-start">
          <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gradient-to-br from-[var(--fin-brand-500)] to-[var(--fin-brand-700)] flex items-center justify-center shadow-lg shadow-[var(--fin-brand-600)]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--fin-table-bg)]/30 transform -skew-x-12 -translate-x-full animate-[shine_4s_infinite]" />
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--fin-btn-primary-text)] relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
              FinIQ{" "}
              <span className="text-[var(--fin-brand-600)] font-light">
                | {portalName}
              </span>
            </div>
          </div>

          <div className="hidden md:block w-full">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-[var(--fin-heading-primary)] leading-[1.1] mb-4 sm:mb-6">
              Financial Edge, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-500)] via-[var(--fin-brand-600)] to-[var(--fin-brand-400)]">
                Refined.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[var(--fin-body-text)] font-medium max-w-xl leading-relaxed mb-8 sm:mb-12">
              The exclusive platform built for our investors to manage, analyze,
              and scale portfolios with absolute precision.
            </p>

            <div className="relative w-full max-w-lg h-48 sm:h-64 perspective-1000">
              <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-full h-40 sm:h-48 bg-[var(--fin-table-bg)]/80 border-2 border-[var(--fin-border-subtle)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 shadow-2xl backdrop-blur-md p-6 overflow-hidden">
                <svg
                  className="w-full h-full opacity-60 text-[var(--fin-brand-500)]"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              <div className="absolute top-0 left-0 w-[90%] h-32 sm:h-40 bg-[var(--fin-table-bg)]/90 border-2 border-[var(--fin-border-subtle)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.20)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--fin-brand-500)]/15 to-transparent opacity-100" />
                <div className="flex justify-between items-center relative z-10">
                  <div className="h-2.5 w-16 sm:w-20 bg-[var(--fin-heading-primary)]/80 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-badge-success-text)] animate-pulse shadow-[0_0_12px_var(--fin-badge-success-text)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-heading-primary)]" />
                  </div>
                </div>
                <div className="w-[120%] -ml-[10%] h-16 sm:h-20 relative z-10">
                  <svg
                    viewBox="0 0 200 50"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,25 C30,10 50,40 80,25 C110,10 140,45 170,25 C190,15 200,25 200,25"
                      fill="none"
                      stroke="url(#wave-grad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="drop-shadow-[0_8px_8px_var(--fin-brand-500)] transition-all duration-1000 group-hover:stroke-[var(--fin-brand-500)]"
                    />
                    <defs>
                      <linearGradient
                        id="wave-grad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="0.5"
                        />
                        <stop
                          offset="50%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="0.5"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="absolute -top-4 sm:-top-6 right-0 sm:right-8 bg-[var(--fin-table-bg)] border-2 border-[var(--fin-border-subtle)] rounded-md shadow-xl shadow-[0_8px_24px_var(--fin-modal-shadow)] p-3 sm:p-4 transform rotate-x-12 -rotate-y-12 rotate-z-6 animate-[float_6s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--fin-badge-success-bg)] flex items-center justify-center border border-[var(--fin-badge-success-border)]">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fin-badge-success-text)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-[var(--fin-aux-text)] uppercase tracking-wider">
                      Access
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-[var(--fin-heading-primary)]">
                      Investor Portal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LOGIN CARD ─── */}
        <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative z-20">
          <div
            className="w-full max-w-[440px] md:max-w-[500px] lg:max-w-[440px] bg-[var(--fin-table-bg)]/70 backdrop-blur-2xl border border-[var(--fin-border-subtle)]/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 relative overflow-hidden"
            style={{
              animation:
                "slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Subtle Inner Glow Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--fin-brand-500)]/50 to-transparent opacity-80" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--fin-brand-400)]/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[var(--fin-brand-600)]/10 blur-3xl rounded-full pointer-events-none" />

            <div
              style={{ animation: "fadeIn 0.4s ease-out forwards" }}
              className="relative z-10"
            >
              <div className="mb-8 sm:mb-10 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-2">
                  Welcome back
                </h2>
                <p className="text-sm text-[var(--fin-body-text)] font-medium">
                  Enter your credentials to securely access your portfolio.
                </p>
              </div>

              <EmailPasswordForm onSubmit={handleLogin} isLoading={isLoading} />

              <div className="mt-8 sm:mt-10 text-center">
                <span className="text-[var(--fin-body-text)] font-medium text-sm">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="#"
                  className="font-bold text-[var(--fin-brand-600)] hover:text-[var(--fin-brand-700)] transition-colors duration-200 text-sm border-b-2 border-[var(--fin-brand-600)]/20 hover:border-[var(--fin-brand-600)]/60 pb-0.5"
                >
                  Request access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        @keyframes float {
          0%, 100% { transform: translateY(0)     rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
          50%       { transform: translateY(-10px) rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
        }
        .perspective-1000 { perspective: 1000px; }
      `,
        }}
      />
    </div>
  );
}

// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import EmailPasswordForm from "@/components/layouts/EmailPasswordForm";
// import InvestorFluidBackground from "@/components/layouts/InvestorFluidBackground";
// import { authService } from "@/services/auth.service";
// import { setAuthCookie } from "@/lib/authClient";

// export default function LoginPage() {
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();
//   const portalName = "Investor";

//   const handleLogin = async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const response = await authService.loginWithEmail(email, password);
//       console.log("Authentication successful:", response.user);

//       // 1. Set the cookie so the middleware authenticates the user
//       setAuthCookie(response.token);

//       // 2. Redirect seamlessly to the dashboard
//       router.push('/investor');

//     } catch (error) {
//       console.error("Login failed:", error);
//       // We keep the error alert for testing feedback if credentials fail
//       alert("Invalid credentials. Try abc@gmail.com / pwd123");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary relative flex items-center justify-center overflow-x-hidden">

//       {/* Background layers */}
//       <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--fin-page-bg)] via-[var(--fin-content-surface)] to-[var(--fin-skeleton-base)]" />
//       <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px] pointer-events-none" />

//       <div
//         className="absolute top-0 left-0 w-full lg:w-[65%] h-full opacity-[0.85] pointer-events-none z-0"
//         style={{
//           maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
//           WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
//         }}
//       >
//         <InvestorFluidBackground />
//       </div>

//       <div className="absolute -top-40 -left-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none z-0" />
//       <div className="absolute bottom-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-[var(--fin-badge-admin-bg)]/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none z-0" />

//       <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12 lg:gap-20">

//         {/* ── LEFT: Branding ─────────────────────────────────────────────── */}
//         <div className="w-full lg:w-3/5 flex flex-col justify-center items-center md:items-start">
//           <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
//             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gradient-to-br from-primary to-[var(--fin-brand-700)] flex items-center justify-center shadow-lg shadow-primary/30 relative overflow-hidden">
//               <div className="absolute inset-0 bg-[var(--fin-table-bg)]/30 transform -skew-x-12 -translate-x-full animate-[shine_4s_infinite]" />
//               <svg
//                 className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--fin-btn-primary-text)] relative z-10"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//               </svg>
//             </div>
//             <div className="text-3xl sm:text-4xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
//               FinIQ <span className="text-primary font-light">| {portalName}</span>
//             </div>
//           </div>

//           <div className="hidden md:block w-full">
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-[var(--fin-heading-primary)] leading-[1.1] mb-4 sm:mb-6">
//               Financial Edge, <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[var(--fin-brand-600)] to-primary/80">
//                 Refined.
//               </span>
//             </h1>

//             <p className="text-base sm:text-lg lg:text-xl text-[var(--fin-body-text)] font-medium max-w-xl leading-relaxed mb-8 sm:mb-12">
//               The exclusive platform built for our investors to manage,
//               analyze, and scale portfolios with absolute precision.
//             </p>

//             {/* Isometric glass stack illustration */}
//             <div className="relative w-full max-w-lg h-48 sm:h-64 perspective-1000">
//               <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-full h-40 sm:h-48 bg-[var(--fin-table-bg)]/80 border-2 border-[var(--fin-border-subtle)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 shadow-2xl backdrop-blur-md p-6 overflow-hidden">
//                 <svg className="w-full h-full opacity-60 text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
//                   <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
//                     <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="1" />
//                   </pattern>
//                   <rect width="100" height="100" fill="url(#grid)" />
//                 </svg>
//               </div>

//               <div className="absolute top-0 left-0 w-[90%] h-32 sm:h-40 bg-[var(--fin-table-bg)]/90 border-2 border-[var(--fin-border-subtle)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.20)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden group">
//                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 to-transparent opacity-100" />
//                 <div className="flex justify-between items-center relative z-10">
//                   <div className="h-2.5 w-16 sm:w-20 bg-[var(--fin-heading-primary)]/80 rounded-full" />
//                   <div className="flex gap-2">
//                     <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-badge-success-text)] animate-pulse shadow-[0_0_12px_var(--fin-badge-success-text)]" />
//                     <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-heading-primary)]" />
//                   </div>
//                 </div>
//                 <div className="w-[120%] -ml-[10%] h-16 sm:h-20 relative z-10">
//                   <svg viewBox="0 0 200 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
//                     <path
//                       d="M0,25 C30,10 50,40 80,25 C110,10 140,45 170,25 C190,15 200,25 200,25"
//                       fill="none"
//                       stroke="url(#wave-grad)"
//                       strokeWidth="6"
//                       strokeLinecap="round"
//                       className="drop-shadow-[0_8px_8px_var(--fin-brand-500)] transition-all duration-1000 group-hover:stroke-[var(--fin-brand-500)]"
//                     />
//                     <defs>
//                       <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
//                         <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
//                         <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
//                         <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
//                       </linearGradient>
//                     </defs>
//                   </svg>
//                 </div>
//               </div>

//               <div className="absolute -top-4 sm:-top-6 right-0 sm:right-8 bg-[var(--fin-table-bg)] border-2 border-[var(--fin-border-subtle)] rounded-md shadow-xl shadow-[0_8px_24px_var(--fin-modal-shadow)] p-3 sm:p-4 transform rotate-x-12 -rotate-y-12 rotate-z-6 animate-[float_6s_ease-in-out_infinite]">
//                 <div className="flex items-center gap-2 sm:gap-3">
//                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--fin-badge-success-bg)] flex items-center justify-center border border-[var(--fin-badge-success-border)]">
//                     <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fin-badge-success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                     </svg>
//                   </div>
//                   <div>
//                     <p className="text-[9px] sm:text-[10px] font-extrabold text-[var(--fin-aux-text)] uppercase tracking-wider">Access</p>
//                     <p className="text-xs sm:text-sm font-extrabold text-[var(--fin-heading-primary)]">Investor Portal</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── RIGHT: Login card ───────────────────────────────────────────── */}
//         <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative z-20">
//           <div
//             className="w-full max-w-[440px] md:max-w-[500px] lg:max-w-[440px] bg-[var(--fin-table-bg)]/95 backdrop-blur-3xl border border-[var(--fin-border-subtle)] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 relative overflow-hidden"
//             style={{ animation: "slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
//           >
//             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80" />

//             <div style={{ animation: "fadeIn 0.4s ease-out forwards" }}>
//               <div className="mb-8 sm:mb-10 text-center lg:text-left">
//                 <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-2">
//                   Welcome back
//                 </h2>
//                 <p className="text-sm text-[var(--fin-body-text)] font-medium">
//                   Enter your credentials to securely access your portfolio.
//                 </p>
//               </div>

//               <EmailPasswordForm onSubmit={handleLogin} isLoading={isLoading} />

//               <div className="mt-8 sm:mt-10 text-center">
//                 <span className="text-[var(--fin-body-text)] font-medium text-sm">Don&apos;t have an account? </span>
//                 <Link
//                   href="#"
//                   className="font-bold text-primary hover:text-primary/80 transition-colors duration-200 text-sm border-b-2 border-primary/20 hover:border-primary/60 pb-0.5"
//                 >
//                   Request access
//                 </Link>
//               </div>
//             </div>

//             <div className="mt-8 sm:mt-12 pt-6 border-t border-[var(--fin-border)]/80 flex flex-col items-center justify-center gap-3">
//               <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
//                 <svg className="w-4 h-4 text-[var(--fin-badge-success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                 </svg>
//                 <span>End-to-End Encrypted</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style dangerouslySetInnerHTML={{ __html: `
//         @keyframes slideFadeUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; }
//           to   { opacity: 1; }
//         }
//         @keyframes shine {
//           0%   { left: -100%; }
//           20%  { left: 200%; }
//           100% { left: 200%; }
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0)     rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
//           50%       { transform: translateY(-10px) rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
//         }
//         .perspective-1000 { perspective: 1000px; }
//       `}} />
//     </div>
//   );
// }
