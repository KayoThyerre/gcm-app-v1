import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'

type NewsItem = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

type NewsListResponse = {
  data: NewsItem[]
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getSummary(content: string, maxLength: number) {
  if (content.length <= maxLength) {
    return content
  }

  return `${content.slice(0, maxLength).trim()}...`
}

function NewsSection() {
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await api.get<NewsListResponse>('/news')
        setNewsList(response.data.data)
      } finally {
        setLoading(false)
      }
    }

    void loadNews()
  }, [])

  const featured = newsList[0]
  const rest = newsList.slice(1)

  const filteredNews = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()

    if (!normalizedSearchTerm) {
      return rest
    }

    return rest.filter((news) =>
      news.title.toLowerCase().includes(normalizedSearchTerm)
    )
  }, [rest, searchTerm])

  const visibleNews = filteredNews.slice(0, visibleCount)

  if (loading) {
    return (
      <section className="bg-white py-16">
        <div>
          <h2 className="animate-fade-up text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Noticias
          </h2>
          <p className="mt-8 text-slate-600">Carregando...</p>
        </div>
      </section>
    )
  }

  if (!featured) {
    return (
      <section className="bg-white py-16">
        <div>
          <h2 className="animate-fade-up text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Noticias
          </h2>
          <p className="mt-8 text-slate-600">Nenhuma noticia disponivel</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-16">
      <div>
        <h2 className="animate-fade-up text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Noticias
        </h2>

        <article
          className="group relative mt-8 h-[320px] overflow-hidden rounded-xl animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          <img
            src={featured.imageUrl || DEFAULT_IMAGE}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative flex h-full items-end p-6">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-medium text-slate-200">
                {formatDate(featured.createdAt)}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-base">
                {getSummary(featured.content, 220)}
              </p>
            </div>
          </div>
        </article>

        <div className="mt-10 space-y-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar noticia por titulo..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
          />

          {visibleNews.length === 0 ? (
            <p className="text-slate-600">Nenhuma noticia disponivel</p>
          ) : null}

          {visibleNews.map((item, index) => (
            <article
              key={item.id}
              className="animate-fade-up flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row"
              style={{ animationDelay: `${(index + 1) * 120}ms` }}
            >
              <img
                src={item.imageUrl || DEFAULT_IMAGE}
                alt={item.title}
                className="h-28 w-full rounded-lg object-cover sm:w-40"
              />

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">
                  {formatDate(item.createdAt)}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {getSummary(item.content, 160)}
                </p>
              </div>
            </article>
          ))}

          {visibleCount < filteredNews.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((currentCount) => currentCount + 5)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Ver mais
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
