import SiteFooter from "../Footer";

interface ArticleCardProps {
  badge: string;         // Category name
  badgeColor: string;
  gradient: string;
  date?: string;         // publishedAt
  title: string;
  excerpt: string;
  viewCount?: number;    // Article.viewCount
  tags?: string[];       // Tag[] names
  cta?: boolean;
  helmet?: boolean;
}

function ArticleCard({ badge, badgeColor, gradient, date, title, excerpt, viewCount, tags, cta = true, helmet = true }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col group hover:shadow-lg transition-shadow">
      {/* Image area */}
      <div className={`relative h-48 flex items-end overflow-hidden ${gradient}`}>
        {/* Helmet reminder overlay — per brand guidelines all cyclists must wear helmets */}
        {helmet && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 fill-[#fce500]" viewBox="0 0 24 24">
              <path d="M12 2C8.5 2 5.8 4.6 5.5 8H5c-1.7 0-3 1.3-3 3v1c0 1.7 1.3 3 3 3h1v1c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-1h1c1.7 0 3-1.3 3-3v-1c0-1.7-1.3-3-3-3h-.5C18.2 4.6 15.5 2 12 2zm0 2c2.5 0 4.5 2 4.5 4.5v.5h-9v-.5C7.5 6 9.5 4 12 4z" />
            </svg>
            <span className="text-white text-[9px] font-bold">Casque requis</span>
          </div>
        )}
        <div className="p-3">
          <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full tracking-widest ${badgeColor}`}>
            {badge}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          {date && (
            <p className="text-gray-400 text-[11px] flex items-center gap-1">
              <svg className="w-3 h-3 fill-gray-400 shrink-0" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
              {date}
            </p>
          )}
          {viewCount !== undefined && (
            <p className="text-gray-300 text-[11px] flex items-center gap-1 ml-auto">
              <svg className="w-3 h-3 fill-gray-300 shrink-0" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
            </p>
          )}
        </div>
        <h3 className="font-title text-[#000c34] text-lg leading-snug">{title}</h3>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed flex-1">{excerpt}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <span key={t} className="bg-gray-100 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide">
                #{t}
              </span>
            ))}
          </div>
        )}
        {cta && (
          <a href="#" className="inline-flex items-center gap-1 text-[#27509b] font-semibold text-sm mt-3 group-hover:gap-2 transition-all">
            Lire l&apos;article
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Hero ── */}
      <div className="rounded-2xl overflow-hidden relative bg-[#000c34] min-h-[280px] md:min-h-[360px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000c34] via-[#0d2060] to-[#000c34]" />
        {/* Decorative road/speed lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-white"
              style={{ top: `${20 + i * 18}%`, left: "-10%", right: "-10%", transform: `rotate(-${3 + i}deg)` }}
            />
          ))}
        </div>
        {/* Cyclist silhouette */}
        <div className="absolute right-0 bottom-0 w-72 h-72 md:w-96 md:h-96 opacity-15">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Helmet on cyclist */}
            <ellipse cx="130" cy="22" rx="16" ry="10" fill="white" />
            <circle cx="130" cy="30" r="12" fill="white" />
            <path d="M115 48 L95 108 L60 158 M115 48 L145 98 L165 158 M95 108 L145 98"
              strokeWidth="10" stroke="white" fill="none" strokeLinecap="round" />
            <circle cx="60" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
            <circle cx="165" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
          </svg>
        </div>
        <div className="relative z-10 p-6 md:p-12 max-w-2xl h-full flex flex-col justify-center">
          <span className="inline-block bg-[#fce500] text-[#000c34] text-[10px] font-black px-4 py-1.5 rounded-full w-fit mb-5 tracking-widest">
            À LA UNE
          </span>
          <h1 className="font-title text-white text-4xl md:text-5xl lg:text-6xl leading-tight">
            Passion &amp;<br />Puissance
          </h1>
          <p className="text-white/70 text-base mt-4 leading-relaxed max-w-lg">
            Relevez le défi d&apos;explorer les routes qui forgent les champions.
            Récits, techniques, destinations — l&apos;adrénaline commence ici.
          </p>
          <a href="#" className="mt-6 inline-flex items-center gap-2 bg-[#fce500] text-[#000c34] font-black text-sm px-6 py-3.5 rounded-xl w-fit hover:bg-yellow-300 transition-colors">
            Explorer le blog
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Articles grid 1→2→3 cols ── */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ArticleCard
          badge="DESTINATIONS"
          badgeColor="bg-[#27509b] text-white"
          gradient="bg-gradient-to-br from-green-900 via-green-700 to-teal-600"
          date="14 Octobre 2024"
          viewCount={3200}
          tags={["vercors", "route", "itinéraire"]}
          title="L'échappée belle dans le Vercors"
          excerpt="Entre falaises calcaires et routes suspendues, un itinéraire mythique pour tester votre endurance et vos pneus Power Cup."
        />
        <ArticleCard
          badge="TECHNIQUE"
          badgeColor="bg-orange-500 text-white"
          gradient="bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400"
          date="8 Novembre 2024"
          viewCount={5800}
          tags={["pression", "tubeless", "setup"]}
          title="Optimiser sa pression de gonflage"
          excerpt="Comment trouver l'équilibre parfait entre confort et performance pure. Le guide complet Michelin."
          cta={false}
        />
        <ArticleCard
          badge="VTT"
          badgeColor="bg-green-600 text-white"
          gradient="bg-gradient-to-br from-green-950 via-green-800 to-emerald-600"
          date="2 Novembre 2024"
          viewCount={1900}
          tags={["enduro", "alpes", "test"]}
          title="Wild Enduro : Le test ultime"
          excerpt="Nous avons poussé les nouveaux pneus dans les sentiers les plus exigeants des Alpes. Résultat : une adhérence bluffante."
          cta={false}
        />
      </div>

      {/* ── Guide Pratique + Article ── */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Guide Pratique — yellow section */}
        <div className="bg-[#fce500] rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#000c34] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-[#fce500]">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </div>
            <span className="text-[#000c34] font-black text-xs tracking-widest uppercase">Guide Pratique</span>
          </div>
          <h3 className="font-title text-[#000c34] text-2xl md:text-3xl mb-6">Comment monter son pneu</h3>
          <ol className="space-y-3.5">
            {[
              "Vérifiez le sens de rotation indiqué sur le flanc.",
              "Insérez une tringle dans la jante sans outil.",
              "Gonflez légèrement, puis ajustez à la pression recommandée.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-[#000c34] text-[#fce500] rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[#000c34] text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          {/* Conseil Michelin box */}
          <div className="mt-6 bg-white/50 rounded-xl p-4">
            <p className="text-[#000c34] text-[11px] font-black mb-1.5 flex items-center gap-1.5">
              <span className="text-base">💡</span>
              CONSEIL MICHELIN
            </p>
            <p className="text-[#000c34]/80 text-xs leading-relaxed italic">
              &ldquo;Un pneu bien monté réduit les frottements de 15%. Utilisez de l&apos;eau savonneuse
              sur les tringles pour faciliter la mise en place.&rdquo;
            </p>
            <p className="text-[#000c34]/50 text-[10px] mt-2">* Ces conseils sont indicatifs. Consultez un professionnel si besoin.</p>
          </div>
        </div>

        {/* Mobilité Urbaine article */}
        <ArticleCard
          badge="MOBILITÉ URBAINE"
          badgeColor="bg-[#27509b] text-white"
          gradient="bg-gradient-to-br from-slate-700 via-blue-900 to-slate-800"
          date="22 Octobre 2024"
          viewCount={7400}
          tags={["vélotaf", "pluie", "sécurité"]}
          title="Le vélotaf sous la pluie"
          excerpt="Sécurité, équipement et choix de pneus pour rester au sec, en contrôle et à l'heure lors de vos trajets urbains quotidiens."
          cta={false}
        />
      </div>

      {/* ── Newsletter — dark conversion section ── */}
      <div className="mt-8 bg-[#000c34] rounded-2xl p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:gap-12">
          <div className="md:flex-1">
            <span className="inline-block bg-[#fce500] text-[#000c34] text-[10px] font-black px-3 py-1 rounded-full tracking-widest mb-4">
              NEWSLETTER
            </span>
            <h3 className="font-title text-white text-2xl md:text-3xl leading-tight">
              Ne manquez<br />aucune étape
            </h3>
            <p className="text-white/60 text-sm mt-2 leading-relaxed">
              Itinéraires, conseils techniques et actu Michelin directement dans votre boîte mail.
            </p>
          </div>
          <div className="md:flex-1 mt-5 md:mt-0 space-y-3">
            <input
              type="email"
              placeholder="votre@email.com"
              className="w-full rounded-xl px-4 py-3.5 text-sm bg-white/10 border border-white/20 outline-none placeholder-white/40 text-white focus:border-[#fce500] transition-colors"
            />
            <button className="w-full bg-[#fce500] text-[#000c34] rounded-xl py-3.5 text-sm font-black tracking-wide hover:bg-yellow-300 transition-colors">
              S&apos;abonner
            </button>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
