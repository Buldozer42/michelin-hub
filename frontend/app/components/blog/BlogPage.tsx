"use client";

import { useState, useEffect } from "react";
import { getArticles, getCategories, ApiArticle, ApiCategory } from "../../lib/api";
import SiteFooter from "../Footer";

/* ── Color helpers ────────────────────────────────────────────────────── */

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function hexToGradient(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dark = `rgb(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.4)})`;
  return `linear-gradient(to bottom right, ${dark}, ${hex})`;
}

const FALLBACK_COLOR = "#27509b";

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function calcReadTime(content: string): string {
  const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(wordCount / 200))} min`;
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function CategoryChip({ label, hex }: { label: string; hex: string }) {
  const textColor = isLight(hex) ? "#000c34" : "#ffffff";
  return (
    <span
      className="inline-block text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase"
      style={{ backgroundColor: hex, color: textColor }}
    >
      {label}
    </span>
  );
}

interface ArticleCardProps {
  category: string;
  categoryHex: string;
  gradient: string;
  coverImage?: string | null;
  date?: string;
  readTime?: string;
  title: string;
  excerpt: string;
  viewCount?: number;
  tags?: string[];
  featured?: boolean;
  slug?: string;
}

function ArticleCard({
  category, categoryHex, gradient, coverImage, date, readTime,
  title, excerpt, viewCount, tags, featured = false, slug,
}: ArticleCardProps) {
  const href = slug ? `/blog/${slug}` : "#";
  return (
    <article className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group ${featured ? "md:flex-row" : ""}`}>
      <div className={`relative overflow-hidden ${featured ? "md:w-[45%] h-56 md:h-auto" : "h-52"}`}>
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: gradient }} />
            <div className="absolute inset-0 flex items-end justify-end p-4 opacity-20">
              <svg viewBox="0 0 120 120" className={`${featured ? "w-32 h-32" : "w-24 h-24"}`}>
                <ellipse cx="78" cy="14" rx="10" ry="6" fill="white" />
                <circle cx="78" cy="20" r="8" fill="white" />
                <path d="M70 30 L58 66 L36 95 M70 30 L87 60 L99 95 M58 66 L87 60"
                  strokeWidth="6" stroke="white" fill="none" strokeLinecap="round" />
                <circle cx="36" cy="95" r="14" strokeWidth="5" stroke="white" fill="none" />
                <circle cx="99" cy="95" r="14" strokeWidth="5" stroke="white" fill="none" />
              </svg>
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 fill-[#fce500]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8.5 2 5.8 4.6 5.5 8H5c-1.7 0-3 1.3-3 3v1c0 1.7 1.3 3 3 3h1v1c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-1h1c1.7 0 3-1.3 3-3v-1c0-1.7-1.3-3-3-3h-.5C18.2 4.6 15.5 2 12 2zm0 2c2.5 0 4.5 2 4.5 4.5v.5h-9v-.5C7.5 6 9.5 4 12 4z" />
          </svg>
          <span className="text-white text-[9px] font-bold tracking-wide">Casque requis</span>
        </div>
        <div className="absolute bottom-3 left-3">
          <CategoryChip label={category} hex={categoryHex} />
        </div>
      </div>

      <div className={`flex flex-col flex-1 ${featured ? "p-8" : "p-5"}`}>
        <div className="flex items-center gap-3 mb-3">
          {date && <span className="text-[#53565a] text-xs">{date}</span>}
          {readTime && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-[#53565a] text-xs">{readTime}</span>
            </>
          )}
          {viewCount !== undefined && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-gray-300 text-xs flex items-center gap-1">
                <svg className="w-3 h-3 fill-gray-300" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
              </span>
            </>
          )}
        </div>

        <h3 className={`font-title text-[#000c34] leading-tight group-hover:text-[#27509b] transition-colors ${featured ? "text-2xl md:text-3xl mb-3" : "text-lg mb-2"}`}>
          {title}
        </h3>
        <p className={`text-[#53565a] leading-relaxed flex-1 ${featured ? "text-base" : "text-sm"}`}>
          {excerpt}
        </p>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(t => (
              <span key={t} className="bg-gray-100 text-[#53565a] text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide uppercase">
                #{t}
              </span>
            ))}
          </div>
        )}

        <a
          href={href}
          className={`inline-flex items-center gap-2 text-[#27509b] font-bold transition-all group-hover:gap-3 ${featured ? "text-sm mt-6" : "text-xs mt-4"}`}
          aria-label={`Lire l'article : ${title}`}
        >
          Lire l&apos;article
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}

