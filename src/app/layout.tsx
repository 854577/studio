
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
    <html lang="en" className=""> {/* Removed "dark" class to default to light theme */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {/* Removed star background divs */}
        <div className="relative z-10 min-h-screen"> {/* Ensure content is above any potential fixed/absolute background elements */}
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
