import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const exportAreaRef = useRef<HTMLDivElement | null>(null);

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

  async function handleExportPdf() {
    if (!selectedScaleMonth) {
      setExportErrorMessage("Nenhuma escala selecionada para exportacao.");
      return;
    }

    if (!exportAreaRef.current) {
      setExportErrorMessage("A area da escala ainda nao esta pronta para exportacao.");
      return;
    }

    try {
      setExportingPdf(true);
      setExportErrorMessage(null);

      const exportElement = exportAreaRef.current;
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

      const canvas = await html2canvas(exportElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
        windowWidth: Math.max(exportElement.scrollWidth, window.innerWidth),
        windowHeight: Math.max(exportElement.scrollHeight, window.innerHeight),
      });

      if (!canvas.width || !canvas.height) {
        throw new Error("Canvas de exportacao foi gerado sem dimensoes validas.");
      }

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      let remainingHeight = imageHeight;
      let positionY = 0;

      pdf.addImage(imageData, "PNG", 0, positionY, imageWidth, imageHeight, undefined, "FAST");
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        positionY = remainingHeight - imageHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, positionY, imageWidth, imageHeight, undefined, "FAST");
        remainingHeight -= pageHeight;
      }

      const formattedMonth = String(selectedScaleMonth.month).padStart(2, "0");
      pdf.save(`escala-${formattedMonth}-${selectedScaleMonth.year}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF da escala:", error);
      setExportErrorMessage("Nao foi possivel exportar o PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
          onClick={() => void handleExportPdf()}
          disabled={!selectedScaleMonth || loadingScaleData || exportingPdf}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exportingPdf ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {exportErrorMessage ? <p className="text-sm text-red-600">{exportErrorMessage}</p> : null}

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
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
        <div ref={exportAreaRef} className="rounded-xl bg-white">
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
  );
}
