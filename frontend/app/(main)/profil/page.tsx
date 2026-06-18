"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function ProfilRoute() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-title text-[#000c34] text-2xl mb-8">Mon Profil</h1>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#27509b] to-[#000c34] px-6 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{user.firstName} {user.lastName}</div>
            <div className="text-white/60 text-sm">@{user.username}</div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Email</label>
            <p className="text-[#000c34] font-semibold mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Nom d&apos;utilisateur</label>
            <p className="text-[#000c34] font-semibold mt-1">@{user.username}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Roles</label>
            <div className="flex gap-2 mt-1">
              {user.roles.map(r => (
                <span key={r} className="inline-block bg-[#27509b]/10 text-[#27509b] text-xs font-black px-3 py-1 rounded-full tracking-widest">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6">
          <button
            onClick={() => { logout(); router.replace("/blog"); }}
            className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
