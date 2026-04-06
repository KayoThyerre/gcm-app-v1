import MainLayout from '../layouts/MainLayout'

type CarouselItemType = 'ocorrencia' | 'noticia'

type CarouselItem = {
  id: number
  title: string
  description: string
  image: string
  type: CarouselItemType
}

const items: CarouselItem[] = [
  {
    id: 1,
    title: 'Atendimento preventivo em area escolar',
    description: 'Acoes de monitoramento reforcam a seguranca de estudantes e familias.',
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    type: 'ocorrencia',
  },
  {
    id: 2,
    title: 'Nova base comunitaria amplia cobertura',
    description: 'Estrutura fortalece o atendimento em bairros com grande circulacao.',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    type: 'noticia',
  },
  {
    id: 3,
    title: 'Patrulhamento intensificado em areas publicas',
    description: 'Presenca estrategica contribui para ordem e acolhimento da populacao.',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    type: 'ocorrencia',
  },
  {
    id: 4,
    title: 'Projeto educativo aproxima GCM da comunidade',
    description: 'Encontros promovem orientacao, cidadania e dialogo com moradores.',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    type: 'noticia',
  },
]

const itemTypeLabel: Record<CarouselItemType, string> = {
  ocorrencia: 'Ocorrência',
  noticia: 'Notícia',
}

function CarouselSection() {
  return (
    <section className="bg-slate-950 py-16 text-white">
      <MainLayout>
        <div>
          <h2 className="animate-fade-up text-3xl font-semibold tracking-tight sm:text-4xl">
            Ocorrências e Notícias
          </h2>

          <div className="mt-8 overflow-x-auto pb-2">
            <div className="flex gap-6">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group relative h-[220px] w-[300px] shrink-0 overflow-hidden rounded-xl animate-fade-up"
                  style={{ animationDelay: `${item.id * 120}ms` }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                  />
                  <div className="absolute inset-0 bg-black/50" />

                  <div className="relative flex h-full items-end p-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                        {itemTypeLabel[item.type]}
                      </span>
                      <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-200">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    </section>
  )
}

export default CarouselSection
