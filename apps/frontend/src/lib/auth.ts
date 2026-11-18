const TOKEN_KEY = "tms_token";
const AUTH_EVENT = "tms:auth-change";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChange();
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  notifyAuthChange();
}

function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === null) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

export function getTokenSnapshot(): string | null {
  return getToken();
}

export function getServerTokenSnapshot(): string | null {
  return null;
}
