const ACCESS_TOKEN_KEY = "wa_access_token";
const REFRESH_TOKEN_KEY = "wa_refresh_token";

export const storage = {
  getAccessToken: () => (typeof window === "undefined" ? null : sessionStorage.getItem(ACCESS_TOKEN_KEY)),
  getRefreshToken: () => (typeof window === "undefined" ? null : sessionStorage.getItem(REFRESH_TOKEN_KEY)),
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};
