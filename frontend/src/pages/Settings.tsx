import { RequireRole } from "../routes/RequireRole";
import { useTheme, type Theme } from "../hooks/useTheme";

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
      <div className="space-y-4">
        <p className="text-slate-700 dark:text-slate-300">Configuracoes gerais.</p>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Theme
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["light", "dark"] as Theme[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`px-3 py-1 rounded-md border border-transparent text-sm cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-700/40 ${
                  theme === option
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {option === "light" ? "☀ Light" : "🌙 Dark"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
