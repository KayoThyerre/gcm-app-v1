import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type FeedbackVariant = "success" | "error" | "warning" | "info" | "loading";

type FeedbackMessageProps = {
  variant?: FeedbackVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<
  FeedbackVariant,
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200",
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200",
  },
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200",
  },
  loading: {
    icon: LoaderCircle,
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
  },
};

export function FeedbackMessage({
  variant = "info",
  title,
  children,
  className = "",
}: FeedbackMessageProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={`flex gap-3 rounded-lg border px-3 py-2 text-sm leading-5 ${styles.className} ${className}`}
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${variant === "loading" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
