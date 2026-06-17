"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getArticles,
  getCategories,
  getTags,
  createArticle,
  updateArticle,
  deleteArticle,
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
  type ApiArticle,
  type ApiCategory,
  type ApiTag,
} from "../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type EditTab = "articles" | "categories" | "tags";
type Status = { message: string; error: boolean } | null;

// ── Utilities ────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// ── Shared atoms ─────────────────────────────────────────────────────────────

const CX = {
  input:
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27509b]/30 focus:border-[#27509b] transition-colors bg-white",
  btnPrimary:
    "px-5 py-2.5 bg-[#27509b] text-white text-sm font-black rounded-xl hover:bg-[#1a3d7c] transition-colors",
  btnGhost:
    "px-5 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors",
  th: "px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider",
  td: "px-4 py-3 align-top",
  btnEdit:
    "px-2.5 py-1 text-xs font-semibold text-[#27509b] border border-[#27509b]/30 rounded-lg hover:bg-[#27509b]/5 transition-colors",
  btnDelete:
    "px-2.5 py-1 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBar({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold mb-4 ${
        status.error
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      {status.message}
    </div>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  );
}

// ── Articles tab ─────────────────────────────────────────────────────────────

const EMPTY_ARTICLE = {
  id: null as number | null,
  title: "",
  slug: "",
  categoryId: "",
  tagIds: [] as string[],
  excerpt: "",
  content: "",
  coverImage: "",
  viewCount: 0,
  publishedAt: "",
};

