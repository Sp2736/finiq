import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinIQ",
  description: "Modern financial intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-FOUC Script: Runs before React hydration to apply saved CSS vars immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              var t = localStorage.getItem('finiq_theme_vars');
              if(t){
                var v = JSON.parse(t);
                var r = document.documentElement;
                Object.keys(v).forEach(function(k){ r.style.setProperty(k, v[k]); });
              }
            } catch(e){}
          })();
        `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
