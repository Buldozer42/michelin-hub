"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import SiteFooter from "../../components/Footer";
import { getArticleBySlug, type ApiArticle } from "../../lib/api";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

function formatViewCount(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k vues` : `${value} vues`;
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const [article, setArticle] = useState<ApiArticle | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    getArticleBySlug(slug)
      .then(data => {
        if (cancelled) return;
        if (!data) {
          setStatus("not-found");
          return;
        }
        setArticle(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0]">
      <Header activeTab="blog" onTabChange={() => router.push("/")} />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-1 text-[#27509b] font-semibold text-sm mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au blog
          </Link>

          {status === "loading" && <p className="text-gray-400 text-sm">Chargement de l&apos;article…</p>}
          {status === "error" && <p className="text-red-500 text-sm">Impossible de charger cet article.</p>}
          {status === "not-found" && (
            <div>
              <h1 className="font-title text-[#020e39] text-2xl mb-2">Article introuvable</h1>
              <p className="text-gray-500 text-sm">Cet article n&apos;existe pas ou a été supprimé.</p>
            </div>
          )}

          {status === "ready" && article && (
            <article>
              <span className="inline-block bg-[#27509b] text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest mb-4">
                {article.category.name.toUpperCase()}
              </span>
              <h1 className="font-title text-[#020e39] text-3xl md:text-4xl leading-tight">{article.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-400 text-sm">
                <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                <span>{formatViewCount(article.viewCount)}</span>
              </div>
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {article.tags.map(tag => (
                    <span key={tag.id} className="bg-gray-100 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {article.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.coverImage} alt={article.title} className="w-full rounded-2xl mt-6 object-cover max-h-96" />
              )}

              <div
                className="mt-6 text-gray-700 leading-relaxed [&>p]:mb-4 [&>h2]:font-title [&>h2]:text-[#020e39] [&>h2]:text-xl [&>h2]:mt-6 [&>h2]:mb-3 [&>img]:rounded-xl [&>img]:my-4 [&>img]:w-full [&>video]:rounded-xl [&>video]:my-4 [&>iframe]:rounded-xl [&>iframe]:my-4 [&>iframe]:w-full [&>iframe]:aspect-video"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </article>
          )}
        </div>
      </main>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
