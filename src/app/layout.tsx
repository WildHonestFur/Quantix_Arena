import type {Metadata} from "next";
import {cookies} from 'next/headers';
import {Geist, Geist_Mono} from "next/font/google";
import {ThemeProvider} from "@lib/themeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quantix Arena",
  description: "Host and participate in competitions with ease.",
  icons: {
    icon: "/logo.png",
  }
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'eclipse';
  return (
    <html lang="en" className={theme}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
