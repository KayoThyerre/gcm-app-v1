import { useEffect, useMemo, useState } from "react";
import {
  ScaleCalendarView,
  type ScaleCellOverride,
  type ScaleTeamConfig,
} from "../components/scales/ScaleCalendarView";
import { ScalePrintView } from "../components/scales/ScalePrintView";
import { api } from "../services/api";

type ScaleMonth = {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

type ScaleMonthListResponse = {
  data: ScaleMonth[];
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

export function ScaleView() {
  const [scaleMonths, setScaleMonths] = useState<ScaleMonth[]>([]);
  const [selectedScaleMonthId, setSelectedScaleMonthId] = useState("");
  const [teamConfigs, setTeamConfigs] = useState<ScaleTeamConfig[]>([]);
  const [cellOverrides, setCellOverrides] = useState<ScaleCellOverride[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingScaleData, setLoadingScaleData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedScaleMonth = useMemo(() => {
    return scaleMonths.find((scaleMonth) => scaleMonth.id === selectedScaleMonthId) || null;
  }, [scaleMonths, selectedScaleMonthId]);

  const selectedLabel = useMemo(() => {
    if (!selectedScaleMonth) {
      return null;
    }

    const monthLabel =
      monthOptions.find((option) => option.value === selectedScaleMonth.month)?.label ||
      selectedScaleMonth.month;

    return `${monthLabel} / ${selectedScaleMonth.year}`;
  }, [selectedScaleMonth]);

  useEffect(() => {
    async function loadScaleMonths() {
      try {
        setLoadingMonths(true);
        setErrorMessage(null);
        const response = await api.get<ScaleMonthListResponse>("/scales/months");
        setScaleMonths(response.data.data);

        if (response.data.data.length > 0) {
          setSelectedScaleMonthId(response.data.data[0].id);
        }
      } catch (error) {
        setErrorMessage(getApiMessage(error, "Nao foi possivel carregar os meses de escala."));
      } finally {
        setLoadingMonths(false);
      }
    }

    void loadScaleMonths();
  }, []);

  useEffect(() => {
    if (!selectedScaleMonthId) {
      setTeamConfigs([]);
      setCellOverrides([]);
      setLoadingScaleData(false);
      return;
    }

    let active = true;

    async function loadScaleData() {
      try {
        setLoadingScaleData(true);
        setErrorMessage(null);

        const [teamConfigsResponse, overridesResponse] = await Promise.all([
          api.get<ScaleTeamConfig[]>(`/scales/${selectedScaleMonthId}/teams`),
          api.get<ScaleCellOverride[]>(`/scales/${selectedScaleMonthId}/overrides`),
        ]);

        if (!active) {
          return;
        }

        setTeamConfigs(teamConfigsResponse.data);
        setCellOverrides(overridesResponse.data);
      } catch (error) {
        if (!active) {
          return;
        }

        setTeamConfigs([]);
        setCellOverrides([]);
        setErrorMessage(
          getApiMessage(error, "Nao foi possivel carregar os dados da escala selecionada.")
        );
      } finally {
        if (active) {
          setLoadingScaleData(false);
        }
      }
    }

    void loadScaleData();

    return () => {
      active = false;
    };
  }, [selectedScaleMonthId]);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <style>
        {`
          [data-print-root] {
            display: none;
          }

          @media print {
            @page {
              size: A4 landscape;
              margin: 4mm;
            }

            html,
            body {
              background: #ffffff !important;
              color: #111827 !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            body * {
              visibility: hidden;
            }

            [data-print-root],
            [data-print-root] * {
              visibility: visible;
            }

            [data-print-root] {
              display: block !important;
              position: absolute;
              inset: 0;
              width: 100%;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              overflow: visible !important;
            }

            [data-print-root] table,
            [data-print-root] tr,
            [data-print-root] thead,
            [data-print-root] tbody,
            [data-print-root] footer {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div data-screen-root className="max-w-7xl mx-auto p-4 space-y-8 sm:p-8">
      <div data-print-hide className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Escala Mensal de Servico
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Consulta de escalas em modo leitura, separada da administracao do modulo.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          disabled={!selectedScaleMonth || loadingScaleData}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <div data-print-hide className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Use a opcao Salvar como PDF no dialogo de impressao do navegador.
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <section data-print-hide className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr] md:items-end">
          <div className="space-y-1">
            <label
              htmlFor="scale-view-month"
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Mes cadastrado
            </label>
            <select
              id="scale-view-month"
              value={selectedScaleMonthId}
              onChange={(event) => setSelectedScaleMonthId(event.target.value)}
              disabled={loadingMonths || scaleMonths.length === 0}
              className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100"
            >
              {scaleMonths.length === 0 ? (
                <option value="">Nenhuma escala cadastrada</option>
              ) : (
                scaleMonths.map((scaleMonth) => {
                  const monthLabel =
                    monthOptions.find((option) => option.value === scaleMonth.month)?.label ||
                    scaleMonth.month;

                  return (
                    <option key={scaleMonth.id} value={scaleMonth.id}>
                      {monthLabel} / {scaleMonth.year}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {selectedLabel ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-slate-100">Escala selecionada:</span>{" "}
              {selectedLabel}
            </div>
          ) : null}
        </div>
      </section>

      {loadingMonths ? (
        <p className="text-slate-600 dark:text-slate-400">Carregando escalas...</p>
      ) : null}

      {!loadingMonths && scaleMonths.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <p className="text-slate-600 dark:text-slate-300">Nenhum mes de escala cadastrado.</p>
        </section>
      ) : null}

      {!loadingMonths && selectedScaleMonth ? (
        <div data-print-section data-print-card className="rounded-xl bg-white">
          <ScaleCalendarView
            teamConfigs={teamConfigs}
            month={selectedScaleMonth.month}
            year={selectedScaleMonth.year}
            loading={loadingScaleData}
            cellOverrides={cellOverrides}
            title="Escala Mensal de Servico"
            subtitle="Visualizacao em modo leitura para consulta interna das equipes, radios operadores e ferias."
            selectedLabel={selectedLabel}
            emptyTeamsMessage="Nenhuma equipe configurada para a escala selecionada."
          />
        </div>
      ) : null}
      </div>

      {!loadingMonths && selectedScaleMonth ? (
        <div data-print-root>
          <ScalePrintView
            teamConfigs={teamConfigs}
            month={selectedScaleMonth.month}
            year={selectedScaleMonth.year}
            cellOverrides={cellOverrides}
            selectedLabel={selectedLabel}
          />
        </div>
      ) : null}
    </>
  );
}
