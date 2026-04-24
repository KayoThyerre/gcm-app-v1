import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import {
  api,
  clearStoredAuth,
  registerSessionInvalidHandler,
  resetSessionInvalidState,
} from "../services/api";

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
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "click",
  "keydown",
  "scroll",
  "touchstart",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUserState] = useState<User | null>(() => {
    const token = localStorage.getItem("auth:token");
    const storedUser = localStorage.getItem("auth:user");

    if (!token) {
      delete api.defaults.headers.common.Authorization;
      return null;
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      clearStoredAuth();
      return null;
    }
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() =>
    Boolean(localStorage.getItem("auth:token"))
  );
  const inactivityTimeoutRef = useRef<number | null>(null);
  const sessionValidationStartedRef = useRef(false);

  const isAuthenticated = !!user;

  const clearAuthState = useCallback(() => {
    clearStoredAuth();
    setUserState(null);
  }, []);

  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current !== null) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  const redirectToLogin = useCallback(
    (message: string) => {
      navigate("/login", {
        replace: true,
        state: { message },
      });
    },
    [navigate]
  );

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

  const logout = useCallback(() => {
    resetSessionInvalidState();
    clearInactivityTimeout();
    clearAuthState();
  }, [clearAuthState, clearInactivityTimeout]);

  const logoutDueToInactivity = useCallback(() => {
    resetSessionInvalidState();
    clearInactivityTimeout();
    clearAuthState();
    redirectToLogin("Sess\u00e3o encerrada por inatividade");
  }, [clearAuthState, clearInactivityTimeout, redirectToLogin]);

  const handleInvalidSession = useCallback(
    (message: string) => {
      clearInactivityTimeout();
      clearAuthState();
      redirectToLogin(message);
    },
    [clearAuthState, clearInactivityTimeout, redirectToLogin]
  );

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    clearInactivityTimeout();
    inactivityTimeoutRef.current = window.setTimeout(() => {
      logoutDueToInactivity();
    }, INACTIVITY_TIMEOUT);
  }, [clearInactivityTimeout, isAuthenticated, logoutDueToInactivity]);

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

      resetSessionInvalidState();
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

  useEffect(() => {
    registerSessionInvalidHandler(handleInvalidSession);

    return () => {
      registerSessionInvalidHandler(null);
    };
  }, [handleInvalidSession]);

  useEffect(() => {
    if (sessionValidationStartedRef.current) {
      return;
    }

    sessionValidationStartedRef.current = true;

    const token = localStorage.getItem("auth:token");

    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    void api
      .get("/profile")
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setUserState((previousUser) => {
          if (previousUser) {
            const validatedUser = { ...previousUser, ...response.data };
            localStorage.setItem("auth:user", JSON.stringify(validatedUser));
            return validatedUser;
          }

          return previousUser;
        });
      })
      .catch((error) => {
        if (!isMounted || !isAxiosError(error) || error.response?.status === 401) {
          return;
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimeout();
      return;
    }

    resetInactivityTimer();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetInactivityTimer, {
        passive: true,
      });
    }

    return () => {
      clearInactivityTimeout();

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetInactivityTimer);
      }
    };
  }, [clearInactivityTimeout, isAuthenticated, resetInactivityTimer]);

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
