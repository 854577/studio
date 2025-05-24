
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RPG himiko - Player Search',
  description: 'Search for player information in RPG himiko.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <div id="stars-small" className="stars-layer"></div>
        <div id="stars-medium" className="stars-layer"></div>
        <div id="stars-large" className="stars-layer"></div>
        <div className="relative z-10 bg-transparent min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
