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

export type ChallengeObjectiveType = "distance" | "elevation" | "frenquency" | "duration";

export interface ApiChallengeObjective {
  id: number;
  type: ChallengeObjectiveType;
  value: number;
}

export interface ApiChallengeReward {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
}

export interface ApiChallenge {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  objectives: ApiChallengeObjective[];
  reward: ApiChallengeReward | null;
}

interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

const API_PREFIX = "/api";
const AUTH_TOKEN_KEY = "michelin_hub_token";

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${normalizedPath}`;
}

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
  const res = await fetch(apiUrl("/login"), {
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
  const res = await fetch(apiUrl("/register"), {
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
  const res = await fetch(apiUrl("/authorize?scope=read,activity:read_all"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Impossible de recuperer l'URL Strava");
  return data as StravaAuthUrlResponse;
}

export async function stravaExchangeToken(token: string, code: string): Promise<StravaExchangeResponse> {
  const res = await fetch(apiUrl("/strava/token/exchange"), {
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
  const res = await fetch(apiUrl("/strava/token/refresh"), {
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
  mapSummaryPolyline: string | null;
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
  const res = await fetch(apiUrl('/activity/sync'), {
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
  const res = await fetch(apiUrl('/strava/disconnect'), {
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
  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: { Accept: "application/ld+json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getStoredAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return {};

  return { Authorization: `Bearer ${token}` };
}

export async function getArticles(): Promise<ApiArticle[]> {
  const data = await apiFetch<HydraCollection<ApiArticle>>(
    "/articles?order%5BpublishedAt%5D=desc"
  );
  return data.member;
}

export async function getArticleBySlug(slug: string): Promise<ApiArticle | null> {
  const data = await apiFetch<HydraCollection<ApiArticle>>(
    `/articles?slug=${encodeURIComponent(slug)}`
  );
  return data.member[0] ?? null;
}

export async function getCategories(): Promise<ApiCategory[]> {
  const data = await apiFetch<HydraCollection<ApiCategory>>("/categories");
  return data.member;
}

export async function getTags(): Promise<ApiTag[]> {
  const data = await apiFetch<HydraCollection<ApiTag>>("/tags");
  return data.member;
}

export async function getChallenges(): Promise<ApiChallenge[]> {
  const data = await apiFetch<HydraCollection<ApiChallenge>>("/challenges");
  return data.member;
}

export interface ApiParticipation {
  id: number;
  challengeId: number;
  progress: number;
  completed: boolean;
  joinedAt: string;
  completedAt: string | null;
}

export async function getMyParticipations(token: string): Promise<ApiParticipation[]> {
  const res = await fetch(apiUrl('/me/participations'), {
    headers: { Accept: 'application/json', ...bearerHeaders(token) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export interface ChallengeActivity {
  id: number;
  activityId: string;
  name: string;
  distance: number;
  movingTime: number;
  totalElevationGain: number;
  sportType: string;
  startedAt: string;
  locationCity: string | null;
  averageSpeed: number;
  mapSummaryPolyline: string | null;
}

export async function getChallengeActivities(challengeId: number, token: string): Promise<ChallengeActivity[]> {
  const res = await fetch(apiUrl(`/challenges/${challengeId}/activities`), {
    headers: { Accept: 'application/json', ...bearerHeaders(token) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function participateChallenge(challengeId: number, token: string): Promise<{ participationId: number; created: boolean }> {
  const res = await fetch(apiUrl(`/challenges/${challengeId}/participate`), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...bearerHeaders(token) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown, ct = "application/ld+json"): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/ld+json",
      "Content-Type": ct,
      ...getStoredAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: {
      Accept: "application/ld+json",
      "Content-Type": "application/merge-patch+json",
      ...getStoredAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function apiDelete(path: string): Promise<void> {
  const response = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: {
      ...getStoredAuthHeaders(),
    },
  });
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
  return apiPost("/articles", data);
}

export async function updateArticle(id: number, data: Partial<ArticlePayload>): Promise<ApiArticle> {
  return apiPatch(`/articles/${id}`, data);
}

export async function deleteArticle(id: number): Promise<void> {
  return apiDelete(`/articles/${id}`);
}

export type CategoryPayload = { name: string; slug: string; description?: string; color?: string | null };

export async function createCategory(data: CategoryPayload): Promise<ApiCategory> {
  return apiPost("/categories", data);
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>): Promise<ApiCategory> {
  return apiPatch(`/categories/${id}`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  return apiDelete(`/categories/${id}`);
}

export type TagPayload = { name: string; slug: string };

export async function createTag(data: TagPayload): Promise<ApiTag> {
  return apiPost("/tags", data);
}

export async function updateTag(id: number, data: Partial<TagPayload>): Promise<ApiTag> {
  return apiPatch(`/tags/${id}`, data);
}

export async function deleteTag(id: number): Promise<void> {
  return apiDelete(`/tags/${id}`);
}

export type ChallengePayload = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  objectives: {
    type: ChallengeObjectiveType;
    value: number;
  }[];
  reward?: {
    name: string;
    description?: string | null;
    image?: string | null;
  } | null;
};

export async function createChallenge(data: ChallengePayload): Promise<ApiChallenge> {
  return apiPost("/challenges", data);
}

export async function updateChallenge(
  id: number,
  data: Partial<ChallengePayload>
): Promise<ApiChallenge> {
  return apiPatch(`/challenges/${id}`, data);
}

export async function deleteChallenge(id: number): Promise<void> {
  return apiDelete(`/challenges/${id}`);
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
  const data = await apiFetch<HydraCollection<ApiBike>>('/bikes', {
    headers: bearerHeaders(token),
  });
  return data.member;
}

export async function createBike(payload: BikeCreatePayload, token: string): Promise<ApiBike> {
  const res = await fetch(apiUrl('/bikes'), {
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
  const res = await fetch(apiUrl(`/bikes/${id}`), {
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
  const res = await fetch(apiUrl(`/bikes/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

