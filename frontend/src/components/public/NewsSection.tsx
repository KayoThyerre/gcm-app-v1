type NewsItem = {
  id: number
  title: string
  description: string
  date: string
  image: string
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: 'GCM reforça patrulhamento preventivo em áreas centrais',
    description:
      'A operação amplia a presença em pontos estratégicos e fortalece a sensação de segurança para comerciantes, moradores e visitantes.',
    date: '26 Mar 2026',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 2,
    title: 'Programa comunitário aproxima agentes e lideranças locais',
    description:
      'Encontros periódicos passam a discutir demandas do território e ações preventivas em parceria com a população.',
    date: '22 Mar 2026',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 3,
    title: 'Ação integrada intensifica proteção no entorno escolar',
    description:
      'A iniciativa reúne monitoramento e orientação para garantir mais tranquilidade nos horários de entrada e saída.',
    date: '19 Mar 2026',
    image:
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 4,
    title: 'Nova frente educativa leva cidadania a espaços públicos',
    description:
      'Atividades informativas orientam a comunidade sobre prevenção, convivência e uso seguro dos equipamentos urbanos.',
    date: '15 Mar 2026',
    image:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80',
  },
]

const [featuredNews, ...otherNews] = newsItems

function NewsSection() {
  return (
    <section className="bg-white py-16">
      <div>
        <h2 className="animate-fade-up text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Notícias
        </h2>

        <article
          className="group relative mt-8 h-[320px] overflow-hidden rounded-xl animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          <img
            src={featuredNews.image}
            alt={featuredNews.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative flex h-full items-end p-6">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-medium text-slate-200">
                {featuredNews.date}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {featuredNews.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-base">
                {featuredNews.description}
              </p>
            </div>
          </div>
        </article>

        <div className="mt-10 space-y-6">
          {otherNews.map((item) => (
            <article
              key={item.id}
              className="animate-fade-up flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row"
              style={{ animationDelay: `${item.id * 120}ms` }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-28 w-full rounded-lg object-cover sm:w-40"
              />

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">{item.date}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
