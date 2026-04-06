import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className="w-full px-12 py-3 text-base rounded-lg border border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