/* ── Comments & Likes ──────────────────────────────────────────────── */

export interface ApiCommentAuthor {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface ApiComment {
  id: number;
  content: string;
  createdAt: string;
  author: ApiCommentAuthor;
}

export interface ApiLike {
  id: number;
  user: { id: number };
}

export async function getArticleComments(articleId: number): Promise<ApiComment[]> {
  const data = await apiFetch<HydraCollection<ApiComment>>(
    `/articles/${articleId}/comments?order%5BcreatedAt%5D=desc`,
  );
  return data.member;
}

export async function postComment(articleId: number, content: string, token: string): Promise<ApiComment> {
  const res = await fetch(apiUrl('/comments'), {
    method: 'POST',
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/ld+json',
      ...bearerHeaders(token),
    },
    body: JSON.stringify({ article: `/api/articles/${articleId}`, content }),
  });
  if (!res.ok) return apiBikeError(res);
  return res.json();
}

export async function deleteComment(id: number, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/comments/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

export async function getArticleLikes(articleId: number): Promise<ApiLike[]> {
  const data = await apiFetch<HydraCollection<ApiLike>>(
    `/articles/${articleId}/likes`,
  );
  return data.member;
}

export async function postLike(articleId: number, token: string): Promise<ApiLike> {
  const res = await fetch(apiUrl('/article_likes'), {
    method: 'POST',
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/ld+json',
      ...bearerHeaders(token),
    },
    body: JSON.stringify({ article: `/api/articles/${articleId}` }),
  });
  if (!res.ok) return apiBikeError(res);
  return res.json();
}

export async function deleteLike(id: number, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/article_likes/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

/* ── Gum (admin write) ─────────────────────────────────────────────────── */

export interface ApiGum {
  id: number;
  name: string;
  gripType: string;
}

export type GumPayload = { name: string; gripType: string };

async function adminError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  const msg =
    (body as Record<string, string>)['hydra:description'] ??
    (body as Record<string, string>)['detail'] ??
    `${res.status} ${res.statusText}`;
  throw new Error(msg);
}

export async function getGums(): Promise<ApiGum[]> {
  const data = await apiFetch<HydraCollection<ApiGum>>('/gums');
  return data.member;
}

