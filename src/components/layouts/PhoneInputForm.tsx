"use client";

import React, { useState } from 'react';

interface PhoneInputFormProps {
  onSubmit: (phoneInfo: { countryCode: string; number: string }) => void;
}

export default function PhoneInputForm({ onSubmit }: PhoneInputFormProps) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length > 5) {
      onSubmit({ countryCode, number: phoneNumber });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
            Phone number
          </label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="appearance-none block w-full pl-3 pr-8 py-3 border border-border rounded-xl bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 sm:text-sm cursor-pointer"
              >
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (IN)</option>
                <option value="+61">+61 (AU)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <input
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="appearance-none block w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 sm:text-sm"
                placeholder="234 567 8900"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={phoneNumber.length < 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] font-medium text-white bg-primary hover:bg-primary-600 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
          >
            Send OTP
          </button>
        </div>
      </form>
    </div>
  );
}
