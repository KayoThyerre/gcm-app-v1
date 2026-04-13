import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/public/MainLayout'
import { api } from '../../services/api'
import { getDefaultImage, getPreview } from './NewsSection'

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

function CarouselSection() {
  const navigate = useNavigate()
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

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

  const visibleNews = useMemo(() => {
    return [...newsList]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
  }, [newsList])

  return (
    <section className="bg-slate-950 py-16 text-white">
      <MainLayout>
        <div>
          <h2 className="animate-fade-up text-3xl font-semibold tracking-tight sm:text-4xl">
            Ultimas noticias
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Acompanhe as acoes, operacoes e atualizacoes mais recentes da GCM.
          </p>

          {loading ? <p className="mt-8 text-slate-300">Carregando...</p> : null}

          {!loading && visibleNews.length === 0 ? (
            <p className="mt-8 text-slate-300">Nenhuma noticia disponivel no momento.</p>
          ) : null}

          {!loading && visibleNews.length > 0 ? (
            <div className="mt-8 overflow-x-auto pb-2">
              <div className="flex gap-6">
                {visibleNews.map((item, index) => {
                  const imageSrc = item.imageUrl || getDefaultImage()

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/noticias/${item.id}`)}
                      className="group relative h-[220px] w-[300px] shrink-0 cursor-pointer overflow-hidden rounded-xl animate-fade-up"
                      style={{ animationDelay: `${(index + 1) * 120}ms` }}
                    >
                      <img
                        src={imageSrc}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                      />
                      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

                      <div className="relative flex h-full items-end p-4">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                            Noticia
                          </span>
                          <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            {getPreview(item.content)}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </MainLayout>
    </section>
  )
}

export default CarouselSection
