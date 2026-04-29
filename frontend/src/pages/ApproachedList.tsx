import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

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

type ApproachListResponse = {
  data: Approach[];
};

const itemsPerPage = 5;

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("pt-BR");
}

export function ApproachedList() {
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadApproaches() {
      try {
        const response = await api.get<ApproachListResponse>("/approaches");
        setApproaches(response.data.data);
        setSelectedApproach(response.data.data[0] ?? null);
      } catch {
        setApproaches([]);
        setSelectedApproach(null);
      } finally {
        setLoading(false);
      }
    }

    void loadApproaches();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredApproaches = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return approaches;
    }

    return approaches.filter((approach) => {
      const normalizedName = approach.name.toLowerCase();
      const normalizedCpf = (approach.cpf ?? "").toLowerCase();
      const normalizedRg = (approach.rg ?? "").toLowerCase();

      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedCpf.includes(normalizedSearchTerm) ||
        normalizedRg.includes(normalizedSearchTerm)
      );
    });
  }, [approaches, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredApproaches.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedApproaches = useMemo(() => {
    return filteredApproaches.slice(startIndex, endIndex);
  }, [endIndex, filteredApproaches, startIndex]);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    if (paginatedApproaches.length === 0) {
      if (selectedApproach !== null) {
        setSelectedApproach(null);
      }
      return;
    }

    const hasSelectedInPage = paginatedApproaches.some(
      (approach) => approach.id === selectedApproach?.id
    );

    if (!hasSelectedInPage) {
      setSelectedApproach(paginatedApproaches[0]);
    }
  }, [paginatedApproaches, selectedApproach]);

  const visibleSelectedApproach =
    paginatedApproaches.find((approach) => approach.id === selectedApproach?.id) ?? null;

  useEffect(() => {
    if (!visibleSelectedApproach?.id || !visibleSelectedApproach.photoUrl) {
      setSelectedImageUrl(null);
      return;
    }

    let isCurrent = true;
    let protectedImageUrl: string | null = null;

    void api
      .get<Blob>(`/approaches/${visibleSelectedApproach.id}/image`, {
        responseType: "blob",
      })
      .then((response) => {
        const nextImageUrl = URL.createObjectURL(response.data);

        if (!isCurrent) {
          URL.revokeObjectURL(nextImageUrl);
          return;
        }

        protectedImageUrl = nextImageUrl;
        setSelectedImageUrl(nextImageUrl);
      })
      .catch(() => {
        if (isCurrent) {
          setSelectedImageUrl(null);
        }
      });

    return () => {
      isCurrent = false;

      if (protectedImageUrl) {
        URL.revokeObjectURL(protectedImageUrl);
      }
    };
  }, [visibleSelectedApproach?.id, visibleSelectedApproach?.photoUrl]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Abordados
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Consulte os dados cadastrados das pessoas abordadas.
        </p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="approach-search"
          className="text-sm font-medium text-slate-900 dark:text-slate-100"
        >
          Buscar abordado
        </label>
        <input
          id="approach-search"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por nome, CPF ou RG..."
          className="w-full rounded-md border px-4 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {loading ? <p className="text-slate-600 dark:text-slate-400">Carregando...</p> : null}

      {!loading && filteredApproaches.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          Nenhum abordado encontrado.
        </p>
      ) : null}

      {!loading && filteredApproaches.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Resultados
            </h2>

            <div className="space-y-3">
              {paginatedApproaches.map((approach) => {
                const isSelected = visibleSelectedApproach?.id === approach.id;

                return (
                  <button
                    key={approach.id}
                    type="button"
                    onClick={() => setSelectedApproach(approach)}
                    className={
                      "w-full rounded-xl border p-4 text-left transition cursor-pointer " +
                      (isSelected
                        ? "border-blue-300 bg-blue-50 dark:border-slate-600 dark:bg-slate-700"
                        : "border-slate-200 bg-white hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700")
                    }
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {approach.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          CPF: {approach.cpf || "-"}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          RG: {approach.rg || "-"}
                        </p>
                      </div>

                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <p>Cadastrado em {formatDate(approach.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>Pagina {safeCurrentPage}</p>
                <p>Total de {filteredApproaches.length} registros</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 cursor-pointer transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 cursor-pointer transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Proximo
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 sm:p-5">
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Ficha do abordado
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Visualizacao somente leitura.
                </p>
              </div>

              {visibleSelectedApproach ? (
                <div className="space-y-5">
                  {visibleSelectedApproach.photoUrl && selectedImageUrl ? (
                    <img
                      src={selectedImageUrl}
                      alt={visibleSelectedApproach.name}
                      className="w-full max-w-[220px] rounded-[8px] border border-white/10 p-1 bg-white/[0.02] object-cover"
                    />
                  ) : (
                    <div className="flex h-[220px] w-full max-w-[220px] items-center justify-center rounded-[8px] border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Sem foto
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Nome
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {visibleSelectedApproach.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        CPF
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {visibleSelectedApproach.cpf || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        RG
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {visibleSelectedApproach.rg || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Data de nascimento
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(visibleSelectedApproach.birthDate)}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Nome da mae
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {visibleSelectedApproach.motherName || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Apenado
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {visibleSelectedApproach.isConvicted ? "Sim" : "Nao"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Criado em
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatDateTime(visibleSelectedApproach.createdAt)}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Atualizado em
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatDateTime(visibleSelectedApproach.updatedAt)}
                      </p>
                    </div>

                    <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Observacoes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {visibleSelectedApproach.notes || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Selecione um abordado para visualizar os detalhes.
                </p>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
