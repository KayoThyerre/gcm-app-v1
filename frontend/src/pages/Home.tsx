import { Outlet } from "react-router-dom";

export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Dashboard
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Visao geral do sistema
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <Outlet />
      </div>
    </div>
  );
}
