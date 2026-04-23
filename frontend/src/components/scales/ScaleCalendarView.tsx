import { Fragment, useMemo } from "react";

export type InitialCycle = "DAY" | "NIGHT_START" | "NIGHT_END" | "OFF";
export type ScaleCellValue =
  | "DAY"
  | "NIGHT_START"
  | "NIGHT_END"
  | "NIGHT_FULL"
  | "OFF"
  | "MEDICAL_LEAVE"
  | "BANK_HOURS"
  | "VACATION";

export type ScaleTeamMember = {
  id: string;
  name: string;
  createdAt?: string;
};

export type ScaleTeamConfig = {
  id: string;
  scaleMonthId: string;
  teamName: "A" | "B" | "C" | "D";
  initialCycle?: InitialCycle;
  supervisorName: string;
  radioOperatorName: string;
  members: ScaleTeamMember[];
  createdAt?: string;
  updatedAt?: string;
};

export type ScaleCellOverride = {
  id: string;
  scaleMonthId: string;
  teamName: string;
  personKey: string;
  day: number;
  value: ScaleCellValue;
  createdAt?: string;
  updatedAt?: string;
};

type CalendarDay = {
  day: number;
  weekday: string;
  isWeekend: boolean;
};

type ScaleRow = {
  groupTitle: string;
  groupAccentClass: string;
  scaleMonthId: string;
  teamName: string;
  personKey: string;
  personName: string;
  role: string;
  initialCycle?: InitialCycle;
};

type VacationSummary = {
  key: string;
  teamName: string;
  personKey: string;
  personName: string;
  days: number[];
};

export type ScaleCellClickData = {
  teamName: string;
  personKey: string;
  personName: string;
  day: number;
  value: ScaleCellValue;
  override: ScaleCellOverride | null;
};

type ScaleCalendarViewProps = {
  teamConfigs: ScaleTeamConfig[];
  month: number;
  year: number;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  selectedLabel?: string | null;
  emptyTeamsMessage?: string;
  cellOverrides?: ScaleCellOverride[];
  onCellClick?: (data: ScaleCellClickData) => void;
};

const teamOrder: ScaleTeamConfig["teamName"][] = ["A", "B", "C", "D"];
const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const cycleOrder: InitialCycle[] = ["DAY", "NIGHT_START", "NIGHT_END", "OFF"];
const displayMap: Record<ScaleCellValue, string> = {
  DAY: "2/3",
  NIGHT_START: "4",
  NIGHT_END: "1",
  NIGHT_FULL: "1/4",
  OFF: "DES",
  MEDICAL_LEAVE: "D.M.",
  BANK_HOURS: "B.H.",
  VACATION: "FER",
};
const teamAccentClasses: Record<ScaleTeamConfig["teamName"], string> = {
  A: "bg-blue-600",
  B: "bg-emerald-600",
  C: "bg-amber-500",
  D: "bg-rose-600",
};

function normalizeKeyPart(value: string) {
  return value.trim();
}

function getOverrideKey(scaleMonthId: string, teamName: string, personKey: string, day: number) {
  return [
    normalizeKeyPart(scaleMonthId),
    normalizeKeyPart(teamName),
    normalizeKeyPart(personKey),
    String(day),
  ].join("::");
}

function getPersonLookupKey(teamName: string, personKey: string) {
  return [normalizeKeyPart(teamName), normalizeKeyPart(personKey)].join("::");
}

function buildCalendarDays(month: number, year: number): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const weekdayIndex = date.getDay();

    return {
      day,
      weekday: weekdayLabels[weekdayIndex],
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
    };
  });
}

function getBaseCycleValue(initialCycle: InitialCycle | undefined, dayIndex: number): ScaleCellValue {
  const startIndex = cycleOrder.indexOf(initialCycle || "DAY");
  const safeStartIndex = startIndex >= 0 ? startIndex : 0;
  return cycleOrder[(safeStartIndex + dayIndex) % cycleOrder.length];
}

