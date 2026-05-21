import { Outlet } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel"
        description="Visao geral do sistema administrativo."
      />

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <Outlet />
      </div>
    </div>
  );
}
