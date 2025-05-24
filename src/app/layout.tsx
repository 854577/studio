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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="star-layer-container">
          <div id="stars-small" className="stars"></div>
          <div id="stars-medium" className="stars"></div>
          <div id="stars-large" className="stars"></div>
        </div>
        {/* Ensure main content is above stars and can manage its own background or be transparent */}
        <div className="relative z-10 min-h-screen flex flex-col bg-transparent">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
