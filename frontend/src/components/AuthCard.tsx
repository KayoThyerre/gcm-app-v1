type AuthCardProps = {
  title: string;
  children: React.ReactNode;
};

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-blue-600 text-center mb-6">
        {title}
      </h1>

      {children}
    </div>
  );
}
