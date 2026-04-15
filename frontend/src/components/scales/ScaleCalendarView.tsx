import { Fragment } from "react";

type CellValue = "2/3" | "4" | "1" | "DES";

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

const days = [
  { day: 1, weekday: "SEG" },
  { day: 2, weekday: "TER" },
  { day: 3, weekday: "QUA" },
  { day: 4, weekday: "QUI" },
  { day: 5, weekday: "SEX" },
  { day: 6, weekday: "SAB" },
  { day: 7, weekday: "DOM" },
  { day: 8, weekday: "SEG" },
  { day: 9, weekday: "TER" },
  { day: 10, weekday: "QUA" },
  { day: 11, weekday: "QUI" },
  { day: 12, weekday: "SEX" },
  { day: 13, weekday: "SAB" },
  { day: 14, weekday: "DOM" },
  { day: 15, weekday: "SEG" },
  { day: 16, weekday: "TER" },
  { day: 17, weekday: "QUA" },
  { day: 18, weekday: "QUI" },
  { day: 19, weekday: "SEX" },
  { day: 20, weekday: "SAB" },
  { day: 21, weekday: "DOM" },
  { day: 22, weekday: "SEG" },
  { day: 23, weekday: "TER" },
  { day: 24, weekday: "QUA" },
  { day: 25, weekday: "QUI" },
  { day: 26, weekday: "SEX" },
  { day: 27, weekday: "SAB" },
  { day: 28, weekday: "DOM" },
  { day: 29, weekday: "SEG" },
  { day: 30, weekday: "TER" },
  { day: 31, weekday: "QUA" },
];

function mockCells(offset: number): CellValue[] {
  const pattern: CellValue[] = ["2/3", "4", "1", "DES"];
  return days.map((_, index) => pattern[(index + offset) % pattern.length]);
}

const scaleGroups: ScaleGroup[] = [
  {
    title: "Equipe A",
    accentClass: "bg-blue-600",
    people: [
      { name: "Carlos Almeida", role: "Supervisor", cells: mockCells(0) },
      { name: "Marina Souza", role: "Patrulha", cells: mockCells(0) },
      { name: "Diego Ramos", role: "Patrulha", cells: mockCells(0) },
      { name: "Paulo Henrique", role: "Apoio", cells: mockCells(0) },
    ],
  },
  {
    title: "Equipe B",
    accentClass: "bg-emerald-600",
    people: [
      { name: "Fernanda Lima", role: "Supervisor", cells: mockCells(1) },
      { name: "Roberto Nunes", role: "Patrulha", cells: mockCells(1) },
      { name: "Andre Martins", role: "Patrulha", cells: mockCells(1) },
    ],
  },
  {
    title: "Equipe C",
    accentClass: "bg-amber-500",
    people: [
      { name: "Juliana Castro", role: "Supervisor", cells: mockCells(2) },
      { name: "Rafael Lopes", role: "Patrulha", cells: mockCells(2) },
      { name: "Bruno Teixeira", role: "Patrulha", cells: mockCells(2) },
      { name: "Lucas Moura", role: "Apoio", cells: mockCells(2) },
    ],
  },
  {
    title: "Equipe D",
    accentClass: "bg-rose-600",
    people: [
      { name: "Patricia Rocha", role: "Supervisor", cells: mockCells(3) },
      { name: "Felipe Costa", role: "Patrulha", cells: mockCells(3) },
      { name: "Tiago Mendes", role: "Patrulha", cells: mockCells(3) },
    ],
  },
  {
    title: "Radio Operadores",
    accentClass: "bg-slate-700",
    people: [
      { name: "Radio A", role: "Operador", cells: mockCells(0) },
      { name: "Radio B", role: "Operador", cells: mockCells(1) },
      { name: "Radio C", role: "Operador", cells: mockCells(2) },
      { name: "Radio D", role: "Operador", cells: mockCells(3) },
    ],
  },
];

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

export function ScaleCalendarView() {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Visualizacao do calendario
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Estrutura visual mockada para validar o modelo estilo Excel antes da integracao com os dados reais.
        </p>
      </div>

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
                  className="w-[3rem] min-w-[3rem] border border-slate-300 bg-blue-600 px-2 py-2 text-center font-bold text-white dark:border-slate-700 dark:bg-blue-500"
                >
                  {item.day}
                </th>
              ))}
            </tr>
            <tr>
              {days.map((item) => (
                <th
                  key={`weekday-${item.day}`}
                  className="w-[3rem] min-w-[3rem] border border-slate-300 bg-blue-50 px-2 py-1 text-center font-semibold text-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-200"
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

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <span>
          <strong>1</strong> = 00h-06h
        </span>
        <span>
          <strong>2</strong> = 06h-12h
        </span>
        <span>
          <strong>3</strong> = 12h-18h
        </span>
        <span>
          <strong>4</strong> = 18h-00h
        </span>
        <span>
          <strong>DES</strong> = Descanso
        </span>
      </div>
    </section>
  );
}