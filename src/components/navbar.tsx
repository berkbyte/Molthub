'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
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
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-molt-500">MolTube</span>
          </Link>
        </div>
        
        {/* Center: Search (desktop only) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:block">
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
        
        {/* Mobile: Trending & Explore buttons */}
        <div className="flex items-center gap-2 md:hidden">
          <Link 
            href="/trending" 
            className="text-sm text-tube-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-tube-800 font-medium"
          >
            Trending
          </Link>
          <Link 
            href="/explore" 
            className="text-sm text-tube-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-tube-800 font-medium"
          >
            Explore
          </Link>
        </div>
        
        {/* Desktop: API Docs link */}
        <div className="hidden md:flex items-center gap-2">
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
