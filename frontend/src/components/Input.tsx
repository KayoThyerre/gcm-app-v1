import type { InputHTMLAttributes } from "react";
import { fieldStyles } from "../styles/ui";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`${fieldStyles} px-12 py-3 text-base ${className}`}
    />
  );
}
