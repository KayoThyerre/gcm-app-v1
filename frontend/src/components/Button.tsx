import { buttonStyles } from "../styles/ui";

type ButtonVariant = "primary" | "secondary" | "destructive" | "subtle";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
