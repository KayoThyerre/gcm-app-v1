import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { AuthCard } from "../components/auth/AuthCard";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { PublicLayout } from "../layouts/PublicLayout";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex w-fit items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar para a home
            </button>

            <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <FeedbackMessage variant="error" className="mb-1">
                  {errorMessage}
                </FeedbackMessage>
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

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  maxLength={128}
                  onChange={(e) => {
                    if (errorMessage) setErrorMessage(null);
                    setPassword(e.target.value);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

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
