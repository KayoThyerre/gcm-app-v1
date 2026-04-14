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

type InitialCycle = "DAY" | "NIGHT_START" | "NIGHT_END" | "OFF";
type TeamName = "A" | "B" | "C" | "D";

type ScaleTeamMember = {
  id: string;
  name: string;
  createdAt: string;
};

type ScaleTeamConfig = {
  id: string;
  scaleMonthId: string;
  teamName: TeamName;
  initialCycle: InitialCycle;
  supervisorName: string;
  radioOperatorName: string;
  members: ScaleTeamMember[];
  createdAt: string;
  updatedAt: string;
};

type TeamForm = {
  supervisorName: string;
  radioOperatorName: string;
  members: string;
  initialCycle: InitialCycle;
};

type TeamForms = Record<TeamName, TeamForm>;

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

const teamNames: TeamName[] = ["A", "B", "C", "D"];
const initialCycleOptions: InitialCycle[] = [
  "DAY",
  "NIGHT_START",
  "NIGHT_END",
  "OFF",
];
const cycleOrder: InitialCycle[] = ["DAY", "NIGHT_START", "NIGHT_END", "OFF"];
const cycleDisplayMap: Record<InitialCycle, string> = {
  DAY: "2/3",
  NIGHT_START: "4",
  NIGHT_END: "1",
  OFF: "F",
};

