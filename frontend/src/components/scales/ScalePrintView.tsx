import { Fragment, useMemo } from "react";
import {
  buildCalendarDays,
  buildRows,
  getBaseCycleValue,
  getOverrideKey,
  getScaleCellLabel,
  type ScaleCellOverride,
  type ScaleCellValue,
  type ScaleTeamConfig,
} from "./ScaleCalendarView";

type ScalePrintViewProps = {
  teamConfigs: ScaleTeamConfig[];
  month: number;
  year: number;
  cellOverrides?: ScaleCellOverride[];
  selectedLabel?: string | null;
};

const cellClassByValue: Record<ScaleCellValue, string> = {
  DAY: "border-emerald-300 bg-emerald-100 text-emerald-900",
  NIGHT_START: "border-amber-300 bg-amber-100 text-amber-900",
  NIGHT_END: "border-sky-300 bg-sky-100 text-sky-900",
  NIGHT_FULL: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900",
  OFF: "border-slate-300 bg-slate-200 text-slate-700",
  MEDICAL_LEAVE: "border-rose-300 bg-rose-100 text-rose-900",
  BANK_HOURS: "border-violet-300 bg-violet-100 text-violet-900",
  VACATION: "border-cyan-300 bg-cyan-100 text-cyan-900",
};

function getPrintRoleLabel(role: string) {
  if (role === "Supervisor") {
    return "SUP";
  }

  if (role === "Integrante") {
    return "MOT/PAT";
  }

  const radioMatch = role.match(/^Radio Equipe (.+)$/);

  if (radioMatch) {
    return `ROP ${radioMatch[1]}`;
  }

  if (role.startsWith("Radio")) {
    return "ROP";
  }

  return role;
}

