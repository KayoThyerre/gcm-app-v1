import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import {
  badgeStyles,
  buttonStyles,
  checkboxStyles,
  fieldStyles,
  tableContainerStyles,
  tableHeadStyles,
} from "../styles/ui";

type UploadNewsResponse = {
  url: string;
};

type NewsItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
};

type NewsListResponse = {
  data: NewsItem[];
  total: number;
};

const LIMIT = 5;

export function News() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(imageUrl || null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile, imageUrl]);

  async function loadNews(currentPage: number) {
    try {
      setLoadingList(true);
      setErrorMessage(null);
      const response = await api.get<NewsListResponse>(
        `/news/admin?page=${currentPage}&limit=${LIMIT}`
      );
      setNewsList(response.data.data);
      setTotal(response.data.total);
    } catch {
      setErrorMessage("Nao foi possivel carregar as noticias.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void loadNews(page);
  }, [page]);

  const filteredNews = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return newsList;
    }

    return newsList.filter((news) =>
      news.title.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [newsList, searchTerm]);

  function resetForm() {
    setTitle("");
    setContent("");
    setImageFile(null);
    setImageUrl("");
    setImagePreview(null);
    setPublished(false);
    setMode("create");
    setSelectedNews(null);
    setIsDirty(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleStartEdit(news: NewsItem) {
    if (mode === "edit" && isDirty && selectedNews?.id !== news.id) {
      const shouldChange = window.confirm("Deseja sair sem salvar?");

      if (!shouldChange) {
        return;
      }
    }

    setMode("edit");
    setSelectedNews(news);
    setTitle(news.title);
    setContent(news.content);
    setImageFile(null);
    setImageUrl(news.imageUrl ?? "");
    setImagePreview(news.imageUrl ?? null);
    setPublished(news.published);
    setIsDirty(false);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCancelEdit() {
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

    if (!title.trim() || !content.trim()) {
      setErrorMessage("Titulo e conteudo sao obrigatorios.");
      return;
    }

    try {
      setLoading(true);

      let nextImageUrl = imageUrl;

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

        nextImageUrl = uploadResponse.data.url;
      }

      if (mode === "edit" && selectedNews) {
        const response = await api.put<NewsItem>(`/news/${selectedNews.id}`, {
          title,
          content,
          imageUrl: nextImageUrl,
          published,
        });

        setNewsList((currentNewsList) =>
          currentNewsList.map((news) =>
            news.id === selectedNews.id ? response.data : news
          )
        );
        resetForm();
        setSuccessMessage("Noticia atualizada com sucesso.");
        return;
      }

      await api.post("/news", {
        title,
        content,
        imageUrl: nextImageUrl || undefined,
        published,
      });

      await loadNews(page);
      resetForm();
      setSuccessMessage("Noticia criada com sucesso.");
    } catch {
      setErrorMessage(
        mode === "edit"
          ? "Nao foi possivel atualizar a noticia."
          : "Nao foi possivel criar a noticia."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(newsId: string) {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.delete(`/news/${newsId}`);

      if (selectedNews?.id === newsId) {
        resetForm();
      }

      await loadNews(page);
      setSuccessMessage("Noticia excluida com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel excluir a noticia.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-10 sm:p-8">
      <div className="space-y-6">
        <PageHeader
          title={mode === "edit" ? "Editando noticia" : "Criar noticia"}
          description={
            mode === "edit"
              ? "Atualize os dados da noticia selecionada."
              : "Cadastre uma nova noticia para a area publica."
          }
        />

        {errorMessage ? (
          <FeedbackMessage variant="error">{errorMessage}</FeedbackMessage>
        ) : null}

        {successMessage ? (
          <FeedbackMessage variant="success">{successMessage}</FeedbackMessage>
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
              maxLength={180}
              onChange={(event) => {
                setTitle(event.target.value);
                setIsDirty(true);
                if (successMessage) setSuccessMessage(null);
              }}
              className={fieldStyles}
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
              maxLength={10000}
              onChange={(event) => {
                setContent(event.target.value);
                setIsDirty(true);
                if (successMessage) setSuccessMessage(null);
              }}
              rows={8}
              className={fieldStyles}
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
            {imageUrl ? (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mb-3 text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
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
              className={fieldStyles}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => {
                setPublished(event.target.checked);
                setIsDirty(true);
                if (successMessage) setSuccessMessage(null);
              }}
              className={checkboxStyles}
            />
            Publicar noticia
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className={buttonStyles.primary}
            >
              {loading
                ? mode === "edit"
                  ? "Salvando..."
                  : "Criando..."
                : mode === "edit"
                  ? "Salvar alteracoes"
                  : "Criar noticia"}
            </button>

            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={buttonStyles.secondary}
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
            Noticias
          </h2>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar noticia por titulo..."
            className={fieldStyles}
          />
        </div>

        {loadingList ? (
          <FeedbackMessage variant="loading">Carregando noticias...</FeedbackMessage>
        ) : null}

        {!loadingList && filteredNews.length === 0 ? (
          <FeedbackMessage variant="info">
            Nenhuma noticia encontrada.
          </FeedbackMessage>
        ) : null}

        {!loadingList && filteredNews.length > 0 ? (
          <div className="block space-y-3 sm:hidden">
            {filteredNews.map((news) => {
              const isSelected = mode === "edit" && selectedNews?.id === news.id;

              return (
                <article
                  key={news.id}
                  onClick={() => handleStartEdit(news)}
                  className={`cursor-pointer rounded-lg border p-4 shadow-sm transition duration-200 ${
                    isSelected
                      ? "border-blue-200 bg-blue-50 dark:border-slate-600 dark:bg-slate-700"
                      : "border-slate-200 bg-white hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {news.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(news.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span
                        className={news.published ? badgeStyles.published : badgeStyles.draft}
                      >
                        {news.published ? "Publicado" : "Rascunho"}
                      </span>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(news.id);
                        }}
                        className={buttonStyles.destructive}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {!loadingList && filteredNews.length > 0 ? (
          <div className={tableContainerStyles}>
            <table className="w-full text-slate-900 dark:text-slate-100">
              <thead className={tableHeadStyles}>
                <tr>
                  <th className="text-left px-4 py-3">Titulo</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((news) => {
                  const isSelected = mode === "edit" && selectedNews?.id === news.id;

                  return (
                    <tr
                      key={news.id}
                      onClick={() => handleStartEdit(news)}
                      className={`cursor-pointer transition duration-200 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-slate-700"
                          : "hover:bg-blue-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <td className="px-4 py-3">{news.title}</td>
                      <td className="px-4 py-3">
                        <span className={news.published ? badgeStyles.published : badgeStyles.draft}>
                          {news.published ? "Publicado" : "Rascunho"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(news.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(news.id);
                          }}
                          className={buttonStyles.destructive}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p>Pagina {page}</p>
            <p>Total de {total} registros</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1 || loadingList}
              onClick={() => setPage((currentPage) => currentPage - 1)}
              className={buttonStyles.secondary}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page * LIMIT >= total || loadingList}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className={buttonStyles.secondary}
            >
              Proximo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
