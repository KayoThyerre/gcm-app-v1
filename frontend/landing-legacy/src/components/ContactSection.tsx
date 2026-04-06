import { AtSign, Globe, Phone } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'

function ContactSection() {
  return (
    <section className="bg-slate-950 py-16 text-white">
      <MainLayout>
        <div>
          <h2 className="animate-fade-up text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Contato
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <article
              className="animate-fade-up rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              style={{ animationDelay: '120ms' }}
            >
              <h3 className="text-lg font-semibold">GCM</h3>
              <div className="mt-4 space-y-3 text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>Ligue 153</span>
                </div>
              </div>
            </article>

            <article
              className="animate-fade-up rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              style={{ animationDelay: '240ms' }}
            >
              <h3 className="text-lg font-semibold">Prefeitura</h3>
              <div className="mt-4 space-y-3 text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>Ligue (99) 1212-3434</span>
                </div>
              </div>
            </article>

            <article
              className="animate-fade-up rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              style={{ animationDelay: '360ms' }}
            >
              <h3 className="text-lg font-semibold">Nossas redes</h3>
              <div className="mt-4 space-y-3 text-gray-300">
                <a
                  href="#"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <AtSign size={18} />
                  <span>Instagram GCM</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <AtSign size={18} />
                  <span>Instagram Prefeitura</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <Globe size={18} />
                  <span>Site Prefeitura</span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </MainLayout>
    </section>
  )
}

export default ContactSection
