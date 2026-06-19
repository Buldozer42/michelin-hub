"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getArticles,
  getCategories,
  getTags,
  getChallenges,
  createArticle,
  updateArticle,
  deleteArticle,
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  type ApiArticle,
  type ApiCategory,
  type ApiTag,
  type ApiChallenge,
  type ChallengeObjectiveType,
  type ChallengePayload,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

type EditTab = "articles" | "categories" | "tags" | "challenges";
type TabSection = "blog" | "challenges";
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

  useEffect(() => { loadData(); }, [loadData]);

  function patch<K extends keyof typeof EMPTY_ARTICLE>(key: K, value: (typeof EMPTY_ARTICLE)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: f.id ? f.slug : slugify(title) }));
  }

  function toggleTag(tagId: string) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter((id) => id !== tagId) : [...f.tagIds, tagId],
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

  function handleReset() { setForm(EMPTY_ARTICLE); setStatus(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title, slug: form.slug,
      category: `/api/categories/${form.categoryId}`,
      tags: form.tagIds.map((id) => `/api/tags/${id}`),
      excerpt: form.excerpt || null, content: form.content,
      coverImage: form.coverImage || null, viewCount: form.viewCount,
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
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Supprimer l'article "${title}" ?`)) return;
    try {
      await deleteArticle(id);
      setStatus({ message: `Article "${title}" supprimé.`, error: false });
      if (form.id === id) handleReset();
      await loadData();
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  return (
    <div className="grid lg:grid-cols-[440px_1fr] gap-6 items-start">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-1">
          {form.id ? `Modifier l'article #${form.id}` : "Nouvel article"}
        </h2>
        {form.id && <p className="text-xs text-gray-400 mb-4">{form.title}</p>}
        {!form.id && <div className="mb-4" />}
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Titre *">
            <input type="text" required value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={CX.input} placeholder="Mon super article" />
          </Field>
          <Field label="Slug *">
            <input type="text" required value={form.slug} onChange={(e) => patch("slug", e.target.value)} className={CX.input} placeholder="mon-super-article" />
          </Field>
          <Field label="Catégorie *">
            <select required value={form.categoryId} onChange={(e) => patch("categoryId", e.target.value)} className={CX.input}>
              <option value="" disabled>Choisir une catégorie…</option>
              {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tags">
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[48px]">
              {tags.length === 0 ? (
                <span className="text-gray-400 text-xs self-center">Aucun tag disponible</span>
              ) : tags.map((tag) => {
                const active = form.tagIds.includes(String(tag.id));
                return (
                  <label key={tag.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors select-none ${active ? "bg-[#27509b] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#27509b]"}`}>
                    <input type="checkbox" className="hidden" checked={active} onChange={() => toggleTag(String(tag.id))} />
                    {tag.name}
                  </label>
                );
              })}
            </div>
          </Field>
          <Field label="Extrait">
            <textarea value={form.excerpt} onChange={(e) => patch("excerpt", e.target.value)} rows={3} className={CX.input} placeholder="Courte description…" />
          </Field>
          <Field label="Contenu *">
            <textarea required value={form.content} onChange={(e) => patch("content", e.target.value)} rows={10} className={`${CX.input} font-mono text-xs`} placeholder="Contenu HTML ou texte brut…" />
          </Field>
          <Field label="Image de couverture (URL)">
            <input type="text" value={form.coverImage} onChange={(e) => patch("coverImage", e.target.value)} className={CX.input} placeholder="https://…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vues">
              <input type="number" min={0} value={form.viewCount} onChange={(e) => patch("viewCount", parseInt(e.target.value) || 0)} className={CX.input} />
            </Field>
            <Field label="Publié le">
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => patch("publishedAt", e.target.value)} className={CX.input} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>{form.id ? "Enregistrer" : "Créer l'article"}</button>
            {form.id && <button type="button" onClick={handleReset} className={CX.btnGhost}>Annuler</button>}
          </div>
        </form>
      </div>
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
                {articles.length === 0 ? <EmptyRow cols={5} message="Aucun article." /> : articles.map((article) => (
                  <tr key={article.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${form.id === article.id ? "bg-blue-50" : ""}`}>
                    <td className={CX.td}>
                      <div className="font-semibold text-[#000c34] leading-tight">{article.title}</div>
                      <div className="text-gray-400 text-xs mt-0.5 font-mono">/{article.slug}</div>
                    </td>
                    <td className={CX.td}>
                      <span className="inline-block bg-[#27509b]/10 text-[#27509b] text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{article.category?.name ?? "—"}</span>
                    </td>
                    <td className={CX.td}>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((t) => <span key={t.id} className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{t.name}</span>)}
                      </div>
                    </td>
                    <td className={`${CX.td} text-gray-400 whitespace-nowrap text-xs`}>{fmtDate(article.publishedAt)}</td>
                    <td className={`${CX.td} whitespace-nowrap`}>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(article)} className={CX.btnEdit}>Modifier</button>
                        <button onClick={() => handleDelete(article.id, article.title)} className={CX.btnDelete}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
  { hex: "#047857", label: "Vert forêt" }, { hex: "#15803d", label: "Vert vif" },
  { hex: "#0d9488", label: "Teal" }, { hex: "#ea580c", label: "Orange" },
  { hex: "#d97706", label: "Ambre" }, { hex: "#1d4ed8", label: "Bleu roi" },
  { hex: "#27509b", label: "Bleu Michelin" }, { hex: "#7c3aed", label: "Violet" },
  { hex: "#b91c1c", label: "Rouge" }, { hex: "#475569", label: "Ardoise" },
  { hex: "#000c34", label: "Navy Michelin" }, { hex: "#fce500", label: "Jaune Michelin" },
];

const EMPTY_CATEGORY = { id: null as number | null, name: "", slug: "", description: "", color: "" };

function CategoriesTab() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);

  const loadData = useCallback(async () => {
    setLoading(true);
    try { setCategories(await getCategories()); } catch (e) { setStatus({ message: String(e), error: true }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function patch<K extends keyof typeof EMPTY_CATEGORY>(key: K, value: (typeof EMPTY_CATEGORY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) { setForm((f) => ({ ...f, name, slug: f.id ? f.slug : slugify(name) })); }

  function handleEdit(cat: ApiCategory) {
    setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? "", color: cat.color ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() { setForm(EMPTY_CATEGORY); setStatus(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, slug: form.slug, color: form.color || null, ...(form.description ? { description: form.description } : {}) };
    try {
      if (form.id) { await updateCategory(form.id, payload); setStatus({ message: `Catégorie "${form.name}" mise à jour.`, error: false }); }
      else { await createCategory(payload); setStatus({ message: `Catégorie "${form.name}" créée.`, error: false }); handleReset(); }
      await loadData();
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try { await deleteCategory(id); setStatus({ message: `Catégorie "${name}" supprimée.`, error: false }); if (form.id === id) handleReset(); await loadData(); }
    catch (e) { setStatus({ message: String(e), error: true }); }
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-4">{form.id ? `Modifier #${form.id}` : "Nouvelle catégorie"}</h2>
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom *"><input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={CX.input} /></Field>
          <Field label="Slug *"><input type="text" required value={form.slug} onChange={(e) => patch("slug", e.target.value)} className={CX.input} /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => patch("description", e.target.value)} rows={4} className={CX.input} /></Field>
          <Field label="Couleur">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: form.color || "#e5e7eb" }} />
              <select value={form.color} onChange={(e) => patch("color", e.target.value)} className={CX.input}>
                <option value="">— Aucune —</option>
                {COLOR_PALETTE.map(({ hex, label }) => <option key={hex} value={hex}>{label} ({hex})</option>)}
              </select>
            </div>
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>{form.id ? "Enregistrer" : "Créer"}</button>
            {form.id && <button type="button" onClick={handleReset} className={CX.btnGhost}>Annuler</button>}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Catégories</h2>
          <span className="text-sm font-semibold text-gray-400">({categories.length})</span>
        </div>
        {loading ? <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className={CX.th}>Nom / Slug</th><th className={CX.th}>Description</th><th className={CX.th} /></tr></thead>
              <tbody>
                {categories.length === 0 ? <EmptyRow cols={3} message="Aucune catégorie." /> : categories.map((cat) => (
                  <tr key={cat.id} className={`border-b border-gray-50 hover:bg-gray-50 ${form.id === cat.id ? "bg-blue-50" : ""}`}>
                    <td className={CX.td}>
                      <div className="flex items-center gap-2">
                        {cat.color && <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: cat.color }} />}
                        <div className="font-semibold text-[#000c34]">{cat.name}</div>
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5 font-mono">/{cat.slug}</div>
                    </td>
                    <td className={`${CX.td} text-gray-500 max-w-[280px]`}>{cat.description ? <span className="line-clamp-2">{cat.description}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className={`${CX.td} whitespace-nowrap`}>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(cat)} className={CX.btnEdit}>Modifier</button>
                        <button onClick={() => handleDelete(cat.id, cat.name)} className={CX.btnDelete}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
    try { setTags(await getTags()); } catch (e) { setStatus({ message: String(e), error: true }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleNameChange(name: string) { setForm((f) => ({ ...f, name, slug: f.id ? f.slug : slugify(name) })); }
  function handleEdit(tag: ApiTag) { setForm({ id: tag.id, name: tag.name, slug: tag.slug }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function handleReset() { setForm(EMPTY_TAG); setStatus(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (form.id) { await updateTag(form.id, { name: form.name, slug: form.slug }); setStatus({ message: `Tag "${form.name}" mis à jour.`, error: false }); }
      else { await createTag({ name: form.name, slug: form.slug }); setStatus({ message: `Tag "${form.name}" créé.`, error: false }); handleReset(); }
      await loadData();
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer le tag "${name}" ?`)) return;
    try { await deleteTag(id); setStatus({ message: `Tag "${name}" supprimé.`, error: false }); if (form.id === id) handleReset(); await loadData(); }
    catch (e) { setStatus({ message: String(e), error: true }); }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-4">{form.id ? `Modifier #${form.id}` : "Nouveau tag"}</h2>
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom *"><input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={CX.input} /></Field>
          <Field label="Slug *"><input type="text" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={CX.input} /></Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>{form.id ? "Enregistrer" : "Créer"}</button>
            {form.id && <button type="button" onClick={handleReset} className={CX.btnGhost}>Annuler</button>}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Tags</h2>
          <span className="text-sm font-semibold text-gray-400">({tags.length})</span>
        </div>
        {loading ? <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className={CX.th}>Nom</th><th className={CX.th}>Slug</th><th className={CX.th} /></tr></thead>
              <tbody>
                {tags.length === 0 ? <EmptyRow cols={3} message="Aucun tag." /> : tags.map((tag) => (
                  <tr key={tag.id} className={`border-b border-gray-50 hover:bg-gray-50 ${form.id === tag.id ? "bg-blue-50" : ""}`}>
                    <td className={CX.td}><span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{tag.name}</span></td>
                    <td className={`${CX.td} text-gray-400 font-mono text-xs`}>{tag.slug}</td>
                    <td className={`${CX.td} whitespace-nowrap`}>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(tag)} className={CX.btnEdit}>Modifier</button>
                        <button onClick={() => handleDelete(tag.id, tag.name)} className={CX.btnDelete}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Challenges tab ───────────────────────────────────────────────────────────

const OBJECTIVE_TYPES: { value: ChallengeObjectiveType; label: string }[] = [
  { value: "distance", label: "Distance (km)" },
  { value: "elevation", label: "Dénivelé (m)" },
  { value: "frenquency", label: "Fréquence (sorties)" },
  { value: "duration", label: "Durée (min)" },
];

type ObjForm = { type: ChallengeObjectiveType; value: number };

const EMPTY_CHALLENGE = {
  id: null as number | null,
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  objectives: [{ type: "distance" as ChallengeObjectiveType, value: 0 }] as ObjForm[],
  rewardName: "",
  rewardDescription: "",
  rewardImage: "",
};

function ChallengesTab() {
  const [challenges, setChallenges] = useState<ApiChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState(EMPTY_CHALLENGE);

  const loadData = useCallback(async () => {
    setLoading(true);
    try { setChallenges(await getChallenges()); } catch (e) { setStatus({ message: String(e), error: true }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function patchField<K extends keyof typeof EMPTY_CHALLENGE>(key: K, value: (typeof EMPTY_CHALLENGE)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateObjective(index: number, field: keyof ObjForm, value: string | number) {
    setForm((f) => {
      const objs = [...f.objectives];
      objs[index] = { ...objs[index], [field]: field === "value" ? Number(value) || 0 : value };
      return { ...f, objectives: objs };
    });
  }

  function addObjective() {
    setForm((f) => ({ ...f, objectives: [...f.objectives, { type: "distance" as ChallengeObjectiveType, value: 0 }] }));
  }

  function removeObjective(index: number) {
    setForm((f) => ({ ...f, objectives: f.objectives.filter((_, i) => i !== index) }));
  }

  function handleEdit(c: ApiChallenge) {
    setForm({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate.slice(0, 10),
      objectives: c.objectives.map((o) => ({ type: o.type, value: o.value })),
      rewardName: c.reward?.name ?? "",
      rewardDescription: c.reward?.description ?? "",
      rewardImage: c.reward?.image ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() { setForm(EMPTY_CHALLENGE); setStatus(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ChallengePayload = {
      title: form.title,
      description: form.description || null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      objectives: form.objectives.filter((o) => o.value > 0),
      ...(form.rewardName ? {
        reward: {
          name: form.rewardName,
          description: form.rewardDescription || null,
          image: form.rewardImage || null,
        },
      } : {}),
    };
    try {
      if (form.id) {
        await updateChallenge(form.id, payload);
        setStatus({ message: `Défi "${form.title}" mis à jour.`, error: false });
      } else {
        await createChallenge(payload);
        setStatus({ message: `Défi "${form.title}" créé.`, error: false });
        handleReset();
      }
      await loadData();
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Supprimer le défi "${title}" ?`)) return;
    try {
      await deleteChallenge(id);
      setStatus({ message: `Défi "${title}" supprimé.`, error: false });
      if (form.id === id) handleReset();
      await loadData();
    } catch (e) { setStatus({ message: String(e), error: true }); }
  }

  return (
    <div className="grid lg:grid-cols-[480px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-black text-[#000c34] text-lg mb-4">
          {form.id ? `Modifier le défi #${form.id}` : "Nouveau défi"}
        </h2>
        <StatusBar status={status} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Titre *">
            <input type="text" required value={form.title} onChange={(e) => patchField("title", e.target.value)} className={CX.input} placeholder="Grand Tour Michelin 2026" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => patchField("description", e.target.value)} rows={3} className={CX.input} placeholder="Description du défi…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date de début *">
              <input type="date" required value={form.startDate} onChange={(e) => patchField("startDate", e.target.value)} className={CX.input} />
            </Field>
            <Field label="Date de fin *">
              <input type="date" required value={form.endDate} onChange={(e) => patchField("endDate", e.target.value)} className={CX.input} />
            </Field>
          </div>

          {/* Objectives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Objectifs</label>
              <button type="button" onClick={addObjective} className="text-[#27509b] text-xs font-bold hover:underline">+ Ajouter</button>
            </div>
            <div className="space-y-2">
              {form.objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={obj.type} onChange={(e) => updateObjective(i, "type", e.target.value)} className={`${CX.input} flex-1`}>
                    {OBJECTIVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input type="number" min={0} value={obj.value} onChange={(e) => updateObjective(i, "value", e.target.value)} className={`${CX.input} w-28`} placeholder="Valeur" />
                  {form.objectives.length > 1 && (
                    <button type="button" onClick={() => removeObjective(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reward */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Récompense</label>
            <div className="space-y-3">
              <Field label="Nom du prix">
                <input type="text" value={form.rewardName} onChange={(e) => patchField("rewardName", e.target.value)} className={CX.input} placeholder="Paire de Michelin Power Cup" />
              </Field>
              <Field label="Description du prix">
                <input type="text" value={form.rewardDescription} onChange={(e) => patchField("rewardDescription", e.target.value)} className={CX.input} placeholder="Description courte…" />
              </Field>
              <Field label="Image du prix (URL)">
                <input type="text" value={form.rewardImage} onChange={(e) => patchField("rewardImage", e.target.value)} className={CX.input} placeholder="https://…" />
              </Field>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className={CX.btnPrimary}>{form.id ? "Enregistrer" : "Créer le défi"}</button>
            {form.id && <button type="button" onClick={handleReset} className={CX.btnGhost}>Annuler</button>}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-black text-[#000c34] text-lg">Défis</h2>
          <span className="text-sm font-semibold text-gray-400">({challenges.length})</span>
        </div>
        {loading ? <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={CX.th}>Titre</th>
                  <th className={CX.th}>Période</th>
                  <th className={CX.th}>Objectifs</th>
                  <th className={CX.th}>Récompense</th>
                  <th className={CX.th} />
                </tr>
              </thead>
              <tbody>
                {challenges.length === 0 ? <EmptyRow cols={5} message="Aucun défi." /> : challenges.map((c) => {
                  const now = Date.now();
                  const isActive = now >= new Date(c.startDate).getTime() && now <= new Date(c.endDate).getTime();
                  const isPast = now > new Date(c.endDate).getTime();
                  return (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${form.id === c.id ? "bg-blue-50" : ""}`}>
                      <td className={CX.td}>
                        <div className="font-semibold text-[#000c34] leading-tight">{c.title}</div>
                        <div className="mt-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : isPast ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}`}>
                            {isActive ? "EN COURS" : isPast ? "TERMINE" : "A VENIR"}
                          </span>
                        </div>
                      </td>
                      <td className={`${CX.td} text-gray-400 text-xs whitespace-nowrap`}>
                        {fmtDate(c.startDate)}<br />{fmtDate(c.endDate)}
                      </td>
                      <td className={CX.td}>
                        <div className="flex flex-wrap gap-1">
                          {c.objectives.map((o) => (
                            <span key={o.id} className="inline-block bg-[#27509b]/10 text-[#27509b] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                              {o.value} {o.type === "distance" ? "km" : o.type === "elevation" ? "m D+" : o.type === "duration" ? "min" : "x"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={CX.td}>
                        {c.reward ? (
                          <span className="text-xs text-gray-600">{c.reward.name}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className={`${CX.td} whitespace-nowrap`}>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(c)} className={CX.btnEdit}>Modifier</button>
                          <button onClick={() => handleDelete(c.id, c.title)} className={CX.btnDelete}>Suppr.</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SECTIONS: { id: TabSection; label: string; icon: React.ReactNode; tabs: { id: EditTab; label: string }[] }[] = [
  {
    id: "blog", label: "Blog", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    tabs: [
      { id: "articles", label: "Articles" },
      { id: "categories", label: "Catégories" },
      { id: "tags", label: "Tags" },
    ],
  },
  {
    id: "challenges", label: "Challenges", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    tabs: [
      { id: "challenges", label: "Défis" },
    ],
  },
];

export default function EditPage() {
  const [activeTab, setActiveTab] = useState<EditTab>("articles");

  const activeSection = SECTIONS.find((s) => s.tabs.some((t) => t.id === activeTab)) ?? SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <header className="sticky top-0 z-50 bg-[#000c34] shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#fce500] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#000c34]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-black text-white text-sm leading-tight">Console d&apos;administration</h1>
              <p className="text-white/40 text-[10px] leading-tight">Michelin Velo Hub</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/50 hover:text-white transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Section switcher + sub-tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Section pills */}
          <div className="flex gap-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.tabs[0].id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                  activeSection.id === section.id
                    ? "bg-[#000c34] text-white border-[#000c34] shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#27509b] hover:text-[#27509b]"
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-px h-8 bg-gray-300" />

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            {activeSection.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-[#27509b] text-white shadow-sm"
                    : "text-gray-500 hover:text-[#27509b] hover:bg-blue-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "tags" && <TagsTab />}
        {activeTab === "challenges" && <ChallengesTab />}
      </div>
    </div>
  );
}
