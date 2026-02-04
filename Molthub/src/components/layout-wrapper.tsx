'use client'

import { useState } from 'react'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </>
  )
}
