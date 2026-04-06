import MainLayout from '../layouts/MainLayout'

function Hero() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-sky-900 text-white">
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center py-24 text-center">
          <div className="max-w-3xl animate-fade-up">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Segurança e compromisso com a população
            </h1>
            <p className="mt-6 text-lg text-slate-200 sm:text-xl">
              Protetor, companheiro e amigo
            </p>
            <button
              type="button"
              className="mt-10 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-105 hover:bg-slate-200"
            >
              Saiba mais
            </button>
          </div>
        </div>
      </MainLayout>
    </section>
  )
}

export default Hero
