const TOKEN_KEY = "englishListening.githubToken";

export type TokenState = {
  token: string;
  source: "session" | "local" | "none";
};

export function readToken(): TokenState {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY) || "";
  if (sessionToken) {
    return { token: sessionToken, source: "session" };
  }

  const localToken = localStorage.getItem(TOKEN_KEY) || "";
  if (localToken) {
    return { token: localToken, source: "local" };
  }

  return { token: "", source: "none" };
}

export function saveToken(token: string, rememberDevice: boolean): void {
  const normalized = normalizeGitHubToken(token);
  sessionStorage.setItem(TOKEN_KEY, normalized);
  if (rememberDevice) {
    localStorage.setItem(TOKEN_KEY, normalized);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function normalizeGitHubToken(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, "");
}
