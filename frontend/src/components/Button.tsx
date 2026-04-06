type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
    >
      {children}
    </button>
  );
}
