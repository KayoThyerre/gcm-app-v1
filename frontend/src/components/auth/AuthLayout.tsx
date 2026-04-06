type AuthLayoutProps = {
  children: React.ReactNode;
  backgroundImage: string;
  containerClassName?: string;
};

export function AuthLayout({
  children,
  backgroundImage,
  containerClassName,
}: AuthLayoutProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-cover bg-center relative ${containerClassName ?? ""}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-blue-500/40" />
      {children}
    </div>
  );
}