function buildRows(teamConfigs: ScaleTeamConfig[]) {
  const orderedConfigs = teamOrder
    .map((teamName) => teamConfigs.find((config) => config.teamName === teamName))
    .filter((config): config is ScaleTeamConfig => Boolean(config));

  const rows: ScaleRow[] = [];

  orderedConfigs.forEach((config) => {
    rows.push({
      groupTitle: `Equipe ${config.teamName}`,
      groupAccentClass: teamAccentClasses[config.teamName],
      scaleMonthId: config.scaleMonthId,
      teamName: config.teamName,
      personKey: `supervisor-${config.teamName}`,
      personName: config.supervisorName || "Supervisor nao informado",
      role: "Supervisor",
      initialCycle: config.initialCycle,
    });

    config.members.forEach((member) => {
      rows.push({
        groupTitle: `Equipe ${config.teamName}`,
        groupAccentClass: teamAccentClasses[config.teamName],
        scaleMonthId: config.scaleMonthId,
        teamName: config.teamName,
        personKey: `member-${member.id}`,
        personName: member.name,
        role: "Integrante",
        initialCycle: config.initialCycle,
      });
    });
  });

  orderedConfigs.forEach((config) => {
    if (!config.radioOperatorName) {
      return;
    }

    rows.push({
      groupTitle: "Radio Operadores",
      groupAccentClass: "bg-slate-700",
      scaleMonthId: config.scaleMonthId,
      teamName: config.teamName,
      personKey: `radio-${config.teamName}`,
      personName: config.radioOperatorName,
      role: `Radio Equipe ${config.teamName}`,
      initialCycle: config.initialCycle,
    });
  });

  return rows;
}

function getCellClass(value: ScaleCellValue) {
  const classes = {
    DAY: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    NIGHT_START: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    NIGHT_END: "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
    NIGHT_FULL: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-200",
    OFF: "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
    MEDICAL_LEAVE: "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
    BANK_HOURS: "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
    VACATION: "border-cyan-200 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200",
  };

  return classes[value];
}

export function getScaleCellLabel(value: ScaleCellValue) {
  return displayMap[value];
}

function getPrintRoleLabel(role: string) {
  if (role === "Supervisor") {
    return "SUP";
  }

  if (role.startsWith("Radio")) {
    return "ROP";
  }

  return "MOT/PAT";
}

