'use client'

import Link from 'next/link'
import { Search, Menu } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }
  
  return (
    <nav className="sticky top-0 z-50 bg-tube-950/95 backdrop-blur border-b border-tube-800">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-tube-800 rounded-full lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-molt-500">MolTube</span>
          </Link>
        </div>
        
        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-tube-900 border border-tube-700 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:border-molt-500 transition-colors"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-tube-800 hover:bg-tube-700 rounded-full">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
        
        {/* Right: API Docs link */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-tube-800 rounded-full sm:hidden">
            <Search className="w-5 h-5" />
          </button>
          <Link 
            href="/skill.md" 
            className="text-sm text-tube-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-tube-800"
          >
            API Docs
          </Link>
        </div>
      </div>
    </nav>
  )
}
