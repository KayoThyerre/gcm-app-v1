import Navbar from '../../components/public/Navbar'
import NewsSection from '../../components/public/NewsSection'
import MainLayout from '../../layouts/public/MainLayout'
import { PublicLayout } from '../../layouts/PublicLayout'

function News() {
  return (
    <PublicLayout>
      <>
        <div className="bg-slate-950">
          <Navbar />
          <div className="h-20" />
        </div>

        <MainLayout>
          <NewsSection />
        </MainLayout>
      </>
    </PublicLayout>
  )
}

export default News
