import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { AuthCard } from "../components/auth/AuthCard";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { PublicLayout } from "../layouts/PublicLayout";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const message = location.state?.message;

    if (typeof message !== "string" || !message.trim()) {
      return;
    }

    setErrorMessage(message);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await login(email, password);
      navigate("/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao tentar fazer login."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  if (isAuthenticated && !authLoading) {
    return <Navigate to="/home" replace />;
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-[url('/login-hero.png')] dark:bg-[url('/login-hero-dark.png')] relative">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow transition hover:scale-105"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
        <div
          className={`transition-all duration-500 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <AuthCard>
            <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
                  {errorMessage}
                </div>
              )}

              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                maxLength={150}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setEmail(e.target.value);
                }}
              />

              <Input
                type="password"
                placeholder="Senha"
                value={password}
                maxLength={128}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setPassword(e.target.value);
                }}
              />

              <Button type="submit" disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm text-blue-600 hover:text-blue-700 transition"
              >
                Criar conta
              </button>
            </form>
          </AuthCard>
        </div>
      </div>
    </PublicLayout>
  );
}
