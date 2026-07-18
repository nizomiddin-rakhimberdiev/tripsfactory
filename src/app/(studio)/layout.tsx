import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./studio.css";

const geist = Geist({
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
    <html lang="uz" className={geist.variable}>
      <body className="s-root">{children}</body>
    </html>
  );
}
