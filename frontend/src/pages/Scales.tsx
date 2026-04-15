import { useEffect, useMemo, useState } from "react";
import { ScaleCalendarView } from "../components/scales/ScaleCalendarView";
import { api } from "../services/api";

type ScaleMonth = {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorLike = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const monthOptions = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

function getApiMessage(error: unknown, fallback: string) {
  const maybeError = error as ApiErrorLike;
  return maybeError.response?.data?.message || fallback;
}

export function Scales() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scaleMonths, setScaleMonths] = useState<ScaleMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedScaleMonth = useMemo(() => {
    return scaleMonths.find(
      (scaleMonth) => scaleMonth.month === month && scaleMonth.year === year
    );
  }, [month, scaleMonths, year]);

  async function loadScaleMonths() {
    const response = await api.get<ScaleMonth[]>("/scales/months");
    setScaleMonths(response.data);
    return response.data;
  }

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const scaleMonthsData = await loadScaleMonths();

        if (scaleMonthsData.length > 0) {
          setMonth(scaleMonthsData[0].month);
          setYear(scaleMonthsData[0].year);
        }
      } catch {
        setErrorMessage("Nao foi possivel carregar as escalas.");
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, []);

  async function handleGenerateScale() {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await api.post<ScaleMonth>("/scales/months", {
        month,
        year,
      });

      setScaleMonths((currentScaleMonths) => [response.data, ...currentScaleMonths]);
      setSuccessMessage("Escala gerada com sucesso.");
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Nao foi possivel gerar a escala."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteScaleMonth() {
    if (!selectedScaleMonth) {
      return;
    }

    const shouldDelete = window.confirm("Deseja excluir esta escala?");

    if (!shouldDelete) {
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.delete(`/scales/months/${selectedScaleMonth.id}`);

      setScaleMonths((currentScaleMonths) =>
        currentScaleMonths.filter((scaleMonth) => scaleMonth.id !== selectedScaleMonth.id)
      );
      setSuccessMessage("Escala excluida com sucesso.");
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Nao foi possivel excluir a escala."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Escalas mensais
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Base limpa para reconstrucao da escala pelo modelo Excel.
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div className="space-y-1">
          <label
            htmlFor="scale-month"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Mes
          </label>
          <select
            id="scale-month"
            value={month}
            onChange={(event) => {
              setMonth(Number(event.target.value));
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="scale-year"
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Ano
          </label>
          <input
            id="scale-year"
            type="number"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleGenerateScale()}
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Gerando..." : "Gerar escala"}
        </button>

        <button
          type="button"
          onClick={() => void handleDeleteScaleMonth()}
          disabled={!selectedScaleMonth || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-white cursor-pointer transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {deleting ? "Excluindo..." : "Excluir escala"}
        </button>
      </section>

      {loading ? <p className="text-slate-600 dark:text-slate-400">Carregando...</p> : null}

      {!loading ? (
        <>
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-600 dark:text-slate-300">
              Calendário ainda não implementado
            </p>
          </section>

          <ScaleCalendarView />
        </>
      ) : null}
    </div>
  );
}
