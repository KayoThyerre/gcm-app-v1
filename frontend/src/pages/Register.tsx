import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { AuthCard } from "../components/auth/AuthCard";
import { useTheme } from "../hooks/useTheme";
import { PublicLayout } from "../layouts/PublicLayout";
import { api } from "../services/api";

export function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Todos os campos sao obrigatorios.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no minimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas nao conferem.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/check-email");
    } catch (error) {
      let message = "Nao foi possivel concluir o cadastro.";

      if (isAxiosError<{ error?: string }>(error)) {
        const apiErrorMessage = error.response?.data?.error;
        if (typeof apiErrorMessage === "string" && apiErrorMessage.trim()) {
          message = apiErrorMessage;
        }
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center md:justify-end md:pr-24 lg:pr-32 bg-cover bg-center bg-no-repeat bg-[url('/register-hero.png')] dark:bg-[url('/register-hero-dark.png')] relative">
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
            <h1 className="text-2xl font-semibold text-slate-900">Criar conta</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
                  {errorMessage}
                </div>
              )}

              <Input
                type="text"
                placeholder="Nome"
                value={name}
                maxLength={100}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setName(e.target.value);
                }}
              />

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

              <Input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                maxLength={128}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setConfirmPassword(e.target.value);
                }}
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-blue-600 hover:text-blue-700 transition"
              >
                Ja possui conta? Entrar
              </button>
            </form>
          </AuthCard>
        </div>
      </div>
    </PublicLayout>
  );
}
