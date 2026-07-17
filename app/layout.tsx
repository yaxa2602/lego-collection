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
              <svg className="logo-brick" width="40" height="33" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="lgBody" x1="24" y1="13" x2="24" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff3d3f" />
                    <stop offset="1" stopColor="#c90f11" />
                  </linearGradient>
                  <radialGradient id="lgStud" cx="0.5" cy="0.3" r="0.8">
                    <stop stopColor="#ff8688" />
                    <stop offset="1" stopColor="#df1416" />
                  </radialGradient>
                </defs>
                <g fill="#cf1214">
                  <rect x="5" y="8.5" width="8" height="8" rx="2" />
                  <rect x="15" y="8.5" width="8" height="8" rx="2" />
                  <rect x="25" y="8.5" width="8" height="8" rx="2" />
                  <rect x="35" y="8.5" width="8" height="8" rx="2" />
                </g>
                <rect x="4" y="14" width="40" height="22" rx="3.5" fill="url(#lgBody)" />
                <rect x="4.6" y="14.6" width="38.8" height="20.8" rx="3" fill="none" stroke="#fff" strokeOpacity="0.16" />
                <g>
                  <ellipse cx="9" cy="8.5" rx="4" ry="2.3" fill="url(#lgStud)" />
                  <ellipse cx="19" cy="8.5" rx="4" ry="2.3" fill="url(#lgStud)" />
                  <ellipse cx="29" cy="8.5" rx="4" ry="2.3" fill="url(#lgStud)" />
                  <ellipse cx="39" cy="8.5" rx="4" ry="2.3" fill="url(#lgStud)" />
                </g>
                <g fill="#fff" opacity="0.5">
                  <ellipse cx="7.9" cy="7.9" rx="1.4" ry="0.7" />
                  <ellipse cx="17.9" cy="7.9" rx="1.4" ry="0.7" />
                  <ellipse cx="27.9" cy="7.9" rx="1.4" ry="0.7" />
                  <ellipse cx="37.9" cy="7.9" rx="1.4" ry="0.7" />
                </g>
              </svg>
              <span className="wordmark">Коллекция&nbsp;<b>LEGO</b></span>
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
