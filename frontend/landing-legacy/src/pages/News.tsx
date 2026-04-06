import Navbar from '../components/Navbar'
import NewsSection from '../components/NewsSection'
import MainLayout from '../layouts/MainLayout'

function News() {
  return (
    <>
      <div className="bg-slate-950">
        <Navbar />
        <div className="h-20" />
      </div>

      <MainLayout>
        <NewsSection />
      </MainLayout>
    </>
  )
}

export default News
