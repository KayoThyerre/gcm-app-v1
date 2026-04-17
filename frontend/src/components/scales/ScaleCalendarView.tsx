import { Fragment, useMemo } from "react";

export type InitialCycle = "DAY" | "NIGHT_START" | "NIGHT_END" | "OFF";

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

type CellValue = "2/3" | "4" | "1" | "DES";

type CalendarDay = {
  day: number;
  weekday: string;
  isWeekend: boolean;
};

type ScalePerson = {
  name: string;
  role: string;
  cells: CellValue[];
};

type ScaleGroup = {
  title: string;
  accentClass: string;
  people: ScalePerson[];
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
};

const teamOrder: ScaleTeamConfig["teamName"][] = ["A", "B", "C", "D"];
const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const cycleOrder: InitialCycle[] = ["DAY", "NIGHT_START", "NIGHT_END", "OFF"];
const cycleDisplayMap: Record<InitialCycle, CellValue> = {
  DAY: "2/3",
  NIGHT_START: "4",
  NIGHT_END: "1",
  OFF: "DES",
};
const teamAccentClasses: Record<ScaleTeamConfig["teamName"], string> = {
  A: "bg-blue-600",
  B: "bg-emerald-600",
  C: "bg-amber-500",
  D: "bg-rose-600",
};

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

function buildCycleCells(initialCycle: InitialCycle | undefined, totalDays: number): CellValue[] {
  const startIndex = cycleOrder.indexOf(initialCycle || "DAY");
  const safeStartIndex = startIndex >= 0 ? startIndex : 0;

  return Array.from({ length: totalDays }, (_, index) => {
    const cycle = cycleOrder[(safeStartIndex + index) % cycleOrder.length];
    return cycleDisplayMap[cycle];
  });
}

function buildTeamGroup(config: ScaleTeamConfig, totalDays: number): ScaleGroup {
  const cells = buildCycleCells(config.initialCycle, totalDays);
  const people: ScalePerson[] = [
    {
      name: config.supervisorName || "Supervisor nao informado",
      role: "Supervisor",
      cells,
    },
    ...config.members.map((member) => ({
      name: member.name,
      role: "Integrante",
      cells,
    })),
  ];

  return {
    title: `Equipe ${config.teamName}`,
    accentClass: teamAccentClasses[config.teamName],
    people,
  };
}

function buildRadioGroup(configs: ScaleTeamConfig[], totalDays: number): ScaleGroup | null {
  const people = configs
    .filter((config) => config.radioOperatorName)
    .map((config) => ({
      name: config.radioOperatorName,
      role: `Radio Equipe ${config.teamName}`,
      cells: buildCycleCells(config.initialCycle, totalDays),
    }));

  if (people.length === 0) {
    return null;
  }

  return {
    title: "Radio Operadores",
    accentClass: "bg-slate-700",
    people,
  };
}

function getCellClass(value: CellValue) {
  const classes = {
    "2/3":
      "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    "4":
      "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    "1":
      "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
    DES:
      "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
  };

  return classes[value];
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
}: ScaleCalendarViewProps) {
  const days = useMemo(() => buildCalendarDays(month, year), [month, year]);

  const scaleGroups = useMemo(() => {
    const orderedConfigs = teamOrder
      .map((teamName) => teamConfigs.find((config) => config.teamName === teamName))
      .filter((config): config is ScaleTeamConfig => Boolean(config));

    const teamGroups = orderedConfigs.map((config) => buildTeamGroup(config, days.length));
    const radioGroup = buildRadioGroup(orderedConfigs, days.length);

    return radioGroup ? [...teamGroups, radioGroup] : teamGroups;
  }, [days.length, teamConfigs]);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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

      {!loading && scaleGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {emptyTeamsMessage}
        </div>
      ) : null}

      {scaleGroups.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-[1850px] border-collapse text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 w-[180px] min-w-[180px] border border-slate-300 bg-slate-200 px-3 py-2 text-left font-bold uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  Nome
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[180px] z-30 w-[140px] min-w-[140px] border border-slate-300 bg-slate-200 px-3 py-2 text-left font-bold uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  Funcao
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
              {scaleGroups.map((group) => (
                <Fragment key={group.title}>
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      className="border border-slate-300 bg-slate-100 p-0 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className={`h-5 w-1.5 rounded-full ${group.accentClass}`} />
                        <span className="font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                          {group.title}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {group.people.map((person) => (
                    <tr
                      key={`${group.title}-${person.name}`}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800/80"
                    >
                      <td className="sticky left-0 z-20 border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                        {person.name}
                      </td>
                      <td className="sticky left-[180px] z-20 border border-slate-300 bg-white px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {person.role}
                      </td>
                      {person.cells.map((cell, index) => (
                        <td
                          key={`${person.name}-${days[index].day}`}
                          className="border border-slate-200 bg-white p-1 text-center dark:border-slate-800 dark:bg-slate-950"
                        >
                          <span
                            className={`inline-flex min-h-7 w-full items-center justify-center rounded border px-1 font-bold ${getCellClass(
                              cell
                            )}`}
                          >
                            {cell}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <span><strong>1</strong> = 00h-06h</span>
        <span><strong>2</strong> = 06h-12h</span>
        <span><strong>3</strong> = 12h-18h</span>
        <span><strong>4</strong> = 18h-00h</span>
        <span><strong>DES</strong> = Descanso</span>
      </div>
    </section>
  );
}