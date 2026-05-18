import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../hooks/useTheme";
import type { UserRole } from "../types/User";

type SidebarItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

const MAIN_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Painel",
    path: "/home",
    icon: BarChart3,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Usuários",
    path: "/dashboard/admin/users",
    icon: Users,
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Notícias",
    path: "/home/news",
    icon: Newspaper,
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Escalas",
    path: "/home/scales",
    icon: CalendarDays,
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Consultar escala",
    path: "/home/scale-view",
    icon: ClipboardList,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Abordagens",
    path: "/home/approaches",
    icon: User,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Abordados",
    path: "/home/abordados",
    icon: Search,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
];

const SETTINGS_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Perfil",
    path: "/settings/profile",
    icon: User,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
  {
    label: "Segurança",
    path: "/settings/security",
    icon: ShieldCheck,
    roles: ["ADMIN", "USER", "SUPERVISOR", "DEV"],
  },
];

type HeaderAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: LucideIcon;
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
      icon: LogOut,
    },
  ];

  function handleNavigate(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  function isActive(path: string) {
    if (path === "/home") {
      return location.pathname === "/home";
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function renderSidebarItems(items: SidebarItem[], itemPaddingClass = "") {
    return items
      .filter((item) => item.roles?.includes((user?.role as UserRole) ?? "USER"))
      .map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        return (
          <div key={item.path} className="group relative">
            <button
              type="button"
              onClick={() => handleNavigate(item.path)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 ${
                active
                  ? "bg-blue-50 font-medium text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900/60"
                  : "text-slate-600 dark:text-slate-300"
              } ${itemPaddingClass}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>

            {sidebarCollapsed && (
              <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </div>
        );
      });
  }

  return (
    <div className="min-h-screen bg-[url('/bg-light.png')] bg-cover bg-center bg-no-repeat dark:bg-[url('/bg-dark.png')]">
      <div className="flex min-h-screen flex-col bg-blue-50/40 dark:bg-black/40">
        <header className="flex h-16 items-center justify-between border-b border-blue-200/50 bg-white/80 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-900/20">
                GCM
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
                  Sistema Administrativo
                </h1>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Guarda Civil Municipal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
              aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:inline-flex"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  Tema claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  Tema escuro
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/settings/profile")}
              className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 sm:gap-3 sm:px-3"
            >
              <div className="hidden text-right sm:block">
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
                  className="h-9 w-9 rounded-full object-cover transition-transform duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-400"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-transform duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-400">
                  {userInitial}
                </div>
              )}
            </button>

            <div className="flex items-center gap-2">
              {headerActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition sm:px-3 ${
                      action.variant === "danger"
                        ? "text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"
                    }`}
                  >
                    {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="relative flex flex-1">
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-20 bg-black/30 md:hidden"
              aria-label="Fechar menu"
            />
          )}

          <aside
            className={`
              fixed inset-y-0 left-0 z-30
              w-72 max-w-[85vw] border-r border-blue-200/50 bg-white/85 px-3 py-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-4 sm:py-6
              transform transition-all duration-300
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              md:static md:translate-x-0
              ${sidebarCollapsed ? "md:w-16" : "md:w-60"}
            `}
          >
            <nav className="flex flex-col gap-5">
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Navegação
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {renderSidebarItems(MAIN_SIDEBAR_ITEMS)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 ${
                      isSettingsRoute
                        ? "bg-blue-50 font-medium text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900/60"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!sidebarCollapsed && <span>Configurações</span>}
                    </span>
                    {!sidebarCollapsed && (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          settingsOpen ? "rotate-90" : "rotate-0"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {sidebarCollapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                      Configurações
                    </span>
                  )}
                </div>

                {settingsOpen ? (
                  <div className="flex flex-col gap-1">
                    {renderSidebarItems(SETTINGS_SIDEBAR_ITEMS, sidebarCollapsed ? "" : "pl-6")}
                  </div>
                ) : null}
              </div>
            </nav>
          </aside>

          <main className="min-w-0 flex-1 p-3 sm:p-6">
            <div className="mx-auto min-w-0 max-w-7xl">
              <div className="h-full rounded-lg border border-blue-200/40 bg-white p-3 shadow-xl shadow-blue-900/5 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/40 sm:p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
