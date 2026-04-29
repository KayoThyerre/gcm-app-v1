import { useEffect, useState } from "react";
import { api } from "../services/api";
import { RequireRole } from "../routes/RequireRole";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UsersListResponse = {
  data: User[];
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const response = await api.get<UsersListResponse>("/users");
      setUsers(response.data.data);
    }

    void fetchUsers();
  }, []);

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
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
                      {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status
                    </p>
                    <p className="font-medium text-green-600">Ativo</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 sm:block">
          <table className="w-full text-sm text-slate-900 dark:text-slate-100">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
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
                    {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-600 font-medium">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireRole>
  );
}
