export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  credits_remaining: number;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ModelAsset {
  id: string;
  name: string;
  gender: "male" | "female" | "unisex";
  body_type: "slim" | "average" | "plus_size";
  skin_tone: "light" | "medium" | "dark";
  image_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Generation {
  id: string;
  garment_url: string;
  output_urls?: string[];
  status: "pending" | "processing" | "completed" | "failed";
  category: "tops" | "bottoms" | "one-pieces";
  credits_used: number;
  error_message?: string;
  model_asset?: ModelAsset;
  created_at: string;
  updated_at: string;
}

export interface BatchJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  total: number;
  completed: number;
  failed: number;
  progress: number;
  results?: Array<{
    id: string;
    model_asset_id: string;
    status: string;
    output_urls?: string[];
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminStats {
  total_users: number;
  total_generations: number;
  total_credits_used: number;
  active_users_today: number;
  total_batch_jobs: number;
}
