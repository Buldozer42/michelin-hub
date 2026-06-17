import SiteFooter from "../Footer";
import StravaSection from "./StravaSection";

/** EcologicalImpact entity — community aggregate for this challenge */
const ECO_IMPACT = {
  co2SavedKg: 12840,
  caloriesBurned: 4_820_000,
  equivalentCarKm: 89_200,
  moneySaved: 38_400,
};

export default function ChallengePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Main layout: feed (2/3) + sidebar (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: hero + activity feed (Strava-managed) ── */}
        <div className="lg:col-span-2">
          <StravaSection />
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* EcologicalImpact entity — community aggregate */}
          <div className="bg-[#000c34] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-green-400" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c6 0 9-8 9-8 0 0-1 5-5 7A10 10 0 0 0 22 12c0-1.88-.56-3.63-1.5-5.12A12.85 12.85 0 0 0 17 8z" />
                </svg>
              </div>
              <h3 className="font-title text-white text-sm">Impact Écologique</h3>
              <span className="text-white/30 text-[9px]">communauté</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "CO2 économisé", value: `${(ECO_IMPACT.co2SavedKg / 1000).toFixed(1)} t`, color: "bg-green-500/20 text-green-400" },
                { label: "≡ km voiture", value: `${(ECO_IMPACT.equivalentCarKm / 1000).toFixed(0)}k`, color: "bg-blue-500/20 text-blue-400" },
                { label: "Kcal brûlées", value: `${(ECO_IMPACT.caloriesBurned / 1_000_000).toFixed(1)}M`, color: "bg-orange-500/20 text-orange-400" },
                { label: "Économisés", value: `${(ECO_IMPACT.moneySaved / 1000).toFixed(1)}k €`, color: "bg-[#fce500]/20 text-[#fce500]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3">
                  <div className={`text-lg font-black ${color.split(" ")[1]}`}>{value}</div>
                  <div className="text-white/40 text-[10px] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product — In Motion style */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-center mb-3">
              <span className="bg-[#27509b]/10 text-[#27509b] text-[10px] font-black px-3 py-1 rounded-full tracking-widest">
                LE CHOIX DES EXPERTS
              </span>
            </div>
            <h3 className="font-title text-[#000c34] text-xl text-center">Michelin Power Cup</h3>
            <div className="mx-auto w-32 h-32 bg-[#000c34] rounded-2xl my-4 flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-24 h-24">
                <ellipse cx="40" cy="40" rx="11" ry="34" fill="white" stroke="black" strokeWidth="2.5" />
                <ellipse cx="40" cy="40" rx="34" ry="11" fill="white" stroke="black" strokeWidth="2.5" />
                <circle cx="40" cy="40" r="6" fill="black" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <line key={deg} x1="40" y1="40"
                    x2={40 + 28 * Math.cos((deg * Math.PI) / 180)}
                    y2={40 + 28 * Math.sin((deg * Math.PI) / 180)}
                    stroke="black" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
            <p className="text-gray-500 text-xs text-center italic leading-relaxed">
              &ldquo;La vitesse sans compromis.<br />Performance brute sur le bitume.&rdquo;
            </p>
            <button className="w-full mt-4 bg-[#fce500] text-[#000c34] rounded-xl py-3.5 text-sm font-black hover:bg-yellow-300 transition-colors min-h-[48px]">
              Acheter ce pneu
            </button>
          </div>

          {/* Top Performeurs */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-title text-[#000c34] text-base flex items-center gap-2 mb-4">
              🏆 Top Performeurs
            </h3>
            <div className="space-y-3">
              {[
                { rank: 1, name: "Marc V.", km: "1 240 km / mois", style: "text-[#fce500] bg-[#000c34]" },
                { rank: 2, name: "Sophie L.", km: "980 km / mois", style: "text-gray-400 bg-gray-100" },
                { rank: 3, name: "Thomas D.", km: "915 km / mois", style: "text-orange-400 bg-orange-50" },
              ].map(({ rank, name, km, style }) => (
                <div key={rank} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${style}`}>
                    {rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[#000c34] text-sm">{name}</div>
                    <div className="text-gray-400 text-[11px]">{km}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Besoin d'aide */}
          <div className="bg-[#27509b]/5 border border-[#27509b]/20 rounded-2xl p-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#27509b]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-[#27509b]" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                </svg>
              </div>
              <div>
                <div className="font-black text-[#000c34] text-sm">Besoin d&apos;aide ?</div>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Nos experts vous conseillent sur le choix de vos pneus.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-[#27509b] font-semibold text-sm mt-2 hover:gap-2 transition-all">
                  Discuter maintenant
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
