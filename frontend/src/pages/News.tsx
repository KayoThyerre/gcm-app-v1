import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { api } from "../services/api";

type UploadNewsResponse = {
  url: string;
};

type NewsItem = {
  id: string;
  title: string;
  published: boolean;
  createdAt: string;
};

type NewsListResponse = {
  data: NewsItem[];
};

export function News() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    async function loadNews() {
      try {
        setErrorMessage(null);
        const response = await api.get<NewsListResponse>("/news?page=1&limit=50");
        setNewsList(response.data.data);
      } catch {
        setErrorMessage("Nao foi possivel carregar as noticias.");
      } finally {
        setLoadingList(false);
      }
    }

    void loadNews();
  }, []);

  const filteredNews = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return newsList;
    }

    return newsList.filter((news) =>
      news.title.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [newsList, searchTerm]);

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

      const response = await api.post<NewsItem>("/news", {
        title,
        content,
        imageUrl,
        published,
      });

      setNewsList((currentNewsList) => [response.data, ...currentNewsList]);
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

  async function handleDelete(newsId: string) {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.delete(`/news/${newsId}`);
      setNewsList((currentNewsList) =>
        currentNewsList.filter((news) => news.id !== newsId)
      );
      setSuccessMessage("Noticia excluida com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel excluir a noticia.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <div className="space-y-6">
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
                className="mb-[10px] w-full max-w-[200px] max-h-[200px] h-auto object-cover rounded-[8px] border border-white/10 p-1 bg-white/[0.02]"
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

      <section className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Noticias
          </h2>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar noticia por titulo..."
            className="w-full border rounded px-4 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {loadingList ? (
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        ) : null}

        {!loadingList && filteredNews.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">
            Nenhuma noticia encontrada.
          </p>
        ) : null}

        {!loadingList && filteredNews.length > 0 ? (
          <div className="w-full border rounded overflow-x-auto">
            <table className="w-full text-slate-900 dark:text-slate-100">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr className="text-slate-700 dark:text-slate-200">
                  <th className="text-left px-4 py-3">Titulo</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((news) => (
                  <tr
                    key={news.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3">{news.title}</td>
                    <td className="px-4 py-3">
                      {news.published ? "Publicado" : "Rascunho"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(news.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(news.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer transition hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
