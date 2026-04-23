import { useEffect, useMemo, useState } from "react";
import {
  ScaleCalendarView,
  getScaleCellLabel,
  type InitialCycle,
  type ScaleCellClickData,
  type ScaleCellOverride,
  type ScaleCellValue,
  type ScaleTeamConfig,
} from "../components/scales/ScaleCalendarView";
import { useAuth } from "../contexts/AuthContext";
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
    status?: number;
    data?: {
      message?: string;
    };
  };
};

type TeamName = "A" | "B" | "C" | "D";

type TeamForm = {
  supervisorName: string;
  radioOperatorName: string;
  members: string;
  initialCycle: InitialCycle;
};

type TeamForms = Record<TeamName, TeamForm>;

type TeamMessage = {
  type: "success" | "error";
  text: string;
};

type TeamMessages = Record<TeamName, TeamMessage | null>;

type OverrideModalState = {
  teamName: string;
  personKey: string;
  personName: string;
  day: number;
  value: ScaleCellValue;
  override: ScaleCellOverride | null;
};

type VacationPersonOption = {
  label: string;
  personKey: string;
  personName: string;
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

const teamNames: TeamName[] = ["A", "B", "C", "D"];
const initialCycleOptions: InitialCycle[] = ["DAY", "NIGHT_START", "NIGHT_END", "OFF"];
const overrideValueOptions: ScaleCellValue[] = [
  "DAY",
  "NIGHT_START",
  "NIGHT_END",
  "NIGHT_FULL",
  "OFF",
  "MEDICAL_LEAVE",
  "BANK_HOURS",
  "VACATION",
];

function createEmptyTeamForm(): TeamForm {
  return {
    supervisorName: "",
    radioOperatorName: "",
    members: "",
    initialCycle: "DAY",
  };
}

function createEmptyTeamMessages(): TeamMessages {
  return {
    A: null,
    B: null,
    C: null,
    D: null,
  };
}

function createEmptyTeamForms(): TeamForms {
  return {
    A: createEmptyTeamForm(),
    B: createEmptyTeamForm(),
    C: createEmptyTeamForm(),
    D: createEmptyTeamForm(),
  };
}

function buildTeamForms(teamConfigs: ScaleTeamConfig[]) {
  const nextForms = createEmptyTeamForms();

  teamConfigs.forEach((config) => {
    nextForms[config.teamName] = {
      supervisorName: config.supervisorName || "",
      radioOperatorName: config.radioOperatorName || "",
      members: config.members.map((member) => member.name).join(", "),
      initialCycle: config.initialCycle || "DAY",
    };
  });

  return nextForms;
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function buildVacationPersonOptions(teamConfigs: ScaleTeamConfig[], teamName: TeamName) {
  const teamConfig = teamConfigs.find((config) => config.teamName === teamName);

  if (!teamConfig) {
    return [] as VacationPersonOption[];
  }

  const options: VacationPersonOption[] = [];

  if (teamConfig.supervisorName) {
    options.push({
      label: `Supervisor - ${teamConfig.supervisorName}`,
      personKey: `supervisor-${teamConfig.teamName}`,
      personName: teamConfig.supervisorName,
    });
  }

  teamConfig.members.forEach((member) => {
    options.push({
      label: `Integrante - ${member.name}`,
      personKey: `member-${member.id}`,
      personName: member.name,
    });
  });

  if (teamConfig.radioOperatorName) {
    options.push({
      label: `Radio - ${teamConfig.radioOperatorName}`,
      personKey: `radio-${teamConfig.teamName}`,
      personName: teamConfig.radioOperatorName,
    });
  }

  return options;
}

function mergeSavedOverrides(
  currentOverrides: ScaleCellOverride[],
  savedOverrides: ScaleCellOverride[]
) {
  const nextOverrides = [...currentOverrides];

  savedOverrides.forEach((savedOverride) => {
    const existingIndex = nextOverrides.findIndex((override) => override.id === savedOverride.id);

    if (existingIndex >= 0) {
      nextOverrides[existingIndex] = savedOverride;
      return;
    }

    nextOverrides.push(savedOverride);
  });

  return nextOverrides;
}

function isDuplicateScaleMonthError(error: unknown) {
  const maybeError = error as ApiErrorLike;
  const status = maybeError.response?.status;
  const message = maybeError.response?.data?.message?.toLowerCase() || "";

  return status === 400 && (message.includes("existe") || message.includes("already"));
}

function getApiMessage(error: unknown, fallback: string) {
  const maybeError = error as ApiErrorLike;
  return maybeError.response?.data?.message || fallback;
}

export function Scales() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scaleMonths, setScaleMonths] = useState<ScaleMonth[]>([]);
  const [selectedScaleMonth, setSelectedScaleMonth] = useState<ScaleMonth | null>(null);
  const [teamConfigs, setTeamConfigs] = useState<ScaleTeamConfig[]>([]);
  const [cellOverrides, setCellOverrides] = useState<ScaleCellOverride[]>([]);
  const [teamForms, setTeamForms] = useState<TeamForms>(createEmptyTeamForms());
  const [teamMessages, setTeamMessages] = useState<TeamMessages>(createEmptyTeamMessages());
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingTeam, setSavingTeam] = useState<TeamName | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeOverrideCell, setActiveOverrideCell] = useState<OverrideModalState | null>(null);
  const [overrideValue, setOverrideValue] = useState<ScaleCellValue>("DAY");
  const [savingOverride, setSavingOverride] = useState(false);
  const [removingOverride, setRemovingOverride] = useState(false);
  const [overrideErrorMessage, setOverrideErrorMessage] = useState<string | null>(null);
  const [vacationTeamName, setVacationTeamName] = useState<TeamName>("A");
  const [vacationPersonKey, setVacationPersonKey] = useState("");
  const [vacationStartDay, setVacationStartDay] = useState("");
  const [vacationEndDay, setVacationEndDay] = useState("");
  const [vacationSubmitting, setVacationSubmitting] = useState(false);
  const [vacationMessage, setVacationMessage] = useState<TeamMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageVacation = user?.role === "ADMIN" || user?.role === "DEV";
  const daysInSelectedMonth = useMemo(() => getDaysInMonth(month, year), [month, year]);
  const vacationPersonOptions = useMemo(
    () => buildVacationPersonOptions(teamConfigs, vacationTeamName),
    [teamConfigs, vacationTeamName]
  );

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

  useEffect(() => {
    const existingScaleMonth = scaleMonths.find(
      (scaleMonth) => scaleMonth.month === month && scaleMonth.year === year
    );

    setSelectedScaleMonth(existingScaleMonth || null);
  }, [month, scaleMonths, year]);
  useEffect(() => {
    if (!selectedScaleMonth?.id) {
      setTeamConfigs([]);
      setCellOverrides([]);
      setTeamForms(createEmptyTeamForms());
      setTeamMessages(createEmptyTeamMessages());
      setActiveOverrideCell(null);
      setOverrideErrorMessage(null);
      setVacationMessage(null);
      setVacationPersonKey("");
      setLoadingTeams(false);
      return;
    }

    const scaleMonthId = selectedScaleMonth.id;
    let active = true;

    async function loadScaleMonthData() {
      try {
        setLoadingTeams(true);
        setOverrideErrorMessage(null);
        setVacationMessage(null);
        const [teamConfigsResponse, overridesResponse] = await Promise.all([
          api.get<ScaleTeamConfig[]>(`/scales/${scaleMonthId}/teams`),
          api.get<ScaleCellOverride[]>(`/scales/${scaleMonthId}/overrides`),
        ]);

        if (!active) {
          return;
        }

        setTeamConfigs(teamConfigsResponse.data);
        setCellOverrides(overridesResponse.data);
        setTeamForms(buildTeamForms(teamConfigsResponse.data));
        setTeamMessages(createEmptyTeamMessages());
      } catch {
        if (!active) {
          return;
        }

        setTeamConfigs([]);
        setCellOverrides([]);
        setTeamForms(createEmptyTeamForms());
        setErrorMessage("Nao foi possivel carregar os dados da escala.");
      } finally {
        if (active) {
          setLoadingTeams(false);
        }
      }
    }

    void loadScaleMonthData();

    return () => {
      active = false;
    };
  }, [selectedScaleMonth?.id]);


  useEffect(() => {
    if (!vacationPersonOptions.some((option) => option.personKey === vacationPersonKey)) {
      setVacationPersonKey("");
    }
  }, [vacationPersonKey, vacationPersonOptions]);

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
      setMonth(response.data.month);
      setYear(response.data.year);
      setTeamConfigs([]);
      setCellOverrides([]);
      setTeamForms(createEmptyTeamForms());
      setTeamMessages(createEmptyTeamMessages());
      setSuccessMessage("Escala gerada com sucesso.");
    } catch (error) {
      if (isDuplicateScaleMonthError(error)) {
        const existingScaleMonth = scaleMonths.find(
          (scaleMonth) => scaleMonth.month === month && scaleMonth.year === year
        );

        if (existingScaleMonth) {
          setMonth(existingScaleMonth.month);
          setYear(existingScaleMonth.year);
          setErrorMessage(null);
          setSuccessMessage("A escala deste mes ja existia e foi carregada.");
          return;
        }

        setErrorMessage(
          "A escala deste mes ja existe, mas nao foi encontrada na lista carregada. Atualize a pagina e tente novamente."
        );
        setSuccessMessage(null);
        return;
      }

      setErrorMessage(
        getApiMessage(
          error,
          "Nao foi possivel gerar a escala. Verifique se o mes ja existe ou tente novamente."
        )
      );
      setSuccessMessage(null);
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
      setTeamConfigs([]);
      setCellOverrides([]);
      setTeamForms(createEmptyTeamForms());
      setTeamMessages(createEmptyTeamMessages());
      setActiveOverrideCell(null);
      setVacationMessage(null);
      setSuccessMessage("Escala excluida com sucesso.");
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Nao foi possivel excluir a escala."));
    } finally {
      setDeleting(false);
    }
  }

  function updateTeamForm(teamName: TeamName, field: keyof TeamForm, value: string) {
    setTeamForms((currentForms) => ({
      ...currentForms,
      [teamName]: {
        ...currentForms[teamName],
        [field]: value,
      },
    }));
    setTeamMessages((currentMessages) => ({
      ...currentMessages,
      [teamName]: null,
    }));

    if (errorMessage) {
      setErrorMessage(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  function setTeamMessage(teamName: TeamName, message: TeamMessage) {
    setTeamMessages((currentMessages) => ({
      ...currentMessages,
      [teamName]: message,
    }));
  }

  function handleOpenOverrideModal(cell: ScaleCellClickData) {
    setActiveOverrideCell({
      teamName: cell.teamName,
      personKey: cell.personKey,
      personName: cell.personName,
      day: cell.day,
      value: cell.value,
      override: cell.override,
    });
    setOverrideValue(cell.override?.value || cell.value);
    setOverrideErrorMessage(null);
  }

  function handleCloseOverrideModal() {
    if (savingOverride || removingOverride) {
      return;
    }

    setActiveOverrideCell(null);
    setOverrideErrorMessage(null);
  }

  async function handleSaveOverride() {
    if (!selectedScaleMonth || !activeOverrideCell) {
      return;
    }

    const payload = {
      teamName: activeOverrideCell.teamName,
      personKey: activeOverrideCell.personKey,
      day: activeOverrideCell.day,
      value: overrideValue,
    };

    try {
      setSavingOverride(true);
      setOverrideErrorMessage(null);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = activeOverrideCell.override
        ? await api.put<ScaleCellOverride>(
            `/scales/overrides/${activeOverrideCell.override.id}`,
            { value: overrideValue }
          )
        : await api.post<ScaleCellOverride>(
            `/scales/${selectedScaleMonth.id}/overrides`,
            payload
          );

      const savedOverride = response.data;

      setCellOverrides((currentOverrides) => mergeSavedOverrides(currentOverrides, [savedOverride]));

      setSuccessMessage("Override de celula salvo com sucesso.");
      setActiveOverrideCell(null);
    } catch (error) {
      setOverrideErrorMessage(getApiMessage(error, "Nao foi possivel salvar o override."));
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleRemoveOverride() {
    if (!activeOverrideCell?.override) {
      return;
    }

    try {
      setRemovingOverride(true);
      setOverrideErrorMessage(null);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.delete(`/scales/overrides/${activeOverrideCell.override.id}`);

      setCellOverrides((currentOverrides) =>
        currentOverrides.filter((override) => override.id !== activeOverrideCell.override?.id)
      );
      setSuccessMessage("Override removido com sucesso.");
      setActiveOverrideCell(null);
    } catch (error) {
      setOverrideErrorMessage(getApiMessage(error, "Nao foi possivel remover o override."));
    } finally {
      setRemovingOverride(false);
    }
  }

  async function handleLaunchVacation() {
    if (!selectedScaleMonth) {
      setVacationMessage({
        type: "error",
        text: "Selecione ou gere uma escala antes de lancar ferias.",
      });
      return;
    }

    if (!vacationTeamName) {
      setVacationMessage({
        type: "error",
        text: "Selecione a equipe.",
      });
      return;
    }

    if (!vacationPersonKey) {
      setVacationMessage({
        type: "error",
        text: "Selecione a pessoa.",
      });
      return;
    }

    const startDay = Number(vacationStartDay);
    const endDay = Number(vacationEndDay);

    if (!startDay || !Number.isInteger(startDay)) {
      setVacationMessage({
        type: "error",
        text: "Informe um dia inicial valido.",
      });
      return;
    }

    if (!endDay || !Number.isInteger(endDay)) {
      setVacationMessage({
        type: "error",
        text: "Informe um dia final valido.",
      });
      return;
    }

    if (endDay < startDay) {
      setVacationMessage({
        type: "error",
        text: "O dia final deve ser maior ou igual ao dia inicial.",
      });
      return;
    }

    if (startDay < 1 || endDay > daysInSelectedMonth) {
      setVacationMessage({
        type: "error",
        text: `Os dias devem ficar entre 1 e ${daysInSelectedMonth}.`,
      });
      return;
    }

    try {
      setVacationSubmitting(true);
      setVacationMessage(null);
      setErrorMessage(null);
      setSuccessMessage(null);

      const days = Array.from({ length: endDay - startDay + 1 }, (_, index) => startDay + index);
      const responses = await Promise.all(
        days.map((day) =>
          api.post<ScaleCellOverride>(`/scales/${selectedScaleMonth.id}/overrides`, {
            teamName: vacationTeamName,
            personKey: vacationPersonKey,
            day,
            value: "VACATION",
          })
        )
      );

      const savedOverrides = responses.map((response) => response.data);
      setCellOverrides((currentOverrides) => mergeSavedOverrides(currentOverrides, savedOverrides));
      setVacationMessage({
        type: "success",
        text: "Ferias lancadas com sucesso.",
      });
    } catch (error) {
      setVacationMessage({
        type: "error",
        text: getApiMessage(error, "Nao foi possivel lancar as ferias."),
      });
    } finally {
      setVacationSubmitting(false);
    }
  }

  async function handleSaveTeam(teamName: TeamName) {
    if (!selectedScaleMonth) {
      setErrorMessage("Gere ou selecione uma escala antes de configurar equipes.");
      return;
    }

    const form = teamForms[teamName];
    const supervisorName = form.supervisorName.trim();
    const radioOperatorName = form.radioOperatorName.trim();
    const initialCycle = form.initialCycle;
    const members = form.members
      .split(/[,\r\n]+/)
      .map((member) => member.trim())
      .filter(Boolean);

    if (!supervisorName) {
      setTeamMessage(teamName, {
        type: "error",
        text: `Informe o supervisor da equipe ${teamName}.`,
      });
      return;
    }

    if (!radioOperatorName) {
      setTeamMessage(teamName, {
        type: "error",
        text: `Informe o radio operador da equipe ${teamName}.`,
      });
      return;
    }

    if (!initialCycle) {
      setTeamMessage(teamName, {
        type: "error",
        text: `Informe o ciclo inicial da equipe ${teamName}.`,
      });
      return;
    }

    const existingConfig = teamConfigs.find((config) => config.teamName === teamName);
    const payload = {
      teamName,
      initialCycle,
      supervisorName,
      radioOperatorName,
      members,
    };

    try {
      setSavingTeam(teamName);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = existingConfig
        ? await api.put<ScaleTeamConfig>(`/scales/${existingConfig.id}`, payload)
        : await api.post<ScaleTeamConfig>(`/scales/${selectedScaleMonth.id}/teams`, payload);

      const savedConfig = response.data;
      const nextConfigs = existingConfig
        ? teamConfigs.map((config) => (config.id === savedConfig.id ? savedConfig : config))
        : [...teamConfigs, savedConfig];

      setTeamConfigs(nextConfigs);
      setTeamForms(buildTeamForms(nextConfigs));
      setTeamMessage(teamName, {
        type: "success",
        text: `Equipe ${teamName} salva com sucesso.`,
      });
      setSuccessMessage(null);
    } catch (error) {
      setTeamMessage(teamName, {
        type: "error",
        text: getApiMessage(error, `Nao foi possivel salvar a equipe ${teamName}.`),
      });
    } finally {
      setSavingTeam(null);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-8 overflow-x-hidden p-4 sm:overflow-x-visible sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Escalas mensais
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure as equipes do mes, aplique overrides por celula e visualize a escala pelo modelo Excel.
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:p-5 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div className="space-y-1">
          <label htmlFor="scale-month" className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
          <label htmlFor="scale-year" className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
          {!selectedScaleMonth ? (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800 sm:p-8">
              <p className="text-slate-600 dark:text-slate-300">
                Gere ou selecione uma escala para configurar as equipes.
              </p>
            </section>
          ) : null}

          {selectedScaleMonth ? (
            <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Configuracao das equipes
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cadastre ou edite supervisor, radio operador, integrantes e ciclo inicial.
                </p>
              </div>

              {loadingTeams ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Carregando equipes...</p>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {teamNames.map((teamName) => {
                  const form = teamForms[teamName];
                  const existingConfig = teamConfigs.find((config) => config.teamName === teamName);
                  const teamMessage = teamMessages[teamName];

                  return (
                    <article key={teamName} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Equipe {teamName}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {existingConfig ? "Editando configuracao existente." : "Nova configuracao."}
                          </p>
                        </div>

                        {existingConfig ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Configurada
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Supervisor</label>
                        <input
                          type="text"
                          value={form.supervisorName}
                          onChange={(event) => updateTeamForm(teamName, "supervisorName", event.target.value)}
                          className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Radio operador</label>
                        <input
                          type="text"
                          value={form.radioOperatorName}
                          onChange={(event) => updateTeamForm(teamName, "radioOperatorName", event.target.value)}
                          className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Integrantes</label>
                        <textarea
                          value={form.members}
                          onChange={(event) => updateTeamForm(teamName, "members", event.target.value)}
                          rows={4}
                          placeholder="Separe os nomes por virgula ou por linha"
                          className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Ciclo inicial</label>
                        <select
                          value={form.initialCycle}
                          onChange={(event) => updateTeamForm(teamName, "initialCycle", event.target.value as InitialCycle)}
                          className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {initialCycleOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {teamMessage ? (
                        <p className={`text-sm ${teamMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {teamMessage.text}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleSaveTeam(teamName)}
                        disabled={savingTeam === teamName || loadingTeams}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingTeam === teamName ? "Salvando..." : "Salvar equipe"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {selectedScaleMonth && canManageVacation ? (
            <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Lancar ferias
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Marque ferias em lote usando os overrides atuais do calendario.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Equipe</label>
                  <select
                    value={vacationTeamName}
                    onChange={(event) => {
                      setVacationTeamName(event.target.value as TeamName);
                      setVacationPersonKey("");
                      setVacationMessage(null);
                    }}
                    className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {teamNames.map((teamName) => (
                      <option key={teamName} value={teamName}>
                        Equipe {teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Pessoa</label>
                  <select
                    value={vacationPersonKey}
                    onChange={(event) => {
                      setVacationPersonKey(event.target.value);
                      setVacationMessage(null);
                    }}
                    className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Selecione uma pessoa</option>
                    {vacationPersonOptions.map((option) => (
                      <option key={option.personKey} value={option.personKey}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Dia inicial</label>
                  <input
                    type="number"
                    min={1}
                    max={daysInSelectedMonth}
                    value={vacationStartDay}
                    onChange={(event) => {
                      setVacationStartDay(event.target.value);
                      setVacationMessage(null);
                    }}
                    className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Dia final</label>
                  <input
                    type="number"
                    min={1}
                    max={daysInSelectedMonth}
                    value={vacationEndDay}
                    onChange={(event) => {
                      setVacationEndDay(event.target.value);
                      setVacationMessage(null);
                    }}
                    className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {vacationPersonOptions.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Essa equipe ainda nao possui pessoas configuradas para receber ferias.
                </p>
              ) : null}

              {vacationMessage ? (
                <p className={`text-sm ${vacationMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {vacationMessage.text}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleLaunchVacation()}
                disabled={vacationSubmitting || loadingTeams || vacationPersonOptions.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {vacationSubmitting ? "Lancando..." : "Salvar ferias"}
              </button>
            </section>
          ) : null}

          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <ScaleCalendarView
              teamConfigs={teamConfigs}
              month={month}
              year={year}
              loading={loadingTeams}
              cellOverrides={cellOverrides}
              onCellClick={selectedScaleMonth ? handleOpenOverrideModal : undefined}
            />
          </div>
        </>
      ) : null}

      {activeOverrideCell ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Editar celula da escala
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {activeOverrideCell.personName} • Equipe {activeOverrideCell.teamName} • Dia {activeOverrideCell.day}
              </p>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Valor da celula
              </label>
              <select
                value={overrideValue}
                onChange={(event) => setOverrideValue(event.target.value as ScaleCellValue)}
                className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              >
                {overrideValueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} = {getScaleCellLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {overrideErrorMessage ? (
              <p className="mt-4 text-sm text-red-600">{overrideErrorMessage}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveOverride()}
                disabled={savingOverride}
                className="rounded-md bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingOverride ? "Salvando..." : "Salvar"}
              </button>

              {activeOverrideCell.override ? (
                <button
                  type="button"
                  onClick={() => void handleRemoveOverride()}
                  disabled={removingOverride}
                  className="rounded-md bg-red-600 px-4 py-2 text-white cursor-pointer transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {removingOverride ? "Removendo..." : "Remover override"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleCloseOverrideModal}
                disabled={savingOverride || removingOverride}
                className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 cursor-pointer transition hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
