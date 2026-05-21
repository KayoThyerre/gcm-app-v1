import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
