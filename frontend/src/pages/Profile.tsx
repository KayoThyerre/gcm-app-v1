import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, type Theme } from "../hooks/useTheme";
import { api } from "../services/api";

type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type UploadAvatarResponse = {
  avatarUrl: string;
};

export function Profile() {
  const { setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setErrorMessage(null);
        const response = await api.get<ProfileResponse>("/profile");
        setName(response.data.name);
        setEmail(response.data.email);
        setPhone(response.data.phone ?? "");
        setAvatarUrl(response.data.avatarUrl ?? "");
      } catch {
        setErrorMessage("Nao foi possivel carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const avatarInitial = useMemo(() => {
    const value = name.trim();
    if (!value) {
      return "?";
    }

    return value.charAt(0).toUpperCase();
  }, [name]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Formato invalido. Use JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Arquivo muito grande. Tamanho maximo de 2MB.");
      event.target.value = "";
      return;
    }

    const previousAvatarUrl = avatarUrl;
    const previewUrl = URL.createObjectURL(file);

    try {
      setUploadingAvatar(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setAvatarUrl(previewUrl);

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post<UploadAvatarResponse>(
        "/upload/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAvatarUrl(response.data.avatarUrl);
      setUser({ avatarUrl: response.data.avatarUrl });
      setSuccessMessage("Foto atualizada com sucesso");
    } catch {
      setAvatarUrl(previousAvatarUrl);
      setErrorMessage("Nao foi possivel enviar a foto.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await api.patch<ProfileResponse>("/profile", {
        name,
        phone,
        avatarUrl,
      });

      setUser({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        avatarUrl: response.data.avatarUrl,
        createdAt: response.data.createdAt,
      });
      setSuccessMessage("Perfil atualizado com sucesso");
    } catch {
      setErrorMessage("Nao foi possivel atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <p className="text-slate-600 dark:text-slate-400">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar do usuario"
            className="w-20 h-20 rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-2xl font-semibold">
            {avatarInitial}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Perfil
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dados do usuario logado
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer font-medium disabled:opacity-60"
          >
            {uploadingAvatar ? "Enviando..." : "Alterar foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      {successMessage ? (
        <p className="text-sm text-green-600">{successMessage}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (successMessage) setSuccessMessage(null);
            }}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Telefone
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (successMessage) setSuccessMessage(null);
            }}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Seguranca da conta
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Para alterar sua senha, acesse a pagina de seguranca.
        </p>
        <button
          type="button"
          onClick={() => navigate("/settings/security")}
          className="mt-6 text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
        >
          Alterar senha
        </button>
      </div>

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
