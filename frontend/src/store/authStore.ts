import { create } from 'zustand';
import { User } from '../types/auth.types';

const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user',
  expiry: 'auth_expiry',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: (user, token, rememberMe = true) => {
    clearAllStorage();

    if (rememberMe) {
      // Persist for 30 days in localStorage with an expiry timestamp
      const expiry = Date.now() + THIRTY_DAYS_MS;
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.expiry, String(expiry));
    } else {
      // Session-only: cleared when browser closes; expiry = 1 day as a safety net
      const expiry = Date.now() + ONE_DAY_MS;
      sessionStorage.setItem(STORAGE_KEYS.token, token);
      sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      sessionStorage.setItem(STORAGE_KEYS.expiry, String(expiry));
    }

    set({ user, token });
  },

  logout: () => {
    clearAllStorage();
    set({ user: null, token: null });
  },

  initialize: () => {
    // Check localStorage first (remember me), then sessionStorage (session only)
    const storages = [localStorage, sessionStorage];

    for (const storage of storages) {
      const token = storage.getItem(STORAGE_KEYS.token);
      const userStr = storage.getItem(STORAGE_KEYS.user);
      const expiryStr = storage.getItem(STORAGE_KEYS.expiry);

      if (!token || !userStr) continue;

      // Check expiry — if missing or past, clear and skip
      const expiry = expiryStr ? Number(expiryStr) : 0;
      if (!expiry || Date.now() > expiry) {
        clearAllStorage();
        continue;
      }

      try {
        const user = JSON.parse(userStr);
        set({ user, token });
        return; // Found a valid session, stop looking
      } catch {
        clearAllStorage();
      }
    }
  },
}));
