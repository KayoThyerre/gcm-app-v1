import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/public/Navbar'
import { getDefaultImage } from '../../components/public/NewsSection'
import { PublicLayout } from '../../layouts/PublicLayout'
import MainLayout from '../../layouts/public/MainLayout'
import { api } from '../../services/api'

type NewsItem = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function NewsDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNews() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get<NewsItem>(`/news/${id}`)
        setNews(response.data)
      } catch {
        setNews(null)
      } finally {
        setLoading(false)
      }
    }

    void loadNews()
  }, [id])

  return (
    <PublicLayout>
      <>
        <div className="bg-slate-950">
          <Navbar />
          <div className="h-20" />
        </div>

        <MainLayout>
          <section className="bg-blue-50 py-16 dark:bg-slate-900">
            <div className="space-y-8 rounded-xl bg-white p-8 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                ← Voltar
              </button>

              {loading ? (
                <p className="text-slate-600">Carregando...</p>
              ) : null}

              {!loading && !news ? (
                <p className="text-slate-600">Noticia nao encontrada</p>
              ) : null}

              {!loading && news ? (
                <article className="space-y-8">
                  <img
                    src={news.imageUrl || getDefaultImage()}
                    alt={news.title}
                    className="h-[360px] w-full rounded-xl object-cover"
                  />

                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-500">
                      {formatDate(news.createdAt)}
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                      {news.title}
                    </h1>
                    <div className="text-base leading-8 text-slate-600 whitespace-pre-line">
                      {news.content}
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          </section>
        </MainLayout>
      </>
    </PublicLayout>
  )
}

export default NewsDetail

