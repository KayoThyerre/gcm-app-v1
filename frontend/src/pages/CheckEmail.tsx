import { PublicLayout } from "../layouts/PublicLayout";
import { AuthCard } from "../components/AuthCard";

export function CheckEmail() {
  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
        <AuthCard title="Verifique seu e-mail">
          <p className="text-gray-700 text-sm leading-relaxed">
            Cadastro realizado com sucesso.
            <br />
            Enviamos um link de verificacao para seu e-mail.
            <br />
            Abra sua caixa de entrada para continuar.
          </p>
        </AuthCard>
      </div>
    </PublicLayout>
  );
}
