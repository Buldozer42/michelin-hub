"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getArticleBySlug,
  getArticleComments,
  getArticleLikes,
  postComment,
  deleteComment,
  postLike,
  deleteLike,
  type ApiArticle,
  type ApiComment,
  type ApiLike,
} from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

function formatViewCount(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k vues` : `${value} vues`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "A l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d} jours`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function CommentSection({ articleId }: { articleId: number }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getArticleComments(articleId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  useEffect(load, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !content.trim()) return;
    setPosting(true);
    try {
      await postComment(articleId, content.trim(), token);
      setContent("");
      load();
    } catch { /* ignore */ }
    setPosting(false);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteComment(id, token);
      setComments((c) => c.filter((x) => x.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="mt-10 border-t border-gray-100 pt-8">
      <h2 className="font-title text-[#020e39] text-xl flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#27509b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Commentaires
        {comments.length > 0 && (
          <span className="bg-[#27509b] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h2>

      {/* Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#27509b] flex items-center justify-center text-white text-xs font-black shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ecrire un commentaire..."
                rows={3}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27509b]/30 focus:border-[#27509b] transition-colors resize-none bg-white"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={posting || !content.trim()}
                  className="px-5 py-2 bg-[#27509b] text-white text-sm font-black rounded-xl hover:bg-[#1a3d7c] transition-colors disabled:opacity-40"
                >
                  {posting ? "Envoi..." : "Commenter"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">
            <Link href="/login" className="text-[#27509b] font-bold hover:underline">Connectez-vous</Link> pour laisser un commentaire.
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-gray-400 text-sm">Chargement des commentaires...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-6">Aucun commentaire pour le moment. Soyez le premier !</div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-black shrink-0">
                {c.author.firstName.charAt(0)}{c.author.lastName.charAt(0)}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-[#020e39] text-sm">
                    {c.author.firstName} {c.author.lastName.charAt(0)}.
                  </span>
                  <span className="text-gray-400 text-[11px]">{timeAgo(c.createdAt)}</span>
                  {user && user.id === c.author.id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LikeButton({ articleId }: { articleId: number }) {
  const { user, token } = useAuth();
  const [likes, setLikes] = useState<ApiLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getArticleLikes(articleId)
      .then(setLikes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  const myLike = user ? likes.find((l) => l.user.id === user.id) : undefined;
  const liked = !!myLike;

  const toggle = async () => {
    if (!token || !user || toggling) return;
    setToggling(true);
    try {
      if (liked && myLike) {
        await deleteLike(myLike.id, token);
        setLikes((l) => l.filter((x) => x.id !== myLike.id));
      } else {
        const newLike = await postLike(articleId, token);
        setLikes((l) => [...l, newLike]);
      }
    } catch { /* ignore */ }
    setToggling(false);
  };

  if (loading) return null;

  return (
    <button
      onClick={user ? toggle : undefined}
      disabled={toggling}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
        liked
          ? "bg-red-50 border-red-200 text-red-500"
          : user
            ? "bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
            : "bg-white border-gray-200 text-gray-400 cursor-default"
      }`}
      title={user ? (liked ? "Retirer le like" : "Liker") : "Connectez-vous pour liker"}
    >
      <svg className={`w-5 h-5 transition-transform ${toggling ? "scale-125" : ""}`} viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={liked ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {likes.length > 0 && <span>{likes.length}</span>}
    </button>
  );
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [article, setArticle] = useState<ApiArticle | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    getArticleBySlug(slug)
      .then(data => {
        if (cancelled) return;
        if (!data) { setStatus("not-found"); return; }
        setArticle(data);
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/blog" className="inline-flex items-center gap-1 text-[#27509b] font-semibold text-sm mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au blog
      </Link>

      {status === "loading" && <p className="text-gray-400 text-sm">Chargement de l&apos;article...</p>}
      {status === "error" && <p className="text-red-500 text-sm">Impossible de charger cet article.</p>}
      {status === "not-found" && (
        <div>
          <h1 className="font-title text-[#020e39] text-2xl mb-2">Article introuvable</h1>
          <p className="text-gray-500 text-sm">Cet article n&apos;existe pas ou a ete supprime.</p>
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
            <LikeButton articleId={article.id} />
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

          <CommentSection articleId={article.id} />
        </article>
      )}
    </div>
  );
}
