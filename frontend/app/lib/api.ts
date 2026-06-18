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

/* ── Strava types ──────────────────────────────────────────────────── */

export interface StravaAuthUrlResponse {
  authorizationUrl: string;
}

export interface StravaExchangeResponse {
  message: string;
  stravaAccountId: number;
  athleteId: number;
  scope: string;
  tokenExpiresAt: string;
}

export interface StravaRefreshResponse {
  message: string;
  stravaAccountId: number;
  scope: string;
  tokenExpiresAt: string;
}

/* ── Strava API ────────────────────────────────────────────────────── */

export async function stravaGetAuthUrl(token: string): Promise<StravaAuthUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/api/authorize?scope=read,activity:read_all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Impossible de recuperer l'URL Strava");
  return data as StravaAuthUrlResponse;
}

export async function stravaExchangeToken(token: string, code: string): Promise<StravaExchangeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/strava/token/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Echec de l'echange de token Strava");
  return data as StravaExchangeResponse;
}

export async function stravaRefreshToken(token: string): Promise<StravaRefreshResponse> {
  const res = await fetch(`${API_BASE_URL}/api/strava/token/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Echec du rafraichissement Strava");
  return data as StravaRefreshResponse;
}

export interface SyncedActivity {
  id: number;
  activityId: string;
  name: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  type: string;
  sportType: string;
  startedAt: string;
  locationCity: string | null;
  locationCountry: string | null;
  averageSpeed: number;
  maxSpeed: number;
}

export interface StravaSyncResponse {
  message: string;
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  activities: SyncedActivity[];
}

export async function stravaSyncActivities(token: string): Promise<StravaSyncResponse> {
  const res = await fetch(`${API_BASE_URL}/api/activity/sync`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });
  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Erreur ${res.status}: reponse invalide du serveur`);
  }
  if (!res.ok) {
    const msg = (data.error ?? data['hydra:description'] ?? data.detail ?? `Erreur ${res.status}`) as string;
    throw new Error(msg);
  }
  return data as unknown as StravaSyncResponse;
}

export async function stravaDisconnect(token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/strava/disconnect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).error ?? "Echec de la deconnexion Strava");
  }
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

/* ── Bike types & API ──────────────────────────────────────────────── */

export type BikeTypeValue =
  | 'road'
  | 'mountain'
  | 'gravel'
  | 'urban'
  | 'electric'
  | 'bmx'
  | 'triathlon';

export interface ApiBike {
  id: number;
  name: string;
  brand: string | null;
  model: string | null;
  bikeType: BikeTypeValue;
  weight: number | null;
  purchaseDate: string | null;
  totalDistance: number;
  imageUrl: string | null;
  createdAt: string;
  retiredAt: string | null;
}

export type BikeCreatePayload = {
  name: string;
  brand?: string | null;
  model?: string | null;
  bikeType: BikeTypeValue;
  weight?: number | null;
  purchaseDate?: string | null;
  totalDistance?: number;
};

function bearerHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function apiBikeError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  const msg =
    (body as Record<string, string>)['hydra:description'] ??
    (body as Record<string, string>)['detail'] ??
    `${res.status} ${res.statusText}`;
  throw new Error(msg);
}

export async function getBikes(token: string): Promise<ApiBike[]> {
  const data = await apiFetch<HydraCollection<ApiBike>>('/api/bikes', {
    headers: bearerHeaders(token),
  });
  return data.member;
}

export async function createBike(payload: BikeCreatePayload, token: string): Promise<ApiBike> {
  const res = await fetch(`${API_BASE_URL}/api/bikes`, {
    method: 'POST',
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/ld+json',
      ...bearerHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return apiBikeError(res);
  return res.json();
}

export async function patchBike(
  id: number,
  payload: Partial<BikeCreatePayload>,
  token: string,
): Promise<ApiBike> {
  const res = await fetch(`${API_BASE_URL}/api/bikes/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/merge-patch+json',
      ...bearerHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return apiBikeError(res);
  return res.json();
}

export async function destroyBike(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/bikes/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}
