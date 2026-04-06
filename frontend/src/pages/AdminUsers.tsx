import { useEffect, useMemo, useState } from "react";
import { approveUser, getUsers, rejectUser } from "../api/users";
import { RequireRole } from "../routes/RequireRole";
import type { User } from "../types/User";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [openDropdownUserId, setOpenDropdownUserId] = useState<string | null>(
    null
  );
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadUsers() {
    try {
      setErrorMessage(null);
      const data = await getUsers();
      setUsers(data);
    } catch {
      setErrorMessage("Nao foi possivel carregar os usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalizedSearchTerm) ||
        user.email.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [searchTerm, users]);

  const pendingUsers = useMemo(
    () => filteredUsers.filter((user) => user.status === "PENDING"),
    [filteredUsers]
  );

  const activeUsers = useMemo(
    () => filteredUsers.filter((user) => user.status === "ACTIVE"),
    [filteredUsers]
  );

  async function handleApprove(userId: string) {
    try {
      setProcessingUserId(userId);
      await approveUser(userId);
      await loadUsers();
    } catch {
      setErrorMessage("Nao foi possivel aprovar o usuario.");
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleReject(userId: string) {
    try {
      setProcessingUserId(userId);
      await rejectUser(userId);
      await loadUsers();
    } catch {
      setErrorMessage("Nao foi possivel recusar o usuario.");
    } finally {
      setProcessingUserId(null);
    }
  }

  function handleOpenDropdown(userId: string) {
    setOpenDropdownUserId((currentId) => (currentId === userId ? null : userId));
  }

  function handleResetPassword(userId: string) {
    console.log("reset password", userId);
    setOpenDropdownUserId(null);
  }

  function handleAskDeactivate(userId: string) {
    setOpenDropdownUserId(null);
    setConfirmUserId(userId);
  }

  async function handleConfirmDeactivate() {
    if (!confirmUserId) {
      return;
    }

    try {
      setProcessingUserId(confirmUserId);
      await rejectUser(confirmUserId);
      setConfirmUserId(null);
      await loadUsers();
    } catch {
      setErrorMessage("Nao foi possivel desativar o usuario.");
    } finally {
      setProcessingUserId(null);
    }
  }

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
      <>
        <div className="max-w-5xl mx-auto p-8 space-y-10">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar usuario por nome ou email..."
              className="w-full border rounded px-4 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Carregando usuarios...</p>
          ) : null}
          {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Usuarios aguardando aprovacao ({pendingUsers.length})
            </h2>

            {!loading && pendingUsers.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">Nenhum usuario pendente.</p>
            ) : null}

            {!loading && pendingUsers.length > 0 ? (
              <div className="w-full border rounded overflow-visible">
                <table className="w-full text-slate-900 dark:text-slate-100">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr className="text-slate-700 dark:text-slate-200">
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Criado em</th>
                      <th className="text-left px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.role}</td>
                        <td className="px-4 py-3 relative">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(user.id)}
                              disabled={processingUserId === user.id}
                              className="bg-green-500 text-white px-3 py-1 rounded cursor-pointer transition hover:bg-green-600 disabled:opacity-60"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(user.id)}
                              disabled={processingUserId === user.id}
                              className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer transition hover:bg-red-600 disabled:opacity-60"
                            >
                              Recusar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Usuarios ativos ({activeUsers.length})
            </h2>

            {!loading && activeUsers.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">Nenhum usuario ativo.</p>
            ) : null}

            {!loading && activeUsers.length > 0 ? (
              <div className="w-full border rounded overflow-visible">
                <table className="w-full text-slate-900 dark:text-slate-100">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr className="text-slate-700 dark:text-slate-200">
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Criado em</th>
                      <th className="text-left px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.role}</td>
                        <td className="px-4 py-3">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 relative">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => handleOpenDropdown(user.id)}
                              className="text-xl leading-none p-2 rounded cursor-pointer transition hover:text-gray-600 dark:hover:text-gray-300"
                              aria-label={`Acoes para ${user.name}`}
                            >
                              ⚙
                            </button>

                            {openDropdownUserId === user.id ? (
                              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-sm min-w-[160px]">
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(user.id)}
                                  className="px-4 py-2 cursor-pointer text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                >
                                  Resetar senha
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAskDeactivate(user.id)}
                                  className="px-4 py-2 cursor-pointer text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                >
                                  Desativar usuario
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>

        {confirmUserId !== null ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-red-600">Atencao</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Voce esta tentando desativar este usuario.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Apos desativado, o usuario nao podera mais acessar o sistema.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmUserId(null)}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 cursor-pointer transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  disabled={processingUserId === confirmUserId}
                  className="px-4 py-2 rounded-md bg-red-600 text-white cursor-pointer transition hover:bg-red-700 disabled:opacity-60"
                >
                  Desativar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    </RequireRole>
  );
}
