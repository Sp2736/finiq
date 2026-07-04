"use client";

import { useEffect, useState } from "react";

/**
 * A hook to safely retrieve the company logo from localStorage.
 * It handles Next.js hydration by defaulting to an empty string on the server.
 */
export function useCompanyLogo() {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to read the logo stored during the login process
    try {
      const storedLogo = localStorage.getItem("company_logo_base64");
      if (storedLogo) {
        setLogoBase64(storedLogo);
      }
    } catch (error) {
      console.warn("Failed to access localStorage for company logo.");
    }
  }, []);

  return logoBase64;
}