export function ScaleCalendarView({
  teamConfigs,
  month,
  year,
  loading = false,
  title = "Visualizacao do calendario",
  subtitle = "Estrutura visual usando as configuracoes reais das equipes e o ciclo inicial de cada equipe.",
  selectedLabel = null,
  emptyTeamsMessage = "Nenhuma equipe configurada para este mes.",
  cellOverrides = [],
  onCellClick,
}: ScaleCalendarViewProps) {
  const days = useMemo(() => buildCalendarDays(month, year), [month, year]);
  const rows = useMemo(() => buildRows(teamConfigs), [teamConfigs]);

  const overridesMap = useMemo(() => {
    return new Map(
      cellOverrides.map((override) => [
        getOverrideKey(override.scaleMonthId, override.teamName, override.personKey, override.day),
        override,
      ])
    );
  }, [cellOverrides]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, { accentClass: string; rows: ScaleRow[] }>();

    rows.forEach((row) => {
      if (!groups.has(row.groupTitle)) {
        groups.set(row.groupTitle, {
          accentClass: row.groupAccentClass,
          rows: [],
        });
      }

      groups.get(row.groupTitle)?.rows.push(row);
    });

    return Array.from(groups.entries()).map(([groupTitle, value]) => ({
      title: groupTitle,
      accentClass: value.accentClass,
      rows: value.rows,
    }));
  }, [rows]);

  const personNameMap = useMemo(() => {
    return new Map(
      rows.map((row) => [getPersonLookupKey(row.teamName, row.personKey), row.personName])
    );
  }, [rows]);

  const vacationSummaries = useMemo(() => {
    const grouped = new Map<string, VacationSummary>();

    cellOverrides
      .filter((override) => override.value === "VACATION")
      .forEach((override) => {
        const summaryKey = getPersonLookupKey(override.teamName, override.personKey);
        const existing = grouped.get(summaryKey);
        const personName = personNameMap.get(summaryKey) || override.personKey;

        if (!existing) {
          grouped.set(summaryKey, {
            key: summaryKey,
            teamName: override.teamName,
            personKey: override.personKey,
            personName,
            days: [override.day],
          });
          return;
        }

        if (!existing.days.includes(override.day)) {
          existing.days.push(override.day);
        }
      });

    return Array.from(grouped.values())
      .map((summary) => ({
        ...summary,
        days: [...summary.days].sort((left, right) => left - right),
      }))
      .sort((left, right) => {
        if (left.teamName !== right.teamName) {
          return left.teamName.localeCompare(right.teamName);
        }

        return left.personName.localeCompare(right.personName);
      });
  }, [cellOverrides, personNameMap]);

  const hasRows = groupedRows.length > 0;

  return (
    <section
      data-scale-calendar-root="true"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>

        {selectedLabel ? (
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/60">
            {selectedLabel}
          </span>
        ) : null}
      </div>

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-400">Carregando equipes...</p> : null}

      {!loading && !hasRows ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {emptyTeamsMessage}
        </div>
      ) : null}

      {hasRows ? (
        <div
          data-scale-table-wrapper="true"
          className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <table data-scale-table="true" className="min-w-[1850px] border-collapse text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  data-column="name"
                  className="sticky left-0 z-30 w-[180px] min-w-[180px] border border-slate-300 bg-slate-200 px-3 py-2 text-left font-bold uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <span className="print:inline">Nome</span>
                </th>
                <th
                  rowSpan={2}
                  data-column="role"
                  className="sticky left-[180px] z-30 w-[140px] min-w-[140px] border border-slate-300 bg-slate-200 px-3 py-2 text-left font-bold uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <span className="print:hidden">Funcao</span>
                  <span className="hidden print:inline">Func.</span>
                </th>
                {days.map((item) => (
                  <th
                    key={`day-${item.day}`}
                    className={
                      "w-[3rem] min-w-[3rem] border px-2 py-2 text-center font-bold text-white dark:border-slate-700 " +
                      (item.isWeekend
                        ? "border-rose-300 bg-rose-500 dark:bg-rose-600"
                        : "border-slate-300 bg-blue-600 dark:bg-blue-500")
                    }
                  >
                    {item.day}
                  </th>
                ))}
              </tr>
              <tr>
                {days.map((item) => (
                  <th
                    key={`weekday-${item.day}`}
                    className={
                      "w-[3rem] min-w-[3rem] border px-2 py-1 text-center font-semibold dark:border-slate-700 " +
                      (item.isWeekend
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                        : "border-slate-300 bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-blue-200")
                    }
                  >
                    {item.weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group) => (
                <Fragment key={group.title}>
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      className="border border-slate-300 bg-slate-100 p-0 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className={`h-5 w-1.5 rounded-full ${group.accentClass}`} />
                        <span className="font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                          {group.title === "Radio Operadores" ? (
                            <>
                              <span className="print:hidden">{group.title}</span>
                              <span className="hidden print:inline">Radio Op.</span>
                            </>
                          ) : (
                            group.title
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {group.rows.map((row) => (
                    <tr key={`${group.title}-${row.personKey}`} className="hover:bg-blue-50 dark:hover:bg-slate-800/80">
                      <td
                        data-column="name"
                        className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {row.personName}
                      </td>
                      <td
                        data-column="role"
                        data-print-role={getPrintRoleLabel(row.role)}
                        className="sticky left-[180px] z-20 border border-slate-300 bg-white px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <span className="print:hidden">{row.role}</span>
                        <span className="hidden print:inline">{getPrintRoleLabel(row.role)}</span>
                      </td>
                      {days.map((dayItem, index) => {
                        const overrideKey = getOverrideKey(
                          row.scaleMonthId,
                          row.teamName,
                          row.personKey,
                          dayItem.day
                        );
                        const override = overridesMap.get(overrideKey) || null;
                        const value = override?.value || getBaseCycleValue(row.initialCycle, index);
                        const interactive = Boolean(onCellClick);

                        return (
                          <td
                            key={`${row.personKey}-${dayItem.day}`}
                            className="border border-slate-200 bg-white p-1 text-center dark:border-slate-800 dark:bg-slate-950"
                          >
                            <button
                              type="button"
                              disabled={!interactive}
                              onClick={() =>
                                onCellClick?.({
                                  teamName: row.teamName,
                                  personKey: row.personKey,
                                  personName: row.personName,
                                  day: dayItem.day,
                                  value,
                                  override,
                                })
                              }
                              className={
                                "relative inline-flex min-h-7 w-full items-center justify-center rounded border px-1 font-bold transition " +
                                getCellClass(value) +
                                (override ? " ring-2 ring-blue-500/60" : "") +
                                (interactive ? " cursor-pointer hover:scale-[1.02]" : " cursor-default")
                              }
                            >
                              {getScaleCellLabel(value)}
                              {override ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300" /> : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {vacationSummaries.length > 0 ? (
        <section
          data-scale-vacation="true"
          className="rounded-lg border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/70 dark:bg-cyan-950/20"
        >
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ferias</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pessoas que estão de férias:
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {vacationSummaries.map((summary) => (
              <div
                key={summary.key}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{summary.personName}</span>
                <span className="text-slate-500 dark:text-slate-400"> | Equipe {summary.teamName} | dias: </span>
                <span className="font-medium text-cyan-700 dark:text-cyan-300">{summary.days.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div
        data-scale-legend="true"
        className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-8"
      >
        <span><strong>1</strong> = 00h-06h</span>
        <span><strong>2</strong> = 06h-12h</span>
        <span><strong>3</strong> = 12h-18h</span>
        <span><strong>4</strong> = 18h-00h</span>
        <span><strong>1/4</strong> = Noite cheia</span>
        <span><strong>DES</strong> = Descanso</span>
        <span><strong>D.M.</strong> = Licenca medica</span>
        <span><strong>B.H.</strong> = Banco de horas</span>
        <span><strong>FER</strong> = Ferias</span>
      </div>
    </section>
  );
}
