import { createContext, useContext, useState } from "react";
import { isAxiosError } from "axios";
import { api } from "../services/api";

type User = {
  id?: string;
  email?: string;
  phone?: string | null;
  createdAt?: string;
  avatarUrl?: string | null;
  name: string;
  role: string;
};

type AuthContextData = {
  user: User | null;
  setUser: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authError: string | null;
};

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const token = localStorage.getItem("auth:token");
    const storedUser = localStorage.getItem("auth:user");
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticated = !!user;
  const loading = false;

  function setUser(updatedUser: Partial<User>) {
    setUserState((previousUser) => {
      if (!previousUser) {
        return previousUser;
      }

      const mergedUser = { ...previousUser, ...updatedUser };
      localStorage.setItem("auth:user", JSON.stringify(mergedUser));
      return mergedUser;
    });
  }

  async function login(email: string, password: string) {
    try {
      setAuthError(null);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      localStorage.setItem("auth:token", token);
      localStorage.setItem("auth:user", JSON.stringify(user));

      setUserState(user);
    } catch (error) {
      let message = "Erro ao tentar fazer login.";

      if (isAxiosError<{ error?: string }>(error)) {
        const apiErrorMessage = error.response?.data?.error;
        if (typeof apiErrorMessage === "string" && apiErrorMessage.trim()) {
          message = apiErrorMessage;
        }
      }

      setAuthError(message);
      throw new Error(message);
    }
  }

  function logout() {
    localStorage.removeItem("auth:token");
    localStorage.removeItem("auth:user");
    setUserState(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        login,
        logout,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
