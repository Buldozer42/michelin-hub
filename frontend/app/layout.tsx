import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Michelin Vélo Hub",
  description: "Votre compagnon vélo Michelin — trajets, performance et communauté.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${notoSans.variable} h-full`}>
      <body className="h-full bg-[#f4f4f6]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
