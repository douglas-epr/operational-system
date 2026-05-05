import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeScript from "@/components/theme/ThemeScript";
import "./globals.css";

/**
 * Type system (refresh 2026-04-29):
 *  - Inter   → body / UI (clean, characterful, OpenType alt-letterforms via cv02-cv11)
 *  - Manrope → display / headings (geometric humanist, gives the brand weight)
 *  - Geist Mono → tabular numerics + code blocks
 *
 * Per VibeUX 1.9: prefer sans-serif; Inter is the universal safe choice.
 * Per frontend-design: a distinctive display font pairs with a refined body.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blur Studio",
  description: "Blur Studio internal project management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The `<html>` class is set by `ThemeScript` BEFORE hydration. We don't
    // hard-code "dark" here anymore — `suppressHydrationWarning` lets React
    // accept the script-applied class without warning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            // `theme="system"` makes Sonner read the resolved scheme too.
            theme="system"
            richColors
            closeButton
            duration={8000}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
