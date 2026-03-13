import Cookies from "js-cookie";
import type { TokenResponse, User } from "@/types";

export function saveTokens(tokens: TokenResponse) {
  Cookies.set("access_token", tokens.access_token, { expires: 1 });
  Cookies.set("refresh_token", tokens.refresh_token, { expires: 30 });
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token");
}
