/** Shared site footer — Bibendum "Hello" pose required per Michelin brand guidelines */

/** Bibendum in "Hello / Coucou" waving pose */
function Bibendum() {
  return (
    <svg viewBox="0 0 140 230" className="w-full h-full" aria-label="Bibendum Michelin">
      {/* ── Feet ── */}
      <ellipse cx="48" cy="222" rx="22" ry="8" fill="white" opacity="0.95" />
      <ellipse cx="92" cy="222" rx="22" ry="8" fill="white" opacity="0.95" />
      {/* ── Ankle rings ── */}
      <ellipse cx="50" cy="207" rx="17" ry="11" fill="white" opacity="0.95" />
      <ellipse cx="90" cy="207" rx="17" ry="11" fill="white" opacity="0.95" />
      {/* ── Leg connectors ── */}
      <ellipse cx="50" cy="193" rx="17" ry="11" fill="white" opacity="0.9" />
      <ellipse cx="90" cy="193" rx="17" ry="11" fill="white" opacity="0.9" />
      {/* ── Lower body rings ── */}
      <ellipse cx="70" cy="176" rx="40" ry="15" fill="white" opacity="0.9" />
      <ellipse cx="70" cy="156" rx="44" ry="16" fill="white" opacity="0.9" />
      <ellipse cx="70" cy="135" rx="42" ry="16" fill="white" opacity="0.9" />
      {/* ── Upper body rings ── */}
      <ellipse cx="70" cy="115" rx="36" ry="15" fill="white" opacity="0.9" />
      <ellipse cx="70" cy="97" rx="28" ry="13" fill="white" opacity="0.9" />
      {/* ── Neck ring ── */}
      <ellipse cx="70" cy="82" rx="19" ry="10" fill="white" opacity="0.9" />
      {/* ── Head ── */}
      <ellipse cx="70" cy="54" rx="30" ry="30" fill="white" opacity="0.97" />
      {/* ── Eyes ── */}
      <circle cx="58" cy="47" r="6" fill="#000c34" />
      <circle cx="82" cy="47" r="6" fill="#000c34" />
      {/* eye highlights */}
      <circle cx="60" cy="45" r="2.5" fill="white" />
      <circle cx="84" cy="45" r="2.5" fill="white" />
      {/* ── Smile ── */}
      <path d="M55 68 Q70 82 85 68" stroke="#000c34" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* ── Right arm raised — "Hello / Coucou" wave ── */}
      <ellipse cx="38" cy="108" rx="16" ry="11" fill="white" opacity="0.9" transform="rotate(-45 38 108)" />
      <ellipse cx="22" cy="86" rx="14" ry="10" fill="white" opacity="0.9" transform="rotate(-60 22 86)" />
      <ellipse cx="12" cy="64" rx="12" ry="10" fill="white" opacity="0.9" transform="rotate(-70 12 64)" />
      {/* Hand */}
      <circle cx="8" cy="48" r="12" fill="white" opacity="0.95" />
      {/* Fingers hint */}
      <ellipse cx="2"  cy="39" rx="4" ry="7" fill="white" opacity="0.9" transform="rotate(-20 2 39)" />
      <ellipse cx="10" cy="36" rx="4" ry="7" fill="white" opacity="0.9" transform="rotate(-5 10 36)" />
      <ellipse cx="18" cy="37" rx="4" ry="7" fill="white" opacity="0.9" transform="rotate(10 18 37)" />
      {/* ── Left arm (down / relaxed) ── */}
      <ellipse cx="102" cy="112" rx="16" ry="11" fill="white" opacity="0.9" transform="rotate(25 102 112)" />
      <ellipse cx="116" cy="132" rx="14" ry="10" fill="white" opacity="0.9" transform="rotate(35 116 132)" />
      <circle cx="124" cy="148" r="11" fill="white" opacity="0.9" />
    </svg>
  );
}

const FOOTER_LINKS = [
  {
    heading: "Navigation",
    links: ["Blog", "Challenge", "Mon Vélo"],
  },
  {
    heading: "Michelin",
    links: ["À propos", "Ambition 2050", "Nos pneus vélo"],
  },
  {
    heading: "Légal",
    links: ["Politique de confidentialité", "Conditions d'utilisation", "Contact"],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#000c34] rounded-2xl mt-10 overflow-hidden">
      <div className="px-6 md:px-10 pt-10 pb-6">
        {/* Top row: Bibendum + nav columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand column — Bibendum required per IP guidelines */}
          <div className="md:col-span-1 flex flex-col">
            <div className="w-28 shrink-0">
              <Bibendum />
            </div>
            <div className="mt-3">
              <div className="font-title text-[#fce500] text-xl tracking-wide">MICHELIN</div>
              <div className="text-white/50 text-xs font-semibold tracking-widest mt-0.5">VÉLO HUB</div>
              <p className="text-white/40 text-xs mt-3 leading-relaxed">
                Performance &amp; Motion.<br />
                Le compagnon de route des cyclistes exigeants.
              </p>
            </div>
          </div>

          {/* Nav link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-white font-title text-sm tracking-widest mb-4">{heading.toUpperCase()}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-white/50 text-sm hover:text-[#fce500] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-white/30 text-xs">
            © 2024 Michelin Velo Hub. Tous droits réservés. Michelin® est une marque déposée.
          </p>
          <p className="text-[#fce500]/60 text-xs font-semibold italic">
            &ldquo;Bonne route avec Michelin™&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
