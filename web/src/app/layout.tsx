import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/sw-register";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FACE Prep Archive",
  description:
    "Browse the FACE Prep Freshsales archive — colleges, contacts, and deals.",
  applicationName: "FACE Prep Archive",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FP Archive",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
