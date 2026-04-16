"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OTPVerificationFormProps {
  onVerify: (otp: string) => void;
  onBack: () => void;
  phoneInfo: { countryCode: string; number: string };
}

export default function OTPVerificationForm({ onVerify, onBack, phoneInfo }: OTPVerificationFormProps) {
  const router = useRouter(); // Initialize the App Router navigation hook
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (status !== 'idle') setStatus('idle');
    const digit = value.replace(/\D/g, '');
    if (!digit && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
    if (digit && index === 3 && newOtp.every(char => char !== '')) {
      triggerVerification(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = (code: string) => {
    setStatus('loading');
    
    setTimeout(() => {
      if (code === '1234') { 
        setStatus('success');
        
        // SET DUMMY COOKIE: This allows the middleware to see you as logged in
        // In production, your backend API would set an HttpOnly cookie instead
        document.cookie = "auth-token=true; path=/";
        
        // On Success: Push to the dashboard
        router.push('/investor');
        
      } else {
        setStatus('error');
        setOtp(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }, 1500);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (status !== 'idle') setStatus('idle');
    
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 3);
    inputRefs.current[focusIndex]?.focus();
    
    if (pastedData.length === 4) {
        triggerVerification(pastedData);
    }
  };

  const getInputBorderColor = () => {
    if (status === 'error') return 'border-rose-400 text-rose-600 bg-rose-50 focus:border-rose-500 focus:ring-rose-500/20';
    if (status === 'success') return 'border-emerald-400 text-emerald-600 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500/20';
    return 'border-slate-200 text-slate-900 bg-white focus:bg-white focus:border-indigo-400 focus:ring-indigo-100';
  };

  return (
    <div className="w-full flex flex-col">
      <button onClick={onBack} className="self-start mb-4 md:mb-6 text-xs md:text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <div className="text-center lg:text-left mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1 md:mb-2">Verify device</h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium">
          Code sent to <span className="text-slate-800 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded-md ml-1">{phoneInfo.number.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</span>
        </p>
      </div>

      <div className="w-full relative">
        <div className={`flex justify-between gap-2 md:gap-4 max-w-[260px] md:max-w-[320px] mx-auto lg:mx-0 relative ${status === 'error' ? 'animate-[errorShake_0.5s_both]' : ''}`}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={status === 'loading' || status === 'success'}
              className={`w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 text-center text-xl md:text-3xl font-bold bg-white border-2 rounded-xl md:rounded-2xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-300 ${getInputBorderColor()}`}
            />
          ))}
        </div>

        <div className="h-5 md:h-6 mt-1.5 md:mt-3 flex items-center justify-center lg:justify-start">
          {status === 'error' && <p className="text-rose-500 text-[11px] md:text-sm font-bold animate-in fade-in duration-300">Invalid code.</p>}
        </div>

        <button
          onClick={() => triggerVerification(otp.join(''))}
          disabled={otp.some(char => char === '') || status === 'loading' || status === 'success'}
          className="w-full py-2.5 md:py-4 px-4 mt-2 md:mt-4 bg-indigo-500 text-white text-sm md:text-base font-bold rounded-xl shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {status === 'loading' ? (
            <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : status === 'success' ? (
            'Verified ✓'
          ) : (
            'Verify Device'
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
      `}} />
    </div>
  );
}