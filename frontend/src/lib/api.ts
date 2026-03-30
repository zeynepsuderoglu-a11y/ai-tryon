import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";
import type {
  User, TokenResponse, ModelAsset, Generation, BatchJob,
  PaginatedResponse, AdminStats, VideoGeneration, BillingProfile
} from "@/types";

// Browser'dan Next.js proxy üzerinden gider (CORS sorunu olmaz)
// Server-side render için direkt backend URL kullanılır
const BASE_URL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  : "";

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenResponse>(
            `/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );
          Cookies.set("access_token", data.access_token, { expires: 1 });
          Cookies.set("refresh_token", data.refresh_token, { expires: 30 });
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post<TokenResponse>("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<TokenResponse>("/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken }).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, new_password }).then((r) => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<{ message: string }>("/auth/change-password", data).then((r) => r.data),

  updateBilling: (billing_profile: BillingProfile) =>
    api.put<User>("/auth/billing", { billing_profile }).then((r) => r.data),
};

// Try-On
export const tryonApi = {
  uploadGarment: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ url: string; public_id: string }>("/tryon/upload-garment", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  run: (data: {
    garment_url: string;
    model_asset_id: string;
    model_image_url?: string;
    category?: string;
    pose?: string;
    body_type?: string;
    provider?: string;
    background?: string;
    quality?: string;
    aesthetic?: string;
  }) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) form.append(k, String(v)); });
    return api.post<{ generation_id: string; status: string }>("/tryon/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (generationId: string) =>
    api.get<Generation>(`/tryon/${generationId}/status`).then((r) => r.data),

  runBatch: (data: {
    garment_url: string;
    model_ids: string[];
    category?: string;
    mode?: string;
  }) => {
    const form = new FormData();
    form.append("garment_url", data.garment_url);
    form.append("model_ids", JSON.stringify(data.model_ids));
    if (data.category) form.append("category", data.category);
    if (data.mode) form.append("mode", data.mode);
    return api.post<{ batch_job_id: string; status: string; total: number }>("/tryon/batch", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getBatchStatus: (batchJobId: string) =>
    api.get<BatchJob>(`/tryon/batch/${batchJobId}`).then((r) => r.data),
};

// Models
export const modelsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    gender?: string;
    body_type?: string;
    skin_tone?: string;
  }) =>
    api.get<PaginatedResponse<ModelAsset>>("/models", { params }).then((r) => r.data),

  get: (id: string) => api.get<ModelAsset>(`/models/${id}`).then((r) => r.data),
};

// Generations
export const generationsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Generation>>("/generations", { params }).then((r) => r.data),

  get: (id: string) => api.get<Generation>(`/generations/${id}`).then((r) => r.data),

  delete: (id: string) => api.delete(`/generations/${id}`),
};

// Eyewear
export const eyewearApi = {
  run: (data: { glasses_url: string; model_asset_id: string }) => {
    const form = new FormData();
    form.append("glasses_url", data.glasses_url);
    form.append("model_asset_id", data.model_asset_id);
    return api.post<{ generation_id: string; status: string }>("/eyewear/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (id: string) =>
    api.get<Generation>(`/eyewear/${id}/status`).then((r) => r.data),
};

// Video
export const videoApi = {
  run: (data: { image_urls: string[]; prompt?: string; mode?: string }) =>
    api.post<{ generation_id: string; status: string }>("/video/run", data).then((r) => r.data),

  getStatus: (id: string) =>
    api.get<VideoGeneration>(`/video/${id}/status`).then((r) => r.data),
};

// Payments
export const paymentsApi = {
  packages: () =>
    api.get<Record<string, { id: string; credits: number; price: number; name: string; description: string }>>("/payments/packages").then((r) => r.data),

  createCheckout: (package_id: string, billing_profile?: BillingProfile) =>
    api.post<{ paymentPageUrl: string; token: string; package: { credits: number; price: number; name: string; description: string } }>(
      "/payments/create-checkout",
      { package_id, billing_profile }
    ).then((r) => r.data),

  history: () =>
    api.get<Array<{ id: string; package_name: string; credits: number; amount_tl: number; status: string; created_at: string }>>(
      "/payments/history"
    ).then((r) => r.data),
};

// Ghost Mannequin
export const ghostMannequinApi = {
  run: (image_url: string) => {
    const form = new FormData();
    form.append("image_url", image_url);
    return api.post<{ generation_id: string; status: string }>("/ghost-mannequin/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (id: string) =>
    api.get<Generation>(`/ghost-mannequin/${id}/status`).then((r) => r.data),
};

// Admin
export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),

  users: (params?: { page?: number; page_size?: number }) =>
    api.get("/admin/users", { params }).then((r) => r.data),

  adjustCredits: (userId: string, amount: number, description?: string, credit_type?: string) =>
    api.post(`/admin/users/${userId}/credits`, { amount, description, credit_type: credit_type || "clothing" }).then((r) => r.data),

  toggleUserStatus: (userId: string, isActive: boolean) =>
    api.put(`/admin/users/${userId}/status`, null, { params: { is_active: isActive } }).then((r) => r.data),

  models: {
    list: (params?: { page?: number; page_size?: number; include_inactive?: boolean }) =>
      api.get<PaginatedResponse<ModelAsset>>("/admin/models", { params }).then((r) => r.data),

    create: (data: Partial<ModelAsset>) =>
      api.post<ModelAsset>("/admin/models", data).then((r) => r.data),

    upload: (form: FormData) =>
      api.post<ModelAsset>("/admin/models/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data),

    uploadFromUrl: (data: {
      name: string; gender: string; body_type: string;
      skin_tone: string; crop_type: string; image_url: string;
    }) => api.post<ModelAsset>("/admin/models/upload-url", data).then((r) => r.data),

    update: (id: string, data: Partial<ModelAsset>) =>
      api.put<ModelAsset>(`/admin/models/${id}`, data).then((r) => r.data),

    delete: (id: string) => api.delete(`/admin/models/${id}`),
  },
};

export default api;
