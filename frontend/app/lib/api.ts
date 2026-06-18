export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface ApiTag {
  id: number;
  name: string;
  slug: string;
}

export interface ApiArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: ApiCategory;
  tags: ApiTag[];
}

interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

/* ── Auth types ─────────────────────────────────────────────────────── */

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export interface ApiError {
  error: string;
}

/* ── Auth API ───────────────────────────────────────────────────────── */

export async function apiLogin(login: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erreur de connexion");
  return data as LoginResponse;
}

export async function apiRegister(payload: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'inscription");
  return data as RegisterResponse;
}

/* ── Generic fetchers ───────────────────────────────────────────────── */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: { Accept: "application/ld+json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getArticles(): Promise<ApiArticle[]> {
  const data = await apiFetch<HydraCollection<ApiArticle>>(
    "/api/articles?order%5BpublishedAt%5D=desc"
  );
  return data.member;
}

export async function getArticleBySlug(slug: string): Promise<ApiArticle | null> {
  const data = await apiFetch<HydraCollection<ApiArticle>>(
    `/api/articles?slug=${encodeURIComponent(slug)}`
  );
  return data.member[0] ?? null;
}

export async function getCategories(): Promise<ApiCategory[]> {
  const data = await apiFetch<HydraCollection<ApiCategory>>("/api/categories");
  return data.member;
}

export async function getTags(): Promise<ApiTag[]> {
  const data = await apiFetch<HydraCollection<ApiTag>>("/api/tags");
  return data.member;
}

async function apiPost<T>(path: string, body: unknown, ct = "application/ld+json"): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/ld+json", "Content-Type": ct },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { Accept: "application/ld+json", "Content-Type": "application/merge-patch+json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
}

export type ArticlePayload = {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  viewCount: number;
  publishedAt: string | null;
};

export async function createArticle(data: ArticlePayload): Promise<ApiArticle> {
  return apiPost("/api/articles", data);
}

export async function updateArticle(id: number, data: Partial<ArticlePayload>): Promise<ApiArticle> {
  return apiPatch(`/api/articles/${id}`, data);
}

export async function deleteArticle(id: number): Promise<void> {
  return apiDelete(`/api/articles/${id}`);
}

export type CategoryPayload = { name: string; slug: string; description?: string; color?: string | null };

export async function createCategory(data: CategoryPayload): Promise<ApiCategory> {
  return apiPost("/api/categories", data);
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>): Promise<ApiCategory> {
  return apiPatch(`/api/categories/${id}`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  return apiDelete(`/api/categories/${id}`);
}

export type TagPayload = { name: string; slug: string };

export async function createTag(data: TagPayload): Promise<ApiTag> {
  return apiPost("/api/tags", data);
}

export async function updateTag(id: number, data: Partial<TagPayload>): Promise<ApiTag> {
  return apiPatch(`/api/tags/${id}`, data);
}

export async function deleteTag(id: number): Promise<void> {
  return apiDelete(`/api/tags/${id}`);
}
