import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../hooks/useTheme";
import type { UserRole } from "../types/User";

type SidebarItem = {
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[];
};

const MAIN_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/home",
    icon: "📊",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  { label: "Users", path: "/dashboard/admin/users", icon: "📊", roles: ["ADMIN"] },
  { label: "News", path: "/home/news", icon: "N", roles: ["ADMIN"] },
  { label: "Escalas", path: "/home/scales", icon: "S", roles: ["ADMIN", "DEV"] },
  {
    label: "Scale View",
    path: "/home/scale-view",
    icon: "📅",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Abordagens",
    path: "/home/approaches",
    icon: "👤",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Abordados",
    path: "/home/abordados",
    icon: "🔎",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
];

const SETTINGS_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Profile",
    path: "/settings/profile",
    icon: "🪪",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Security",
    path: "/settings/security",
    icon: "🔒",
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
];

type HeaderAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

export function PrivateLayout() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname === "/settings/profile" ||
      location.pathname === "/settings/security"
  );

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const userAvatarUrl = user?.avatarUrl;
  const isSettingsRoute =
    location.pathname === "/settings/profile" ||
    location.pathname === "/settings/security";

  useEffect(() => {
    if (isSettingsRoute) {
      setSettingsOpen(true);
    }
  }, [isSettingsRoute]);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const headerActions: HeaderAction[] = [
    {
      label: "Sair",
      onClick: handleLogout,
      variant: "danger",
    },
  ];

  function isActive(path: string) {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname.startsWith("/home/");
    }

    return location.pathname.startsWith(path);
  }

  function renderSidebarItems(items: SidebarItem[], itemPaddingClass = "") {
    return items
      .filter((item) => item.roles?.includes((user?.role as UserRole) ?? "USER"))
      .map((item) => {
        const active = isActive(item.path);

        return (
          <div key={item.path} className="relative group">
            <button
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-200 w-full hover:bg-blue-100 hover:translate-x-1 hover:shadow-sm dark:hover:bg-blue-600/20 ${
                active
                  ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-slate-600 dark:text-slate-300"
              } ${itemPaddingClass}`}
            >
              <span>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>

            {sidebarCollapsed && (
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                {item.label}
              </span>
            )}
          </div>
        );
      });
  }

  return (
    <div className="min-h-screen bg-[url('/bg-light.png')] bg-cover bg-center bg-no-repeat dark:bg-[url('/bg-dark.png')]">
      <div className="min-h-screen bg-blue-50/40 dark:bg-black/40 flex flex-col">
        <header className="h-16 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border-b border-blue-200/40 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600 dark:text-slate-300"
            >
              ☰
            </button>

            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Auth Template
            </h1>

            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden md:flex text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
            >
              {sidebarCollapsed ? "➡️" : "⬅️"}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex px-3 py-1 rounded-md cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-700/40 text-sm text-slate-700 dark:text-slate-200"
            >
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings/profile")}
              className="group flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-600/20 sm:gap-3 sm:px-3"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role}
                </p>
              </div>

              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt="Avatar do usuario"
                  className="w-9 h-9 rounded-full object-cover hover:ring-2 hover:ring-blue-400 transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold hover:ring-2 hover:ring-blue-400 transition-transform duration-200 group-hover:scale-105">
                  {userInitial}
                </div>
              )}
            </button>

            <div className="flex items-center gap-2">
              {headerActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`text-sm transition ${
                    action.variant === "danger"
                      ? "text-slate-600 dark:text-slate-400 hover:text-red-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex flex-1 relative">
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 z-20 md:hidden"
            />
          )}

          <aside
            className={`
              fixed z-30 inset-y-0 left-0
              w-72 max-w-[85vw] bg-white/70 dark:bg-slate-950 backdrop-blur-md border-r border-blue-200/40 dark:border-slate-800 px-3 py-5 sm:px-4 sm:py-6
              transform transition-all duration-300
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              md:static md:translate-x-0
              ${sidebarCollapsed ? "md:w-16" : "md:w-60"}
            `}
          >
            <nav className="flex flex-col gap-2">
              {renderSidebarItems(MAIN_SIDEBAR_ITEMS)}

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full cursor-pointer hover:bg-blue-100 hover:translate-x-1 hover:shadow-sm dark:hover:bg-blue-600/20 ${
                    isSettingsRoute
                      ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>⚙️</span>
                    {!sidebarCollapsed && <span>Settings</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <span
                      className={`transition-transform duration-200 ${
                        settingsOpen ? "rotate-90" : "rotate-0"
                      }`}
                    >
                      ▶
                    </span>
                  )}
                </button>

                {sidebarCollapsed && (
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    Settings
                  </span>
                )}
              </div>

              {settingsOpen && renderSidebarItems(SETTINGS_SIDEBAR_ITEMS, "pl-6")}
            </nav>
          </aside>

          <main className="flex-1 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl shadow-blue-900/5 dark:shadow-black/40 border border-blue-200/40 dark:border-slate-700 p-3 h-full sm:p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
