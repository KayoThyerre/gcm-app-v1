import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

type UploadApproachResponse = {
  url: string;
};

type Approach = {
  id: string;
  name: string;
  cpf: string | null;
  rg: string | null;
  birthDate: string | null;
  motherName: string | null;
  notes: string | null;
  isConvicted: boolean;
  photoUrl: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatBirthDate(date: string | null) {
  if (!date) {
    return "";
  }

  return date.slice(0, 10);
}

export function Approaches() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  const canCreate =
    user?.role === "USER" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "ADMIN" ||
    user?.role === "DEV";
  const canEdit =
    user?.role === "SUPERVISOR" ||
    user?.role === "ADMIN" ||
    user?.role === "DEV";
  const canDelete = user?.role === "ADMIN" || user?.role === "DEV";

  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [motherName, setMotherName] = useState("");
  const [notes, setNotes] = useState("");
  const [isConvicted, setIsConvicted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const previewUrl = URL.createObjectURL(imageFile);
      setImagePreview(previewUrl);

      return () => {
        URL.revokeObjectURL(previewUrl);
      };
    }

    if (!selectedApproach?.id || !imageUrl) {
      setImagePreview(null);
      return;
    }

    let isCurrent = true;
    let protectedPreviewUrl: string | null = null;

    void api
      .get<Blob>(`/approaches/${selectedApproach.id}/image`, {
        responseType: "blob",
      })
      .then((response) => {
        const nextPreviewUrl = URL.createObjectURL(response.data);

        if (!isCurrent) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        protectedPreviewUrl = nextPreviewUrl;
        setImagePreview(nextPreviewUrl);
      })
      .catch(() => {
        if (isCurrent) {
          setImagePreview(null);
        }
      });

    return () => {
      isCurrent = false;

      if (protectedPreviewUrl) {
        URL.revokeObjectURL(protectedPreviewUrl);
      }
    };
  }, [imageFile, imageUrl, selectedApproach?.id]);

  useEffect(() => {
    async function loadApproaches() {
      try {
        setErrorMessage(null);
        const response = await api.get<Approach[]>("/approaches");
        setApproaches(response.data);
      } catch {
        setErrorMessage("Nao foi possivel carregar as abordagens.");
      } finally {
        setLoading(false);
      }
    }

    void loadApproaches();
  }, []);

  const filteredApproaches = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return approaches;
    }

    return approaches.filter((approach) => {
      const normalizedName = approach.name.toLowerCase();
      const normalizedCpf = (approach.cpf ?? "").toLowerCase();

      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedCpf.includes(normalizedSearchTerm)
      );
    });
  }, [approaches, searchTerm]);

  function resetForm() {
    setName("");
    setCpf("");
    setRg("");
    setBirthDate("");
    setMotherName("");
    setNotes("");
    setIsConvicted(false);
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setMode("create");
    setSelectedApproach(null);
    setIsDirty(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleStartEdit(approach: Approach) {
    if (!canEdit) {
      return;
    }

    if (mode === "edit" && isDirty && selectedApproach?.id !== approach.id) {
      const shouldChange = window.confirm("Deseja sair sem salvar?");

      if (!shouldChange) {
        return;
      }
    }

    setMode("edit");
    setSelectedApproach(approach);
    setName(approach.name);
    setCpf(approach.cpf ?? "");
    setRg(approach.rg ?? "");
    setBirthDate(formatBirthDate(approach.birthDate));
    setMotherName(approach.motherName ?? "");
    setNotes(approach.notes ?? "");
    setIsConvicted(approach.isConvicted);
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(approach.photoUrl ?? "");
    setIsDirty(false);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCancel() {
    if (isDirty) {
      const shouldLeave = window.confirm("Deseja sair sem salvar?");

      if (!shouldLeave) {
        return;
      }
    }

    resetForm();
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null);
    setIsDirty(true);
    if (successMessage) setSuccessMessage(null);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setIsDirty(true);
    if (successMessage) setSuccessMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === "edit" && !canEdit) {
      setErrorMessage("Voce nao tem permissao para editar abordagens.");
      return;
    }

    if (mode === "create" && !canCreate) {
      setErrorMessage("Voce nao tem permissao para criar abordagens.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Nome e obrigatorio.");
      return;
    }

    try {
      setSubmitting(true);

      let nextImageUrl = imageUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResponse = await api.post<UploadApproachResponse>(
          "/upload/approach",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        nextImageUrl = uploadResponse.data.url;
      }

      const payload = {
        name,
        cpf,
        rg,
        birthDate,
        motherName,
        notes,
        isConvicted,
        photoUrl: nextImageUrl,
      };

      if (mode === "edit" && selectedApproach) {
        const response = await api.put<Approach>(
          "/approaches/" + selectedApproach.id,
          payload
        );

        setApproaches((currentApproaches) =>
          currentApproaches.map((approach) =>
            approach.id === selectedApproach.id ? response.data : approach
          )
        );
        resetForm();
        setSuccessMessage("Abordagem atualizada com sucesso.");
        return;
      }

      const response = await api.post<Approach>("/approaches", payload);

      setApproaches((currentApproaches) => [response.data, ...currentApproaches]);
      resetForm();
      setSuccessMessage("Abordagem criada com sucesso.");
    } catch {
      setErrorMessage(
        mode === "edit"
          ? "Nao foi possivel atualizar a abordagem."
          : "Nao foi possivel criar a abordagem."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(approachId: string) {
    if (!canDelete) {
      setErrorMessage("Voce nao tem permissao para excluir abordagens.");
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.delete("/approaches/" + approachId);
      setApproaches((currentApproaches) =>
        currentApproaches.filter((approach) => approach.id !== approachId)
      );

      if (selectedApproach?.id === approachId) {
        resetForm();
      }

      setSuccessMessage("Abordagem excluida com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel excluir a abordagem.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-10 sm:p-8">
      <div className="space-y-6">
        <div>
          <h1
            className={
              "text-2xl font-semibold " +
              (mode === "edit"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-900 dark:text-slate-100")
            }
          >
            {mode === "edit" ? "Editando abordagem" : "Cadastrar abordagem"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {mode === "edit"
              ? "Atualize os dados da abordagem selecionada."
              : "Cadastre uma nova pessoa abordada."}
          </p>
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="text-sm text-green-600">{successMessage}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setIsDirty(true);
                  if (successMessage) setSuccessMessage(null);
                }}
                className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cpf"
                className="text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(event) => {
                  setCpf(event.target.value);
                  setIsDirty(true);
                  if (successMessage) setSuccessMessage(null);
                }}
                className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="rg"
                className="text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                RG
              </label>
              <input
                id="rg"
                type="text"
                value={rg}
                onChange={(event) => {
                  setRg(event.target.value);
                  setIsDirty(true);
                  if (successMessage) setSuccessMessage(null);
                }}
                className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="birthDate"
                className="text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                Data de nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(event) => {
                  setBirthDate(event.target.value);
                  setIsDirty(true);
                  if (successMessage) setSuccessMessage(null);
                }}
                className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="motherName"
                className="text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                Nome da mae
              </label>
              <input
                id="motherName"
                type="text"
                value={motherName}
                onChange={(event) => {
                  setMotherName(event.target.value);
                  setIsDirty(true);
                  if (successMessage) setSuccessMessage(null);
                }}
                className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Observacoes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setIsDirty(true);
                if (successMessage) setSuccessMessage(null);
              }}
              rows={5}
              className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="image"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Imagem
            </label>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview da imagem da abordagem"
                className="mb-[10px] w-full max-w-[200px] max-h-[200px] h-auto object-cover rounded-[8px] border border-white/10 p-1 bg-white/[0.02]"
              />
            ) : null}
            {imageUrl ? (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mb-3 text-sm text-red-600 cursor-pointer transition hover:text-red-700"
              >
                Remover imagem
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              id="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
              className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            <input
              type="checkbox"
              checked={isConvicted}
              onChange={(event) => {
                setIsConvicted(event.target.checked);
                setIsDirty(true);
                if (successMessage) setSuccessMessage(null);
              }}
              className="h-4 w-4"
            />
            Apenado
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? mode === "edit"
                  ? "Salvando..."
                  : "Criando..."
                : mode === "edit"
                  ? "Salvar alteracoes"
                  : "Criar abordagem"}
            </button>

            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 cursor-pointer transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <section className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Abordagens
          </h2>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full border rounded px-4 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {loading ? <p className="text-slate-600 dark:text-slate-400">Carregando...</p> : null}

        {!loading && filteredApproaches.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">
            Nenhuma abordagem encontrada.
          </p>
        ) : null}

        {!loading && filteredApproaches.length > 0 ? (
          <div className="w-full border rounded overflow-x-auto">
            <table className="w-full text-slate-900 dark:text-slate-100">
              <thead className="bg-blue-600 text-white dark:bg-slate-900 dark:text-slate-200">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">CPF</th>
                  <th className="text-left px-4 py-3">Data cadastro</th>
                  <th className="text-left px-4 py-3">Apenado</th>
                  <th className="text-left px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredApproaches.map((approach) => {
                  const isSelected =
                    mode === "edit" && selectedApproach?.id === approach.id;

                  return (
                    <tr
                      key={approach.id}
                      onClick={() => handleStartEdit(approach)}
                      className={"transition duration-200 " +
                        (canEdit ? "cursor-pointer " : "cursor-default ") +
                        (isSelected
                          ? "bg-blue-50 dark:bg-slate-700"
                          : canEdit
                            ? "hover:bg-blue-50 dark:hover:bg-slate-700"
                            : "")}
                    >
                      <td className="px-4 py-3">{approach.name}</td>
                      <td className="px-4 py-3">{approach.cpf || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(approach.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        {approach.isConvicted ? "Sim" : "Nao"}
                      </td>
                      <td className="px-4 py-3">
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(approach.id);
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer transition hover:bg-red-600"
                          >
                            Excluir
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
