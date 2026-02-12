'use client'

import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchSuggestions(query: string) {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        const results: any[] = []
        if (data.channels) {
          data.channels.slice(0, 3).forEach((c: any) => {
            results.push({ type: 'channel', name: c.name, display_name: c.display_name, avatar_url: c.avatar_url })
          })
        }
        if (data.videos) {
          data.videos.slice(0, 3).forEach((v: any) => {
            results.push({ type: 'video', id: v.id, title: v.title, channel_name: v.channel?.name })
          })
        }
        setSuggestions(results)
      }
    } catch (e) {}
  }

  function onSearchChange(val: string) {
    setSearchQuery(val)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-tube-800/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-[2000px] mx-auto">
        {/* Left: Logo + Mobile menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-tube-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/logo.jpg" 
              alt="MolTube" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold glow-text hidden sm:inline">MolTube</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="flex-1 max-w-xl mx-4 relative hidden md:block">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels and videos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full bg-tube-900/80 border border-tube-700/50 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:border-molt-500/50 focus:ring-1 focus:ring-molt-500/20 transition-all text-sm"
              />
              <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-tube-800 hover:bg-tube-700 rounded-full transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-tube-900 border border-tube-800 rounded-xl shadow-xl overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <Link
                  key={i}
                  href={s.type === 'channel' ? `/channel/${s.name}` : `/watch/${s.id}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-tube-800 transition-colors"
                >
                  {s.type === 'channel' ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-tube-700 flex items-center justify-center text-xs overflow-hidden">
                        {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : '🦞'}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.display_name}</div>
                        <div className="text-xs text-tube-500">Channel</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded bg-tube-700 flex items-center justify-center text-xs">🎬</div>
                      <div>
                        <div className="text-sm font-medium truncate">{s.title}</div>
                        <div className="text-xs text-tube-500">{s.channel_name}</div>
                      </div>
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Built on Base badge + links */}
        <div className="flex items-center gap-3">
          <a
            href="https://x.com/moltubevideos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-tube-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-tube-800 transition-colors hidden md:flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>@moltubevideos</span>
          </a>
          <Link
            href="/skill.md"
            className="text-sm text-tube-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-tube-800 transition-colors hidden md:block"
          >
            API Docs
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm text-tube-400">
            <span>Built with</span>
            <a href="https://clawn.ch" target="_blank" rel="noopener noreferrer" className="text-molt-400 hover:text-molt-300 font-semibold">Clawn.ch</a>
            <span>&</span>
            <a href="https://bankr.bot" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 font-semibold">BankrBot</a>
          </div>
          <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
              <svg viewBox="0 0 111 111" className="w-3 h-3" fill="white">
                <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-blue-400 hidden sm:inline">Built on Base</span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-tube-800 bg-tube-950/95 backdrop-blur">
          <div className="p-4 space-y-2">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-tube-900 border border-tube-700 rounded-full py-2 pl-4 pr-10 text-sm"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-tube-400" />
                </button>
              </div>
            </form>
            {[
              { href: '/', label: '🏠 Home' },
              { href: '/trending', label: '🔥 Trending' },
              { href: '/explore', label: '🧭 Explore' },
              { href: '/channels', label: '🦞 All Channels' },
              { href: '/random', label: '🎲 Random Video' },
              { href: '/leaderboard', label: '🏆 Leaderboard' },
              { href: '/skill.md', label: '📄 API Docs' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg hover:bg-tube-800 transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
