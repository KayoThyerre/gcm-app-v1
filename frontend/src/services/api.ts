import axios, { AxiosError } from "axios";

type SessionInvalidHandler = (message: string) => void;

const SESSION_EXPIRED_MESSAGE =
  "Sua sess\u00e3o expirou. Fa\u00e7a login novamente.";

let sessionInvalidHandler: SessionInvalidHandler | null = null;
let isHandlingSessionInvalid = false;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
});

export function clearStoredAuth() {
  localStorage.removeItem("auth:token");
  localStorage.removeItem("auth:user");
  delete api.defaults.headers.common.Authorization;
}

export function registerSessionInvalidHandler(
  handler: SessionInvalidHandler | null
) {
  sessionInvalidHandler = handler;
}

export function resetSessionInvalidState() {
  isHandlingSessionInvalid = false;
}

function hasActiveSession(error: AxiosError) {
  const requestAuthorization = error.config?.headers?.Authorization;
  const defaultAuthorization = api.defaults.headers.common.Authorization;

  return Boolean(
    localStorage.getItem("auth:token") ||
      requestAuthorization ||
      defaultAuthorization
  );
}

function isLoginRequest(error: AxiosError) {
  return error.config?.url?.includes("/auth/login");
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !isLoginRequest(error) &&
      hasActiveSession(error)
    ) {
      clearStoredAuth();

      if (!isHandlingSessionInvalid) {
        isHandlingSessionInvalid = true;
        sessionInvalidHandler?.(SESSION_EXPIRED_MESSAGE);
      }
    }

    return Promise.reject(error);
  }
);
