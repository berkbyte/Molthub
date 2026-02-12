import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {children}
        </main>
      </div>
    </>
  )
}
