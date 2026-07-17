import type { Metadata } from "next";
import { Rubik, Unbounded } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  variable: "--font-rubik",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Коллекция LEGO",
  description: "Каталог наборов LEGO и ваша личная коллекция",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${rubik.variable} ${unbounded.variable}`}>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              <span className="studs"><i /><i /><i /></span> Коллекция LEGO
            </Link>
            <nav className="nav">
              <Link href="/">Каталог</Link>
              <Link href="/mine">Моя коллекция</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
