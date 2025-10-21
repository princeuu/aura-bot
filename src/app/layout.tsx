import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurabot",
  description: "Your personal AI chat companion",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 dark:from-neutral-900 dark:to-neutral-950 dark:text-gray-100 transition-colors">
        {/* Full-width header */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-black/5 dark:bg-neutral-900/60 dark:border-white/10">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />
              <span className="font-semibold tracking-tight">AuraGPT</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/threads"
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                History
              </Link>
              <a
                href="https://github.com/princeuu?tab=repositories"
                target="_blank"
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        {/* Full-width main (no max-w) */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>

        {/* Full-width footer */}
        <footer className="border-t border-black/5 dark:border-white/10 mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AuraGPT · Built with Next.js + Firebase
        </footer>
      </body>
    </html>
  );
}
