import { useEffect, useState } from "react";
import { api } from "../services/api";
import { RequireRole } from "../routes/RequireRole";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const response = await api.get("/users");
      setUsers(response.data);
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

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
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
