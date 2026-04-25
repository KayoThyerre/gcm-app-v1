import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, type Theme } from "../hooks/useTheme";
import { api } from "../services/api";

export function ProfileSecurity() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMessage("Todos os campos sao obrigatorios.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("A nova senha deve ter no minimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("A confirmacao da nova senha deve ser igual a nova senha.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/profile/change-password", {
        currentPassword,
        newPassword,
      });

      setSuccessMessage("Senha atualizada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setErrorMessage("Nao foi possivel alterar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-8 space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/settings/profile")}
          className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium mb-4"
        >
          ← Voltar ao perfil
        </button>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Seguranca da conta
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Atualize sua senha de acesso.
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="text-sm text-green-600">{successMessage}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="currentPassword"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Senha atual
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            maxLength={128}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="newPassword"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Nova senha
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            maxLength={128}
            onChange={(event) => setNewPassword(event.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirmNewPassword"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            maxLength={128}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Alterando..." : "Salvar"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Theme
        </h2>
        <div className="flex flex-wrap gap-2">
          {(["light", "dark"] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`px-3 py-1 rounded-md border border-transparent text-sm cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-700/40 ${
                theme === option
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {option === "light" ? "☀ Light" : "🌙 Dark"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
