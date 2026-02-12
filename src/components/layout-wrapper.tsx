import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </>
  )
}
