import { Link, NavLink } from 'react-router-dom'

const menuItems = [
  { label: 'Home', to: '/' },
  { label: 'Notícias', to: '/noticias' },
]

function Navbar() {
  return (
    <header className="absolute top-0 left-0 z-10 w-full border-b border-white/20 bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-lg font-semibold uppercase tracking-[0.3em] text-white"
        >
          GCM
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-3 text-xs font-medium text-white sm:gap-6 sm:text-sm">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'border-b border-transparent pb-1 transition-all duration-300 hover:border-white/60 hover:text-white',
                        isActive ? 'font-semibold text-white' : 'text-gray-300',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:brightness-110"
          >
            Entrar
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
