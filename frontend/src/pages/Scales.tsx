import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type ScaleMonthSummary = {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

type ScaleAssignment = {
  id: string;
  name: string;
  roleInShift: string;
  startTime: string;
  endTime: string;
};

type ScaleDay = {
  id: string;
  date: string;
  shiftType: "DAY" | "NIGHT";
  notes: string | null;
  assignments: ScaleAssignment[];
};

type ScaleMonthDetail = {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  days: ScaleDay[];
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

const cycleValues = ["2/3", "4", "1", "F"];
const scaleRows = [
  { label: "Equipe A", offset: 0 },
  { label: "Equipe B", offset: 1 },
  { label: "Equipe C", offset: 2 },
  { label: "Equipe D", offset: 3 },
  { label: "Radio Operadores", offset: 0 },
];

function getCycleValue(dayIndex: number, offset: number) {
  return cycleValues[(dayIndex + offset) % cycleValues.length];
}

function getDayNumbers(days: ScaleDay[]) {
  const uniqueDates = Array.from(new Set(days.map((day) => day.date.slice(0, 10))));

  return uniqueDates.map((date) => {
    const parsedDate = new Date(date + "T00:00:00");

    return {
      key: date,
      day: parsedDate.getDate(),
    };
  });
}

export function Scales() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scaleMonths, setScaleMonths] = useState<ScaleMonthSummary[]>([]);
  const [scaleMonth, setScaleMonth] = useState<ScaleMonthDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadScaleMonthById(scaleMonthId: string) {
    const response = await api.get<ScaleMonthDetail>(`/scales/months/${scaleMonthId}`);
    setScaleMonth(response.data);
    setMonth(response.data.month);
    setYear(response.data.year);
  }

  async function loadScaleMonths() {
    const response = await api.get<ScaleMonthSummary[]>("/scales/months");
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
          await loadScaleMonthById(scaleMonthsData[0].id);
          return;
        }

        setScaleMonth(null);
      } catch {
        setErrorMessage("Nao foi possivel carregar as escalas.");
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, []);

  useEffect(() => {
    if (scaleMonths.length === 0) {
      setScaleMonth(null);
      return;
    }

    const selectedScaleMonth = scaleMonths.find(
      (item) => item.month === month && item.year === year
    );

    if (!selectedScaleMonth) {
      setScaleMonth(null);
      return;
    }

    const selectedScaleMonthId = selectedScaleMonth.id;

    if (scaleMonth?.id === selectedScaleMonthId) {
      return;
    }

    let active = true;

    async function loadSelectedScaleMonth() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await api.get<ScaleMonthDetail>(
          `/scales/months/${selectedScaleMonthId}`
        );

        if (!active) {
          return;
        }

        setScaleMonth(response.data);
      } catch {
        if (!active) {
          return;
        }

        setErrorMessage("Nao foi possivel carregar a escala selecionada.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSelectedScaleMonth();

    return () => {
      active = false;
    };
  }, [month, year, scaleMonth?.id, scaleMonths]);

  const visibleDays = useMemo(() => {
    if (!scaleMonth) {
      return [];
    }

    return getDayNumbers(scaleMonth.days);
  }, [scaleMonth]);

  async function handleGenerateScale() {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await api.post<ScaleMonthDetail>("/scales/months", {
        month,
        year,
      });

      setScaleMonth(response.data);
      setSuccessMessage("Escala gerada com sucesso.");

      const scaleMonthsData = await loadScaleMonths();
      const createdScaleMonth = scaleMonthsData.find(
        (item) => item.id === response.data.id
      );

      if (createdScaleMonth) {
        setMonth(createdScaleMonth.month);
        setYear(createdScaleMonth.year);
      }
    } catch (error) {
      const apiMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response &&
        typeof error.response.message === "string"
          ? error.response.message
          : null;

      setErrorMessage(apiMessage || "Nao foi possivel gerar a escala.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Escalas mensais
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Visualize e gere a base de escalas mensais para validacao inicial.
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
      </section>

      {loading ? <p className="text-slate-600 dark:text-slate-400">Carregando...</p> : null}

      {!loading && !scaleMonth ? (
        <p className="text-slate-600 dark:text-slate-400">
          Nenhuma escala encontrada para o mes e ano selecionados.
        </p>
      ) : null}

      {!loading && scaleMonth ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {monthOptions.find((option) => option.value === scaleMonth.month)?.label} de {scaleMonth.year}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Grade inicial de visualizacao da escala mensal.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full border-separate border-spacing-0 text-sm text-slate-900 dark:text-slate-100">
              <thead className="bg-blue-600 text-white dark:bg-slate-900 dark:text-slate-200">
                <tr>
                  <th className="sticky left-0 bg-blue-600 px-4 py-3 text-left dark:bg-slate-900">
                    Dias
                  </th>
                  {visibleDays.map((day) => (
                    <th key={day.key} className="px-3 py-3 text-center min-w-[56px]">
                      {day.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scaleRows.map((row) => (
                  <tr
                    key={row.label}
                    className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-900/70"
                  >
                    <td className="sticky left-0 border-t border-slate-200 bg-inherit px-4 py-3 font-medium dark:border-slate-700">
                      {row.label}
                    </td>
                    {visibleDays.map((day, index) => (
                      <td
                        key={`${row.label}-${day.key}`}
                        className="border-t border-slate-200 px-3 py-3 text-center dark:border-slate-700"
                      >
                        {getCycleValue(index, row.offset)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-slate-100">Legenda</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <p>1 = 00h-06h</p>
              <p>2 = 06h-12h</p>
              <p>3 = 12h-18h</p>
              <p>4 = 18h-00h</p>
              <p>F = Folga</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
