import AboutSection from '../../components/public/AboutSection'
import CarouselSection from '../../components/public/CarouselSection'
import ContactSection from '../../components/public/ContactSection'
import Hero from '../../components/public/Hero'
import Navbar from '../../components/public/Navbar'
import StatsSection from '../../components/public/StatsSection'
import { PublicLayout } from '../../layouts/PublicLayout'

function Home() {
  return (
    <PublicLayout>
      <div className="bg-white text-slate-900 [color-scheme:light]">
        <Navbar />
        <Hero />
        <CarouselSection />
        <AboutSection />
        <StatsSection />
        <ContactSection />
      </div>
    </PublicLayout>
  )
}

export default Home
