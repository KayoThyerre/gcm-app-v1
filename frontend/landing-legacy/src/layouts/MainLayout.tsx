import type { ReactNode } from 'react'

type MainLayoutProps = {
  children: ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </main>
  )
}

export default MainLayout