function ArticlesTab() {
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState(EMPTY_ARTICLE);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [arts, cats, tgs] = await Promise.all([getArticles(), getCategories(), getTags()]);
      setArticles(arts);
      setCategories(cats);
      setTags(tgs);
    } catch (e) {
      setStatus({ message: String(e), error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function patch<K extends keyof typeof EMPTY_ARTICLE>(key: K, value: (typeof EMPTY_ARTICLE)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: f.id ? f.slug : slugify(title) }));
  }

  function toggleTag(tagId: string) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  }

  function handleEdit(article: ApiArticle) {
    setForm({
      id: article.id,
      title: article.title,
      slug: article.slug,
      categoryId: String(article.category.id),
      tagIds: article.tags.map((t) => String(t.id)),
      excerpt: article.excerpt ?? "",
      content: article.content,
      coverImage: article.coverImage ?? "",
      viewCount: article.viewCount,
      publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setForm(EMPTY_ARTICLE);
    setStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      category: `/api/categories/${form.categoryId}`,
      tags: form.tagIds.map((id) => `/api/tags/${id}`),
      excerpt: form.excerpt || null,
      content: form.content,
      coverImage: form.coverImage || null,
      viewCount: form.viewCount,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };
    try {
      if (form.id) {
        await updateArticle(form.id, payload);
        setStatus({ message: `Article "${form.title}" mis à jour.`, error: false });
      } else {
        await createArticle(payload);
        setStatus({ message: `Article "${form.title}" créé.`, error: false });
        handleReset();
      }
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Supprimer l'article "${title}" ?`)) return;
    try {
      await deleteArticle(id);
      setStatus({ message: `Article "${title}" supprimé.`, error: false });
      if (form.id === id) handleReset();
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  return (
    <div className="grid lg:grid-cols-[440px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-1">
          {form.id ? `Modifier l'article #${form.id}` : "Nouvel article"}
        </h2>
        {form.id && (
          <p className="text-xs text-gray-400 mb-4">{form.title}</p>
        )}
        {!form.id && <div className="mb-4" />}
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Titre *">
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={CX.input}
              placeholder="Mon super article"
            />
          </Field>
          <Field label="Slug *">
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => patch("slug", e.target.value)}
              className={CX.input}
              placeholder="mon-super-article"
            />
          </Field>
          <Field label="Catégorie *">
            <select
              required
              value={form.categoryId}
              onChange={(e) => patch("categoryId", e.target.value)}
              className={CX.input}
            >
              <option value="" disabled>
                Choisir une catégorie…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags">
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[48px]">
              {tags.length === 0 ? (
                <span className="text-gray-400 text-xs self-center">Aucun tag disponible</span>
              ) : (
                tags.map((tag) => {
                  const active = form.tagIds.includes(String(tag.id));
                  return (
                    <label
                      key={tag.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors select-none ${
                        active
                          ? "bg-[#27509b] text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-[#27509b]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={active}
                        onChange={() => toggleTag(String(tag.id))}
                      />
                      {tag.name}
                    </label>
                  );
                })
              )}
            </div>
          </Field>
          <Field label="Extrait">
            <textarea
              value={form.excerpt}
              onChange={(e) => patch("excerpt", e.target.value)}
              rows={3}
              className={CX.input}
              placeholder="Courte description de l'article…"
            />
          </Field>
          <Field label="Contenu *">
            <textarea
              required
              value={form.content}
              onChange={(e) => patch("content", e.target.value)}
              rows={10}
              className={`${CX.input} font-mono text-xs`}
              placeholder="Contenu HTML ou texte brut…"
            />
          </Field>
          <Field label="Image de couverture (URL)">
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => patch("coverImage", e.target.value)}
              className={CX.input}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vues">
              <input
                type="number"
                min={0}
                value={form.viewCount}
                onChange={(e) => patch("viewCount", parseInt(e.target.value) || 0)}
                className={CX.input}
              />
            </Field>
            <Field label="Publié le">
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => patch("publishedAt", e.target.value)}
                className={CX.input}
              />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>
              {form.id ? "Enregistrer" : "Créer l'article"}
            </button>
            {form.id && (
              <button type="button" onClick={handleReset} className={CX.btnGhost}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Articles</h2>
          <span className="text-sm font-semibold text-gray-400">({articles.length})</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={CX.th}>Titre / Slug</th>
                  <th className={CX.th}>Catégorie</th>
                  <th className={CX.th}>Tags</th>
                  <th className={CX.th}>Publié</th>
                  <th className={CX.th} />
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <EmptyRow cols={5} message="Aucun article pour l'instant." />
                ) : (
                  articles.map((article) => (
                    <tr
                      key={article.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        form.id === article.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className={CX.td}>
                        <div className="font-semibold text-[#000c34] leading-tight">
                          {article.title}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5 font-mono">
                          /{article.slug}
                        </div>
                      </td>
                      <td className={CX.td}>
                        <span className="inline-block bg-[#27509b]/10 text-[#27509b] text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                          {article.category?.name ?? "—"}
                        </span>
                      </td>
                      <td className={CX.td}>
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map((t) => (
                            <span
                              key={t.id}
                              className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`${CX.td} text-gray-400 whitespace-nowrap text-xs`}>
                        {fmtDate(article.publishedAt)}
                      </td>
                      <td className={`${CX.td} whitespace-nowrap`}>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(article)} className={CX.btnEdit}>
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(article.id, article.title)}
                            className={CX.btnDelete}
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Categories tab ────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  { hex: "#047857", label: "Vert forêt" },
  { hex: "#15803d", label: "Vert vif" },
  { hex: "#0d9488", label: "Teal" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#d97706", label: "Ambre" },
  { hex: "#1d4ed8", label: "Bleu roi" },
  { hex: "#27509b", label: "Bleu Michelin" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#b91c1c", label: "Rouge" },
  { hex: "#475569", label: "Ardoise" },
  { hex: "#334155", label: "Ardoise foncée" },
  { hex: "#000c34", label: "Navy Michelin" },
  { hex: "#fce500", label: "Jaune Michelin" },
];

const EMPTY_CATEGORY = {
  id: null as number | null,
  name: "",
  slug: "",
  description: "",
  color: "",
};

function CategoriesTab() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } catch (e) {
      setStatus({ message: String(e), error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function patch<K extends keyof typeof EMPTY_CATEGORY>(
    key: K,
    value: (typeof EMPTY_CATEGORY)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: f.id ? f.slug : slugify(name) }));
  }

  function handleEdit(cat: ApiCategory) {
    setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? "", color: cat.color ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setForm(EMPTY_CATEGORY);
    setStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug,
      color: form.color || null,
      ...(form.description ? { description: form.description } : {}),
    };
    try {
      if (form.id) {
        await updateCategory(form.id, payload);
        setStatus({ message: `Catégorie "${form.name}" mise à jour.`, error: false });
      } else {
        await createCategory(payload);
        setStatus({ message: `Catégorie "${form.name}" créée.`, error: false });
        handleReset();
      }
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
    try {
      await deleteCategory(id);
      setStatus({ message: `Catégorie "${name}" supprimée.`, error: false });
      if (form.id === id) handleReset();
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-4">
          {form.id ? `Modifier la catégorie #${form.id}` : "Nouvelle catégorie"}
        </h2>
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={CX.input}
              placeholder="VTT"
            />
          </Field>
          <Field label="Slug *">
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => patch("slug", e.target.value)}
              className={CX.input}
              placeholder="vtt"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={4}
              className={CX.input}
              placeholder="Description de la catégorie…"
            />
          </Field>
          <Field label="Couleur">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 shrink-0 transition-colors"
                style={{ backgroundColor: form.color || "#e5e7eb" }}
              />
              <select
                value={form.color}
                onChange={(e) => patch("color", e.target.value)}
                className={CX.input}
              >
                <option value="">— Aucune couleur —</option>
                {COLOR_PALETTE.map(({ hex, label }) => (
                  <option key={hex} value={hex}>
                    {label} ({hex})
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>
              {form.id ? "Enregistrer" : "Créer la catégorie"}
            </button>
            {form.id && (
              <button type="button" onClick={handleReset} className={CX.btnGhost}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Catégories</h2>
          <span className="text-sm font-semibold text-gray-400">({categories.length})</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={CX.th}>Nom / Slug</th>
                  <th className={CX.th}>Description</th>
                  <th className={CX.th} />
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <EmptyRow cols={3} message="Aucune catégorie pour l'instant." />
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        form.id === cat.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className={CX.td}>
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <div className="font-semibold text-[#000c34]">{cat.name}</div>
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5 font-mono">/{cat.slug}</div>
                      </td>
                      <td className={`${CX.td} text-gray-500 max-w-[280px]`}>
                        {cat.description ? (
                          <span className="line-clamp-2">{cat.description}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className={`${CX.td} whitespace-nowrap`}>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(cat)} className={CX.btnEdit}>
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className={CX.btnDelete}
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tags tab ──────────────────────────────────────────────────────────────────

const EMPTY_TAG = { id: null as number | null, name: "", slug: "" };

function TagsTab() {
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState(EMPTY_TAG);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setTags(await getTags());
    } catch (e) {
      setStatus({ message: String(e), error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: f.id ? f.slug : slugify(name) }));
  }

  function handleEdit(tag: ApiTag) {
    setForm({ id: tag.id, name: tag.name, slug: tag.slug });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setForm(EMPTY_TAG);
    setStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, slug: form.slug };
    try {
      if (form.id) {
        await updateTag(form.id, payload);
        setStatus({ message: `Tag "${form.name}" mis à jour.`, error: false });
      } else {
        await createTag(payload);
        setStatus({ message: `Tag "${form.name}" créé.`, error: false });
        handleReset();
      }
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer le tag "${name}" ?`)) return;
    try {
      await deleteTag(id);
      setStatus({ message: `Tag "${name}" supprimé.`, error: false });
      if (form.id === id) handleReset();
      await loadData();
    } catch (e) {
      setStatus({ message: String(e), error: true });
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-4">
          {form.id ? `Modifier le tag #${form.id}` : "Nouveau tag"}
        </h2>
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={CX.input}
              placeholder="Gravel"
            />
          </Field>
          <Field label="Slug *">
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className={CX.input}
              placeholder="gravel"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>
              {form.id ? "Enregistrer" : "Créer le tag"}
            </button>
            {form.id && (
              <button type="button" onClick={handleReset} className={CX.btnGhost}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Tags</h2>
          <span className="text-sm font-semibold text-gray-400">({tags.length})</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={CX.th}>Nom</th>
                  <th className={CX.th}>Slug</th>
                  <th className={CX.th} />
                </tr>
              </thead>
              <tbody>
                {tags.length === 0 ? (
                  <EmptyRow cols={3} message="Aucun tag pour l'instant." />
                ) : (
                  tags.map((tag) => (
                    <tr
                      key={tag.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        form.id === tag.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className={CX.td}>
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {tag.name}
                        </span>
                      </td>
                      <td className={`${CX.td} text-gray-400 font-mono text-xs`}>{tag.slug}</td>
                      <td className={`${CX.td} whitespace-nowrap`}>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(tag)} className={CX.btnEdit}>
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className={CX.btnDelete}
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: EditTab; label: string }[] = [
  { id: "articles", label: "Articles" },
  { id: "categories", label: "Catégories" },
  { id: "tags", label: "Tags" },
];

export default function EditPage() {
  const [activeTab, setActiveTab] = useState<EditTab>("articles");

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-[0_1px_12px_rgba(0,12,52,0.08)]">
        <div className="max-w-[1400px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">
          <div>
            <h1 className="font-black text-[#000c34] text-base leading-tight">
              Console d&apos;édition
            </h1>
            <p className="text-xs text-gray-400 leading-tight">
              Interface interne — accès restreint
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#27509b] transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour au site
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-8 shadow-sm border border-gray-200 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab.id
                  ? "bg-[#27509b] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#27509b] hover:bg-blue-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "tags" && <TagsTab />}
      </div>
    </div>
  );
}