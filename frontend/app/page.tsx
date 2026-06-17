"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import BlogPage from "./components/blog/BlogPage";
import ChallengePage from "./components/challenge/ChallengePage";
import MonVeloPage from "./components/monvelo/MonVeloPage";

export type Tab = "blog" | "challenge" | "monvelo";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("blog");

  const handleTabChange = (tab: Tab) => {
    // Mon Vélo is personal data — requires authentication
    if (tab === "monvelo" && !user) {
      router.push("/login");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0]">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1">
        {activeTab === "blog" && <BlogPage />}
        {activeTab === "challenge" && <ChallengePage />}
        {activeTab === "monvelo" && <MonVeloPage />}
      </main>
    </div>
  );
}