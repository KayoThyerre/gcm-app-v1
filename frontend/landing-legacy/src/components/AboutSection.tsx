import MainLayout from '../layouts/MainLayout'

function AboutSection() {
  return (
    <section className="bg-white py-16">
      <MainLayout>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="animate-fade-up">
            <img
              src="/sobre-nos.jpg"
              alt="Guarda Civil Municipal em atuação"
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Quem Somos
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
              <p>
                A Guarda Civil Municipal atua na proteção dos bens, serviços e
                instalações públicas, desempenhando um papel essencial na
                promoção da segurança e da ordem na cidade.
              </p>
              <p>
                Mais do que presença ostensiva, a GCM exerce uma atuação
                preventiva e comunitária, aproximando-se da população e
                contribuindo para a construção de um ambiente mais seguro e
                acolhedor.
              </p>
              <p>
                Fundamentada nos princípios da Lei 13.022, a instituição
                trabalha diariamente na prevenção da violência, no apoio às
                forças de segurança e na proteção dos cidadãos, sempre pautada
                pelo compromisso com a sociedade.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </section>
  )
}

export default AboutSection
