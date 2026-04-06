import MainLayout from '../layouts/MainLayout'

type StatItem = {
  id: number
  value: string
  label: string
  icon: string
}

const stats: StatItem[] = [
  {
    id: 1,
    value: '+1.250',
    label: 'Ocorrências atendidas',
    icon: '🚓',
  },
  {
    id: 2,
    value: '+320',
    label: 'Ações preventivas realizadas',
    icon: '🛡️',
  },
  {
    id: 3,
    value: '+85',
    label: 'Operações integradas',
    icon: '🤝',
  },
  {
    id: 4,
    value: '24h',
    label: 'Atuação em apoio à população',
    icon: '⏱️',
  },
]

function StatsSection() {
  return (
    <section className="bg-slate-50 py-16">
      <MainLayout>
        <div>
          <h2 className="animate-fade-up text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Transparência em números
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.id}
                className="animate-fade-up rounded-xl bg-white p-6 text-center shadow-md"
                style={{ animationDelay: `${stat.id * 120}ms` }}
              >
                <div className="text-4xl">{stat.icon}</div>
                <div className="mt-4 text-3xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </MainLayout>
    </section>
  )
}

export default StatsSection
