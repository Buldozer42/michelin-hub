"use client";

import Header from "../components/Header";
import SiteFooter from "../components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
