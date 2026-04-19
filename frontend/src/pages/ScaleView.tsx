import { useEffect, useMemo, useState } from "react";
import {
  ScaleCalendarView,
  type ScaleCellOverride,
  type ScaleTeamConfig,
} from "../components/scales/ScaleCalendarView";
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
        const response = await api.get<ScaleMonth[]>("/scales/months");
        setScaleMonths(response.data);

        if (response.data.length > 0) {
          setSelectedScaleMonthId(response.data[0].id);
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
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm;
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

            [data-print-hide] {
              display: none !important;
            }

            [data-print-card] {
              border: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }

            [data-print-section] {
              break-inside: avoid-page;
              page-break-inside: avoid;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #111827 !important;
              width: 114% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              transform: scale(0.88);
              transform-origin: top left;
            }

            [data-print-section] table {
              width: 100% !important;
              min-width: 0 !important;
              border-collapse: collapse !important;
              font-size: 7px !important;
              line-height: 1.05 !important;
              table-layout: fixed !important;
            }

            [data-print-section] thead {
              display: table-header-group;
            }

            [data-scale-calendar-root="true"] {
              gap: 6px !important;
            }

            [data-scale-calendar-root="true"] > div:first-child {
              gap: 4px !important;
              margin-bottom: 2px !important;
            }

            [data-scale-calendar-root="true"] h2 {
              font-size: 14px !important;
              line-height: 1.1 !important;
            }

            [data-scale-calendar-root="true"] p,
            [data-scale-calendar-root="true"] span {
              font-size: 8px !important;
              line-height: 1.1 !important;
            }

            [data-scale-table-wrapper="true"] {
              overflow: visible !important;
              border-width: 1px !important;
              break-inside: avoid-page;
              page-break-inside: avoid;
            }

            [data-scale-table="true"] tr,
            [data-scale-table="true"] thead,
            [data-scale-table="true"] tbody {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            [data-print-section] tr,
            [data-print-section] td,
            [data-print-section] th,
            [data-print-section] div,
            [data-print-section] span,
            [data-print-section] button,
            [data-print-section] section {
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
              filter: none !important;
              backdrop-filter: none !important;
            }

            [data-print-section] td,
            [data-print-section] th {
              border-color: #cbd5e1 !important;
              color: #111827 !important;
              padding: 1px 2px !important;
              height: auto !important;
              min-height: 0 !important;
              vertical-align: middle !important;
            }

            [data-print-section] button {
              color: inherit !important;
              cursor: default !important;
              min-height: 0 !important;
              height: auto !important;
              padding: 1px 2px !important;
              line-height: 1 !important;
            }

            [data-print-section] .sticky {
              position: static !important;
            }

            [data-scale-table="true"] td > div,
            [data-scale-table="true"] td > span,
            [data-scale-table="true"] td > button,
            [data-scale-table="true"] th > div,
            [data-scale-table="true"] th > span {
              padding-top: 1px !important;
              padding-bottom: 1px !important;
            }

            [data-scale-table="true"] tr td[colspan] > div {
              padding: 2px 4px !important;
              gap: 4px !important;
            }

            [data-scale-table="true"] tr td[colspan] span:first-child {
              height: 10px !important;
              width: 3px !important;
            }

            [data-scale-vacation="true"] {
              break-inside: avoid-page;
              page-break-inside: avoid;
              padding: 6px 8px !important;
              margin-top: 4px !important;
            }

            [data-scale-vacation="true"] > div:first-child {
              gap: 2px !important;
            }

            [data-scale-vacation="true"] > div:last-child {
              margin-top: 6px !important;
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 4px !important;
            }

            [data-scale-vacation="true"] > div:last-child > div {
              padding: 4px 6px !important;
              font-size: 7px !important;
              line-height: 1.15 !important;
            }

            [data-scale-legend="true"] {
              display: flex !important;
              flex-wrap: nowrap !important;
              gap: 6px !important;
              padding: 6px 8px !important;
              margin-top: 4px !important;
              font-size: 7px !important;
              line-height: 1.1 !important;
              white-space: nowrap !important;
              break-inside: avoid-page;
              page-break-inside: avoid;
            }

            [data-scale-legend="true"] > span {
              display: inline !important;
              white-space: nowrap !important;
            }

            [data-scale-legend="true"] > span:not(:last-child)::after {
              content: " |";
            }
          }
        `}
      </style>

      <div data-print-root className="max-w-7xl mx-auto p-8 space-y-8">
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

      <section data-print-hide className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
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
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
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
    </>
  );
}
