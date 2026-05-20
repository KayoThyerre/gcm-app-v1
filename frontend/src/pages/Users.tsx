import { useEffect, useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { api } from "../services/api";
import { RequireRole } from "../routes/RequireRole";
import { badgeStyles, tableContainerStyles, tableHeadStyles } from "../styles/ui";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UsersListResponse = {
  data: User[];
};

function getRoleLabel(role: string) {
  if (role === "ADMIN") {
    return "Administrador";
  }

  if (role === "DEV") {
    return "Desenvolvedor";
  }

  if (role === "SUPERVISOR") {
    return "Supervisor";
  }

  return "Usuario";
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get<UsersListResponse>("/users");
        setUsers(response.data.data);
      } finally {
        setLoading(false);
      }
    }

    void fetchUsers();
  }, []);

  return (
    <RequireRole allowedRoles={["ADMIN", "DEV"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Usuarios
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Lista de usuarios cadastrados no sistema
          </p>
        </div>

        <div className="block space-y-3 sm:hidden">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </p>
                  <p className="break-words text-sm text-slate-600 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Cargo
                    </p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status
                    </p>
                    <span className={badgeStyles.active}>Ativo</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {loading ? (
          <FeedbackMessage variant="loading">Carregando usuarios...</FeedbackMessage>
        ) : null}

        {!loading && users.length === 0 ? (
          <FeedbackMessage variant="info">Nenhum usuario cadastrado.</FeedbackMessage>
        ) : null}

        {!loading && users.length > 0 ? (
        <div className={tableContainerStyles}>
          <table className="w-full text-sm text-slate-900 dark:text-slate-100">
            <thead className={tableHeadStyles}>
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  Nome
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  E-mail
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  Cargo
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {getRoleLabel(user.role)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeStyles.active}>Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
