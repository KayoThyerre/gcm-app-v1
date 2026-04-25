import { useNavigate } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthCard } from "../components/AuthCard";

export function CheckEmail() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
        <AuthCard title="Verifique seu e-mail">
          <div className="space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              Cadastro realizado com sucesso.
              <br />
              Enviamos um link de verificacao para seu e-mail.
              <br />
              Abra sua caixa de entrada para continuar.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
            >
              Ir para o login
            </button>
          </div>
        </AuthCard>
      </div>
    </PublicLayout>
  );
}
