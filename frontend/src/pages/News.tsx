import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { api } from "../services/api";

type UploadNewsResponse = {
  url: string;
};

export function News() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null);
    if (successMessage) setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !content.trim()) {
      setErrorMessage("Titulo e conteudo sao obrigatorios.");
      return;
    }

    try {
      setLoading(true);

      let imageUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResponse = await api.post<UploadNewsResponse>(
          "/upload/news",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        imageUrl = uploadResponse.data.url;
      }

      await api.post("/news", {
        title,
        content,
        imageUrl,
        published,
      });

      setTitle("");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setPublished(false);
      setSuccessMessage("Noticia criada com sucesso.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setErrorMessage("Nao foi possivel criar a noticia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Criar noticia
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cadastre uma nova noticia para a area publica.
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      {successMessage ? (
        <p className="text-sm text-green-600">{successMessage}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="title"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Titulo
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (successMessage) setSuccessMessage(null);
            }}
            className="border rounded-md px-3 py-2 w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="content"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Conteudo
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (successMessage) setSuccessMessage(null);
            }}
            rows={8}
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
              alt="Preview da imagem da noticia"
              className="max-w-[300px] rounded-md border"
            />
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
            checked={published}
            onChange={(event) => {
              setPublished(event.target.checked);
              if (successMessage) setSuccessMessage(null);
            }}
            className="h-4 w-4"
          />
          Publicar noticia
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Criando..." : "Criar noticia"}
        </button>
      </form>
    </div>
  );
}
