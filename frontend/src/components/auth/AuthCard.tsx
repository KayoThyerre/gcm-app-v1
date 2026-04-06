type AuthCardProps = {
  children: React.ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md p-8 rounded-xl shadow-xl bg-white/90 backdrop-blur-md space-y-4 transition-all duration-300 relative z-10">
      {children}
    </div>
  );
}
