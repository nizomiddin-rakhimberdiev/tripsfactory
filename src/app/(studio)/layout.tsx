import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./studio.css";
import "leaflet/dist/leaflet.css";

// Same face as the public site's UI layer — one voice across both surfaces.
const inter = Inter({
  variable: "--font-studio",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: "TripsFactory Studio",
  robots: { index: false, follow: false },
};

export default function StudioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={inter.variable}>
      <body className="s-root">{children}</body>
    </html>
  );
}
