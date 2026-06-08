import { create } from "zustand";
import { persist } from "zustand/middleware";
import jsCookie from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        jsCookie.set("isAuthenticated", "true"); // Used by middleware to check if logged in loosely
        set({ isAuthenticated: true, user, accessToken });
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => {
        jsCookie.remove("isAuthenticated");
        set({ isAuthenticated: false, user: null, accessToken: null });
      },
    }),
    {
      name: "auth-storage", // stores the user data in localStorage
    }
  )
);
