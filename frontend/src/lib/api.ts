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
    api.post<{ message: string; email: string }>("/auth/register", data).then((r) => r.data),

  verifyEmail: (email: string, code: string) =>
    api.post<TokenResponse>("/auth/verify-email", { email, code }).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post<{ message: string }>("/auth/resend-verification", { email }).then((r) => r.data),

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
    garment_detail_urls?: string[];
  }) => {
    const form = new FormData();
    const { garment_detail_urls, ...rest } = data;
    Object.entries(rest).forEach(([k, v]) => { if (v !== undefined) form.append(k, String(v)); });
    if (garment_detail_urls && garment_detail_urls.length > 0) {
      form.append("garment_detail_urls", JSON.stringify(garment_detail_urls));
    }
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
    tags?: string;
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

// AI Giydir Pro
export const geminiTryonApi = {
  run: (data: { garment_url: string; model_asset_id: string; background?: string }) => {
    const form = new FormData();
    form.append("garment_url", data.garment_url);
    form.append("model_asset_id", data.model_asset_id);
    if (data.background) form.append("background", data.background);
    return api.post<{ generation_id: string; status: string }>("/ai-pro/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (id: string) =>
    api.get<import("@/types").Generation>(`/ai-pro/${id}/status`).then((r) => r.data),
};

// Ghost Mannequin
export const ghostMannequinApi = {
  run: (image_url: string, garment_type: string = "set") => {
    const form = new FormData();
    form.append("image_url", image_url);
    form.append("garment_type", garment_type);
    return api.post<{ generation_id: string; status: string }>("/ghost-mannequin/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (id: string) =>
    api.get<Generation>(`/ghost-mannequin/${id}/status`).then((r) => r.data),
};

// Background Replace
export const backgroundReplaceApi = {
  run: (image_url: string, background: string = "white_studio", custom_bg_url: string = "") => {
    const form = new FormData();
    form.append("image_url", image_url);
    form.append("background", background);
    if (custom_bg_url) form.append("custom_bg_url", custom_bg_url);
    return api.post<{ generation_id: string; status: string }>("/background-replace/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getStatus: (id: string) =>
    api.get<Generation>(`/background-replace/${id}/status`).then((r) => r.data),
};

// Public Mannequins
export const mannequinsApi = {
  list: () =>
    api.get<{ id: string; name: string; image_url: string }[]>("/mannequins").then((r) => r.data),
};

// Public Backgrounds
export type BackgroundItem = { id: string; key: string; label: string; image_url: string; description?: string };
export const backgroundsApi = {
  list: () => api.get<BackgroundItem[]>("/backgrounds").then((r) => r.data),
};

// Mannequin Try-On
export const mannequinTryonApi = {
  run: (garment_url: string, mannequin_id: string, background: string = "white_studio", crop_type: string = "full_body") => {
    const form = new FormData();
    form.append("garment_url", garment_url);
    form.append("mannequin_id", mannequin_id);
    form.append("background", background);
    form.append("crop_type", crop_type);
    return api.post<{ generation_id: string; status: string }>("/mannequin-tryon/run", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  getStatus: (id: string) =>
    api.get<Generation>(`/mannequin-tryon/${id}/status`).then((r) => r.data),
};

// Admin
export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),

  users: (params?: { page?: number; page_size?: number }) =>
    api.get("/admin/users", { params }).then((r) => r.data),

  generations: (params?: { page?: number; page_size?: number; category?: string; status?: string; user_search?: string }) =>
    api.get("/admin/generations", { params }).then((r) => r.data),

  adjustCredits: (userId: string, amount: number, description?: string, credit_type?: string) =>
    api.post(`/admin/users/${userId}/credits`, { amount, description, credit_type: credit_type || "clothing" }).then((r) => r.data),

  toggleUserStatus: (userId: string, isActive: boolean) =>
    api.put(`/admin/users/${userId}/status`, null, { params: { is_active: isActive } }).then((r) => r.data),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`).then((r) => r.data),

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

  mannequins: {
    list: (include_inactive?: boolean) =>
      api.get<{ id: string; name: string; image_url: string; is_active: boolean; created_at: string }[]>(
        "/admin/mannequins", { params: { include_inactive } }
      ).then((r) => r.data),

    upload: (name: string, file: File) => {
      const form = new FormData();
      form.append("name", name);
      form.append("file", file);
      return api.post("/admin/mannequins/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },

    update: (id: string, data: { name?: string; is_active?: boolean }) =>
      api.put(`/admin/mannequins/${id}`, null, { params: data }).then((r) => r.data),

    delete: (id: string) => api.delete(`/admin/mannequins/${id}`),
  },

  backgrounds: {
    list: (include_inactive?: boolean) =>
      api.get<{ id: string; key: string; label: string; image_url: string; description?: string; is_active: boolean; sort_order: number; created_at: string }[]>(
        "/admin/backgrounds", { params: { include_inactive } }
      ).then((r) => r.data),

    upload: (label: string, file: File, description = "", sort_order = 0) => {
      const form = new FormData();
      form.append("label", label);
      form.append("file", file);
      form.append("description", description);
      form.append("sort_order", String(sort_order));
      return api.post("/admin/backgrounds/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },

    uploadFromUrl: (label: string, image_url: string, description = "", sort_order = 0) => {
      const form = new FormData();
      form.append("label", label);
      form.append("image_url", image_url);
      form.append("description", description);
      form.append("sort_order", String(sort_order));
      return api.post("/admin/backgrounds/upload-url", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },

    update: (id: string, data: { label?: string; description?: string; is_active?: boolean; sort_order?: number }) =>
      api.put(`/admin/backgrounds/${id}`, null, { params: data }).then((r) => r.data),

    delete: (id: string) => api.delete(`/admin/backgrounds/${id}`),
  },
};

export default api;
