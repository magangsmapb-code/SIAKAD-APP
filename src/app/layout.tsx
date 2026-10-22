import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { INSTITUTION } from "@/lib/constants";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: {
    default: `${INSTITUTION.systemName} | ${INSTITUTION.name}`,
    template: `%s | ${INSTITUTION.systemName} ${INSTITUTION.shortName}`,
  },
  description: `${INSTITUTION.tagline} - ${INSTITUTION.name}, Ponorogo, Jawa Timur.`,
  keywords: [
    "SIAKAD",
    "Absensi Digital",
    "SMA PB Ngrayun",
    "Ponorogo",
    "RFID Presensi",
    "Presensi Siswa",
  ],
  authors: [{ name: "Tim IT SMA PB Ngrayun" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans antialiased text-foreground"
        suppressHydrationWarning
      >
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