export async function createGum(payload: GumPayload, token: string): Promise<ApiGum> {
  const res = await fetch(apiUrl('/gums'), {
    method: 'POST',
    headers: { Accept: 'application/ld+json', 'Content-Type': 'application/ld+json', ...bearerHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return adminError(res);
  return res.json();
}

export async function updateGum(id: number, payload: Partial<GumPayload>, token: string): Promise<ApiGum> {
  const res = await fetch(apiUrl(`/gums/${id}`), {
    method: 'PATCH',
    headers: { Accept: 'application/ld+json', 'Content-Type': 'application/merge-patch+json', ...bearerHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return adminError(res);
  return res.json();
}

export async function deleteGum(id: number, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/gums/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

/* ── TireLine (admin write) ────────────────────────────────────────────── */

export interface ApiTireLine {
  id: number;
  name: string;
  manufacturer: string;
  description: string | null;
  url: string | null;
}

export type TireLinePayload = {
  name: string;
  manufacturer: string;
  description?: string | null;
  url?: string | null;
};

export async function getTireLines(): Promise<ApiTireLine[]> {
  const data = await apiFetch<HydraCollection<ApiTireLine>>('/tire_lines');
  return data.member;
}

export async function createTireLine(payload: TireLinePayload, token: string): Promise<ApiTireLine> {
  const res = await fetch(apiUrl('/tire_lines'), {
    method: 'POST',
    headers: { Accept: 'application/ld+json', 'Content-Type': 'application/ld+json', ...bearerHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return adminError(res);
  return res.json();
}

export async function updateTireLine(id: number, payload: Partial<TireLinePayload>, token: string): Promise<ApiTireLine> {
  const res = await fetch(apiUrl(`/tire_lines/${id}`), {
    method: 'PATCH',
    headers: { Accept: 'application/ld+json', 'Content-Type': 'application/merge-patch+json', ...bearerHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return adminError(res);
  return res.json();
}

export async function deleteTireLine(id: number, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/tire_lines/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

/* ── Tire catalog (public read) ──────────────────────────────────────── */

export interface ApiTireModel {
  id: number;
  cai: string;
  brand: string;
  model: string;
  fitting: string;
  sealing: string;
  outerDiameter: number;
  sectionWidth: number;
  etrto: string;
  tpi: string;
  weight: number;
  minPressureBar: number | null;
  maxPressureBar: number | null;
  terrainTypes: string | null;
  tireLine: string | { id: number; name: string; manufacturer: string };
  gum: string | { id: number; name: string } | null;
}

export async function getTireCatalog(): Promise<ApiTireModel[]> {
  const data = await apiFetch<HydraCollection<ApiTireModel>>('/tires?itemsPerPage=200');
  return data.member;
}

/* ── UserTire ─────────────────────────────────────────────────────────── */

export interface ApiUserTire {
  id: number;
  bike: string | null;
  tireModel: ApiTireModel | null;
  customName: string | null;
  position: 'front' | 'rear' | null;
  installedAtKm: number;
  removedAtKm: number | null;
  expectedLifespanKm: number | null;
  retiredAt: string | null;
  createdAt: string;
}

export type UserTirePayload = {
  bike?: string | null;
  tireModel?: string | null;
  customName?: string | null;
  position?: 'front' | 'rear' | null;
  installedAtKm?: number;
  removedAtKm?: number | null;
  expectedLifespanKm?: number | null;
  retiredAt?: string | null;
};

export async function getUserTires(token: string): Promise<ApiUserTire[]> {
  const data = await apiFetch<HydraCollection<ApiUserTire>>('/user_tires', {
    headers: bearerHeaders(token),
  });
  return data.member;
}

export async function createUserTire(payload: UserTirePayload, token: string): Promise<ApiUserTire> {
  const res = await fetch(apiUrl('/user_tires'), {
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

export async function patchUserTire(
  id: number,
  payload: Partial<UserTirePayload>,
  token: string,
): Promise<ApiUserTire> {
  const res = await fetch(apiUrl(`/user_tires/${id}`), {
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

export async function destroyUserTire(id: number, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/user_tires/${id}`), {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}