function createEmptyTeamForm(): TeamForm {
  return {
    supervisorName: "",
    radioOperatorName: "",
    members: "",
    initialCycle: "DAY",
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

function getApiMessage(error: unknown, fallback: string) {
  const maybeError = error as ApiErrorLike;
  return maybeError.response?.data?.message || fallback;
}

function buildTeamForms(teamConfigs: ScaleTeamConfig[]) {
  const nextForms = createEmptyTeamForms();

  teamConfigs.forEach((teamConfig) => {
    nextForms[teamConfig.teamName] = {
      supervisorName: teamConfig.supervisorName,
      radioOperatorName: teamConfig.radioOperatorName,
      members: teamConfig.members.map((member) => member.name).join(", "),
      initialCycle: teamConfig.initialCycle,
    };
  });

  return nextForms;
}

function getCycleDisplay(initialCycle: InitialCycle, dayIndex: number) {
  const startIndex = cycleOrder.indexOf(initialCycle);
  const cycle = cycleOrder[(startIndex + dayIndex) % cycleOrder.length];
  return cycleDisplayMap[cycle];
}

export function Scales() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scaleMonths, setScaleMonths] = useState<ScaleMonthSummary[]>([]);
  const [scaleMonth, setScaleMonth] = useState<ScaleMonthDetail | null>(null);
  const [teamConfigs, setTeamConfigs] = useState<ScaleTeamConfig[]>([]);
  const [teamForms, setTeamForms] = useState<TeamForms>(createEmptyTeamForms());
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingTeam, setSavingTeam] = useState<TeamName | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  async function loadTeamConfigs(scaleMonthId: string) {
    const response = await api.get<ScaleTeamConfig[]>(`/scales/${scaleMonthId}/teams`);
    setTeamConfigs(response.data);
    setTeamForms(buildTeamForms(response.data));
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

  useEffect(() => {
    if (!scaleMonth) {
      setTeamConfigs([]);
      setTeamForms(createEmptyTeamForms());
      return;
    }

    const scaleMonthId = scaleMonth.id;
    let active = true;

    async function loadCurrentTeamConfigs() {
      try {
        setLoadingTeams(true);
        const response = await api.get<ScaleTeamConfig[]>(
          `/scales/${scaleMonthId}/teams`
        );

        if (!active) {
          return;
        }

        setTeamConfigs(response.data);
        setTeamForms(buildTeamForms(response.data));
      } catch {
        if (!active) {
          return;
        }

        setTeamConfigs([]);
        setTeamForms(createEmptyTeamForms());
        setErrorMessage("Nao foi possivel carregar a configuracao das equipes.");
      } finally {
        if (active) {
          setLoadingTeams(false);
        }
      }
    }

    void loadCurrentTeamConfigs();

    return () => {
      active = false;
    };
  }, [scaleMonth?.id]);

  const visibleDays = useMemo(() => {
    if (!scaleMonth) {
      return [];
    }

    return getDayNumbers(scaleMonth.days);
  }, [scaleMonth]);

  const calendarRows = useMemo(() => {
    return teamNames.flatMap((teamName) => [
      { label: `Equipe ${teamName}`, teamName },
      { label: `Radio ${teamName}`, teamName },
    ]);
  }, []);

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
      setErrorMessage(getApiMessage(error, "Nao foi possivel gerar a escala."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteScaleMonth() {
    if (!scaleMonth) {
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

      await api.delete(`/scales/months/${scaleMonth.id}`);

      setScaleMonths((currentScaleMonths) =>
        currentScaleMonths.filter((item) => item.id !== scaleMonth.id)
      );
      setScaleMonth(null);
      setTeamConfigs([]);
      setTeamForms(createEmptyTeamForms());
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

    if (errorMessage) {
      setErrorMessage(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  async function handleSaveTeam(teamName: TeamName) {
    if (!scaleMonth) {
      setErrorMessage("Gere ou selecione uma escala antes de configurar as equipes.");
      return;
    }

    const scaleMonthId = scaleMonth.id;
    const form = teamForms[teamName];
    const members = form.members
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);

    try {
      setSavingTeam(teamName);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.post(`/scales/${scaleMonthId}/teams`, {
        teamName,
        supervisorName: form.supervisorName,
        radioOperatorName: form.radioOperatorName,
        members,
        initialCycle: form.initialCycle,
      });

      await loadTeamConfigs(scaleMonthId);
      setSuccessMessage(`Equipe ${teamName} configurada com sucesso.`);
    } catch (error) {
      setErrorMessage(getApiMessage(error, `Nao foi possivel salvar a equipe ${teamName}.`));
    } finally {
      setSavingTeam(null);
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
          disabled={!scaleMonth || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-white cursor-pointer transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {deleting ? "Excluindo..." : "Excluir escala"}
        </button>
      </section>

      {loading ? <p className="text-slate-600 dark:text-slate-400">Carregando...</p> : null}

      {!loading && !scaleMonth ? (
        <p className="text-slate-600 dark:text-slate-400">
          Nenhuma escala encontrada para o mes e ano selecionados.
        </p>
      ) : null}

      {!loading && scaleMonth ? (
        <>
          <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Configuracao das equipes
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cadastre supervisor, radio operador, integrantes e ciclo inicial para cada equipe do mes selecionado.
              </p>
            </div>

            {loadingTeams ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Carregando configuracoes...</p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              {teamNames.map((teamName) => {
                const form = teamForms[teamName];
                const existingTeamConfig = teamConfigs.find(
                  (teamConfig) => teamConfig.teamName === teamName
                );

                return (
                  <article
                    key={teamName}
                    className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Equipe {teamName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {existingTeamConfig ? "Equipe ja configurada neste mes." : "Equipe ainda nao configurada neste mes."}
                        </p>
                      </div>

                      {existingTeamConfig ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Configurada
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Supervisor
                      </label>
                      <input
                        type="text"
                        value={form.supervisorName}
                        onChange={(event) =>
                          updateTeamForm(teamName, "supervisorName", event.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Radio operador
                      </label>
                      <input
                        type="text"
                        value={form.radioOperatorName}
                        onChange={(event) =>
                          updateTeamForm(teamName, "radioOperatorName", event.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Integrantes
                      </label>
                      <textarea
                        value={form.members}
                        onChange={(event) => updateTeamForm(teamName, "members", event.target.value)}
                        rows={4}
                        placeholder="Separe os nomes por virgula"
                        className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Ciclo inicial
                      </label>
                      <select
                        value={form.initialCycle}
                        onChange={(event) =>
                          updateTeamForm(teamName, "initialCycle", event.target.value as InitialCycle)
                        }
                        className="w-full rounded-md border px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {initialCycleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveTeam(teamName)}
                      disabled={savingTeam === teamName}
                      className="rounded-md bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingTeam === teamName ? "Salvando..." : "Salvar equipe"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

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
                  {calendarRows.map((row) => {
                    const teamConfig = teamConfigs.find(
                      (teamConfigItem) => teamConfigItem.teamName === row.teamName
                    );

                    return (
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
                            {teamConfig ? getCycleDisplay(teamConfig.initialCycle, index) : "-"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
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
        </>
      ) : null}
    </div>
  );
}
