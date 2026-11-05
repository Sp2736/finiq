import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinIQ - Wealth Management Suite",
  description: "Modern financial intelligence and portfolio management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Script: Runs before React hydration to apply saved CSS vars immediately */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              var cached = localStorage.getItem('finiq_active_theme');
              if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed.theme_name === "FinIQ Modern Slate" || parsed.active_theme_id === "th-slate-01" || (parsed.theme_variables && parsed.theme_variables['--fin-page-bg'] === '#0f172a')) {
                  localStorage.removeItem('finiq_active_theme');
                  return;
                }
                var vars = parsed.theme_variables || {};
                var root = document.documentElement;
                var keys = Object.keys(vars);
                for (var i = 0; i < keys.length; i++) {
                  root.style.setProperty(keys[i], vars[keys[i]]);
                }
              }
            } catch(e) {}
          })();
        `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