function articleToCardProps(article: ApiArticle, featured = false): ArticleCardProps {
  const hex = article.category?.color ?? FALLBACK_COLOR;
  return {
    category: article.category?.name ?? "Article",
    categoryHex: hex,
    gradient: hexToGradient(hex),
    coverImage: article.coverImage,
    date: formatDate(article.publishedAt),
    readTime: calcReadTime(article.content),
    viewCount: article.viewCount,
    tags: article.tags.map(t => t.slug),
    title: article.title,
    excerpt: article.excerpt ?? "",
    featured,
    slug: article.slug,
  };
}

/* ── Skeleton loaders ──────────────────────────────────────────────── */

function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md animate-pulse flex flex-col ${featured ? "md:flex-row" : ""}`}>
      <div className={`bg-gray-200 ${featured ? "md:w-[45%] h-56 md:h-auto" : "h-52"}`} />
      <div className={`flex flex-col flex-1 gap-3 ${featured ? "p-8" : "p-5"}`}>
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function BlogPage() {
  const [articles, setArticles]     = useState<ApiArticle[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getArticles(), getCategories()])
      .then(([arts, cats]) => { setArticles(arts); setCategories(cats); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featured  = articles[0];
  const gridItems = articles.slice(1, 4);
  const sideItem  = articles[4] ?? articles[3] ?? null;

  return (
    <div className="bg-white">
      {/* ── Hero — full-bleed photo ── */}
      <section className="relative overflow-hidden h-[420px] md:h-[520px] lg:h-[600px]" aria-label="À la une">
        <img
          src="https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1920&h=900&fit=crop&q=80"
          alt="Cycliste sur route de montagne"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000c34]/85 via-[#000c34]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000c34]/60 via-transparent to-[#000c34]/20" />

        <div className="relative z-10 h-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 md:pb-16 lg:pb-20">
          <span className="inline-block bg-[#fce500] text-[#000c34] text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase mb-5 w-fit">
            Le Blog Michelin
          </span>
          <h1 className="font-title text-white text-4xl md:text-5xl lg:text-6xl leading-[1.1] max-w-xl">
            Routes, conseils<br />&amp; inspiration
          </h1>
          <p className="text-white/75 text-base md:text-lg mt-4 leading-relaxed max-w-lg">
            Itineraires legendaires, guides techniques et actus du peloton.
            Tout pour rouler mieux, plus loin.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <a href="#articles" className="inline-flex items-center gap-2 bg-[#fce500] text-[#000c34] font-black text-sm px-7 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors min-h-[48px] shadow-lg">
              Explorer les articles
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Category filter bar ── */}
      <div className="border-b border-gray-100 bg-white sticky top-[68px] z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <button className="flex-shrink-0 bg-[#000c34] text-white text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase">
              Tout
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className="flex-shrink-0 text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase border border-gray-200 text-[#53565a] hover:border-[#27509b] hover:text-[#27509b] transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="articles" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* ── Featured article ── */}
        <section aria-label="Article à la une">
          {loading ? (
            <SkeletonCard featured />
          ) : featured ? (
            <ArticleCard {...articleToCardProps(featured, true)} />
          ) : null}
        </section>

        {/* ── Articles grid ── */}
        <section aria-label="Derniers articles">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-title text-[#000c34] text-2xl">Derniers articles</h2>
            <a href="#" className="text-[#27509b] text-sm font-bold hover:underline inline-flex items-center gap-1">
              Voir tout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
              : gridItems.map(a => <ArticleCard key={a.id} {...articleToCardProps(a)} />)
            }
          </div>
        </section>

        {/* ── Guide Pratique + article slot ── */}
        <section aria-label="Guide pratique et mobilité">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide Pratique — static yellow brand section */}
            <div className="bg-[#fce500] rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <CategoryChip label="Guide Pratique" hex="#000c34" />
                <h3 className="font-title text-[#000c34] text-3xl mt-4 mb-6 leading-tight">
                  Comment monter son pneu
                </h3>
                <ol className="space-y-4">
                  {[
                    "Vérifiez le sens de rotation indiqué sur le flanc.",
                    "Insérez une tringle dans la jante sans outil.",
                    "Gonflez légèrement, puis ajustez à la pression recommandée.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="w-7 h-7 bg-[#000c34] text-[#fce500] rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[#000c34] text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-6 bg-white/50 rounded-xl p-4">
                <p className="text-[#000c34] text-[11px] font-black mb-1.5">CONSEIL MICHELIN</p>
                <p className="text-[#000c34]/80 text-xs leading-relaxed italic">
                  &ldquo;Un pneu bien monté réduit les frottements de 15%. Utilisez de l&apos;eau savonneuse
                  sur les tringles pour faciliter la mise en place.&rdquo;
                </p>
                <p className="text-[#000c34]/40 text-[10px] mt-2">* Ces conseils sont indicatifs. Consultez un professionnel si besoin.</p>
              </div>
            </div>

            {loading ? (
              <SkeletonCard />
            ) : sideItem ? (
              <ArticleCard {...articleToCardProps(sideItem)} />
            ) : null}
          </div>
        </section>

        {/* ── Conversion — Trouver un revendeur ── */}
        <section aria-label="Nos pneus vélo" className="bg-[#000c34] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-block bg-[#fce500] text-[#000c34] text-[10px] font-black px-3 py-1 rounded-full tracking-[0.2em] uppercase w-fit mb-5">
                Équipez-vous
              </span>
              <h2 className="font-title text-white text-3xl md:text-4xl leading-tight">
                Le pneu qui change<br />tout.
              </h2>
              <p className="text-white/60 text-base mt-4 leading-relaxed">
                Que vous visiez le chrono ou le grand large, il y a un Michelin pour vous.
                Progressez avec l&apos;équipement des champions.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <a href="#" className="inline-flex items-center gap-2 bg-[#fce500] text-[#000c34] font-black text-sm px-7 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors min-h-[48px]">
                  Trouver un revendeur
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="#" className="inline-flex items-center gap-2 text-white/70 text-sm font-semibold hover:text-white transition-colors min-h-[48px]">
                  Voir tous les pneus
                </a>
              </div>
            </div>
            <div className="bg-[#000c34] p-8 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 h-28 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <svg viewBox="0 0 80 80" className="w-20 h-20">
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
                <span className="text-white text-xs font-black">Power Cup</span>
                <span className="text-white/40 text-[10px]">Route · 700c</span>
                <a href="#" className="bg-[#fce500] text-[#000c34] text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
                  Buy Now
                </a>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 h-28 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <svg viewBox="0 0 80 80" className="w-20 h-20">
                    <ellipse cx="40" cy="40" rx="13" ry="34" fill="white" stroke="black" strokeWidth="2.5" strokeDasharray="5 3" />
                    <ellipse cx="40" cy="40" rx="34" ry="13" fill="white" stroke="black" strokeWidth="2.5" strokeDasharray="5 3" />
                    <circle cx="40" cy="40" r="7" fill="black" />
                  </svg>
                </div>
                <span className="text-white text-xs font-black">Wild Enduro</span>
                <span className="text-white/40 text-[10px]">VTT · 29&quot;</span>
                <a href="#" className="bg-[#fce500] text-[#000c34] text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
                  Buy Now
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section aria-label="Newsletter Michelin" className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:gap-16">
            <div className="md:flex-1">
              <span className="inline-block bg-[#27509b]/10 text-[#27509b] text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase mb-4">
                Newsletter
              </span>
              <h3 className="font-title text-[#000c34] text-2xl md:text-3xl leading-tight">
                Ne manquez<br />aucune étape
              </h3>
              <p className="text-[#53565a] text-sm mt-2 leading-relaxed">
                Itinéraires, conseils techniques et actu Michelin directement dans votre boîte mail.
              </p>
            </div>
            <div className="md:flex-1 mt-6 md:mt-0 space-y-3">
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full rounded-xl px-4 py-3.5 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-white transition-colors"
                aria-label="Adresse email pour la newsletter"
              />
              <button className="w-full bg-[#000c34] text-white rounded-xl py-3.5 text-sm font-black tracking-wide hover:bg-[#000c34]/90 transition-colors min-h-[48px]">
                Rejoindre l&apos;aventure
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}