"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useStrava } from "../../../context/StravaContext";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { exchangeCode } = useStrava();
  const [status, setStatus] = useState<"exchanging" | "success" | "error">("exchanging");
  const [errorMsg, setErrorMsg] = useState("");
  const exchanged = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (exchanged.current) return;

    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("Code d'autorisation manquant. Veuillez reessayer.");
      return;
    }

    exchanged.current = true;
    exchangeCode(code)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.replace("/challenge"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Erreur lors de la connexion Strava");
      });
  }, [authLoading, user, searchParams, router, exchangeCode]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {status === "exchanging" && (
        <>
          <div className="w-16 h-16 mx-auto bg-[#FC4C02]/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#FC4C02] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="font-title text-[#000c34] text-2xl mb-2">Connexion en cours...</h1>
          <p className="text-gray-500 text-sm">Echange du code d&apos;autorisation avec Strava</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-title text-[#000c34] text-2xl mb-2">Strava connecte !</h1>
          <p className="text-gray-500 text-sm">Redirection vers le Challenge...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-title text-[#000c34] text-2xl mb-2">Erreur de connexion</h1>
          <p className="text-red-500 text-sm mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.replace("/challenge")}
              className="px-5 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Retour au Challenge
            </button>
            <button
              onClick={() => router.replace("/challenge")}
              className="px-5 py-3 text-sm font-black text-[#000c34] bg-[#fce500] rounded-xl hover:bg-yellow-300 transition-colors"
            >
              Reessayer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-[#FC4C02]/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#FC4C02] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="font-title text-[#000c34] text-2xl mb-2">Chargement...</h1>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