export function ScalePrintView({
  teamConfigs,
  month,
  year,
  cellOverrides = [],
  selectedLabel,
}: ScalePrintViewProps) {
  const days = useMemo(() => buildCalendarDays(month, year), [month, year]);
  const rows = useMemo(() => buildRows(teamConfigs), [teamConfigs]);

  const groupedRows = useMemo(() => {
    const groups = new Map<
      string,
      { accentClass: string; rows: typeof rows }
    >();

    rows.forEach((row) => {
      if (!groups.has(row.groupTitle)) {
        groups.set(row.groupTitle, {
          accentClass: row.groupAccentClass,
          rows: [],
        });
      }

      groups.get(row.groupTitle)?.rows.push(row);
    });

    return Array.from(groups.entries()).map(([title, value]) => ({
      title,
      accentClass: value.accentClass,
      rows: value.rows,
    }));
  }, [rows]);

  const overridesMap = useMemo(() => {
    return new Map(
      cellOverrides.map((override) => [
        getOverrideKey(
          override.scaleMonthId,
          override.teamName,
          override.personKey,
          override.day
        ),
        override,
      ])
    );
  }, [cellOverrides]);

  const personNameMap = useMemo(() => {
    return new Map(
      rows.map((row) => [
        [row.teamName, row.personKey].join("::"),
        row.personName,
      ])
    );
  }, [rows]);

  const vacationSummaries = useMemo(() => {
    const grouped = new Map<
      string,
      {
        teamName: string;
        personKey: string;
        personName: string;
        days: number[];
      }
    >();

    cellOverrides
      .filter((override) => override.value === "VACATION")
      .forEach((override) => {
        const key = [override.teamName, override.personKey].join("::");
        const personName = personNameMap.get(key) || override.personKey;
        const existing = grouped.get(key);

        if (!existing) {
          grouped.set(key, {
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

  return (
    <section className="w-full bg-white text-slate-950">
      <header className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <div>
          <h1 className="text-[14px] font-bold leading-tight">
            Escala Mensal de Servico
          </h1>
          <p className="text-[7.5px] leading-tight text-slate-600">
            Consulta interna das equipes, radios operadores, folgas e
            ocorrencias lancadas.
          </p>
        </div>

        {selectedLabel ? (
          <div className="rounded border border-slate-300 px-1.5 py-0.5 text-[7.5px] font-semibold leading-none text-slate-700">
            {selectedLabel}
          </div>
        ) : null}
      </header>

      {groupedRows.length === 0 ? (
        <div className="border border-dashed border-slate-300 p-4 text-center text-[9px] text-slate-600">
          Nenhuma equipe configurada para a escala selecionada.
        </div>
      ) : (
        <table className="w-full table-fixed border-collapse text-[7px] leading-none">
          <colgroup>
            <col className="w-[50px]" />
            <col className="w-[24px]" />
            {days.map((day) => (
              <col key={`col-${day.day}`} className="w-[5.8mm]" />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th
                rowSpan={2}
                className="border border-slate-400 bg-slate-200 px-0.5 py-0.5 text-left font-bold uppercase"
              >
                Nome
              </th>
              <th
                rowSpan={2}
                className="border border-slate-400 bg-slate-200 px-0.5 py-0.5 text-left font-bold uppercase"
              >
                Func.
              </th>
              {days.map((day) => (
                <th
                  key={`day-${day.day}`}
                  className={
                    "border px-0 py-0.5 text-center font-bold text-white " +
                    (day.isWeekend
                      ? "border-rose-400 bg-rose-600"
                      : "border-blue-400 bg-blue-700")
                  }
                >
                  {day.day}
                </th>
              ))}
            </tr>
            <tr>
              {days.map((day) => (
                <th
                  key={`weekday-${day.day}`}
                  className={
                    "border px-0 py-[1px] text-center text-[5.8px] font-bold " +
                    (day.isWeekend
                      ? "border-rose-300 bg-rose-100 text-rose-800"
                      : "border-blue-200 bg-blue-50 text-blue-800")
                  }
                >
                  {day.weekday}
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
                    className="border border-slate-400 bg-slate-100 p-0"
                  >
                    <div className="flex h-[9px] items-center gap-1 px-1">
                      <span
                        className={`h-[6px] w-[2px] rounded-sm ${group.accentClass}`}
                      />
                      <span className="text-[6.8px] font-bold uppercase tracking-wide">
                        {group.title}
                      </span>
                    </div>
                  </td>
                </tr>

                {group.rows.map((row) => (
                  <tr key={`${group.title}-${row.personKey}`}>
                    <td className="overflow-hidden text-ellipsis whitespace-nowrap border border-slate-300 px-0.5 py-0.5 font-medium">
                      {row.personName}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap border border-slate-300 px-0.5 py-0.5 text-[6px] text-slate-700">
                      {getPrintRoleLabel(row.role)}
                    </td>
                    {days.map((day, index) => {
                      const overrideKey = getOverrideKey(
                        row.scaleMonthId,
                        row.teamName,
                        row.personKey,
                        day.day
                      );
                      const override = overridesMap.get(overrideKey);
                      const value =
                        override?.value ||
                        getBaseCycleValue(row.initialCycle, index);

                      return (
                        <td
                          key={`${row.personKey}-${day.day}`}
                          className="border border-slate-300 p-[0.5px] text-center"
                        >
                          <span
                            className={
                              "block rounded-[1px] border py-[1px] text-[6.2px] font-bold leading-none " +
                              cellClassByValue[value]
                            }
                          >
                            {getScaleCellLabel(value)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {vacationSummaries.length > 0 ? (
        <section className="mt-1.5 border border-cyan-300 bg-cyan-50/50">
          <div className="border-b border-cyan-300 bg-cyan-100 px-1 py-[1px] text-[6.5px] font-bold uppercase leading-none text-cyan-900">
            Ferias
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0 px-1 py-0.5 text-[6.5px] leading-tight text-slate-800">
            {vacationSummaries.map((summary) => (
              <div
                key={`${summary.teamName}-${summary.personKey}`}
                className="overflow-hidden text-ellipsis whitespace-nowrap"
              >
                <span className="font-semibold">{summary.personName}</span>
                <span className="text-slate-500"> | Equipe {summary.teamName} | </span>
                <span>{summary.days.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 border-t border-slate-300 pt-1 text-[6.8px] leading-tight text-slate-700">
        <span><strong>1</strong> = 00h-06h</span>
        <span><strong>2</strong> = 06h-12h</span>
        <span><strong>3</strong> = 12h-18h</span>
        <span><strong>4</strong> = 18h-00h</span>
        <span><strong>1/4</strong> = Noite cheia</span>
        <span><strong>DES</strong> = Descanso</span>
        <span><strong>D.M.</strong> = Licenca medica</span>
        <span><strong>B.H.</strong> = Banco de horas</span>
        <span><strong>FER</strong> = Ferias</span>
      </footer>
    </section>
  );
}
