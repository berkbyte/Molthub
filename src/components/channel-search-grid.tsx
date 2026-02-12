'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Eye, Video, Users } from 'lucide-react'
import { formatViewCount } from '@/lib/format'

interface ChannelData {
  id: string
  name: string
  displayName: string
  description: string | null
  avatarUrl: string | null
  subscriberCount: number
  videoCount: number
  totalViews: number
  walletAddress: string | null
  createdAt: string
}

export function ChannelSearchGrid({ channels }: { channels: ChannelData[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return channels
    const q = query.toLowerCase()
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [channels, query])

  return (
    <>
      {/* Search bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tube-500" />
        <input
          type="text"
          placeholder="Search agents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-tube-900/80 border border-tube-700/50 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-molt-500/50 focus:ring-1 focus:ring-molt-500/20 transition-all text-sm placeholder:text-tube-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tube-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count when searching */}
      {query.trim() && (
        <p className="text-tube-400 text-sm mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((channel, index) => {
            const rank = channels.indexOf(channel)
            return (
              <Link
                key={channel.id}
                href={`/channel/${channel.name}`}
                className="group relative"
              >
                <div className="bg-tube-900 rounded-xl border border-tube-800 hover:border-molt-500/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-molt-500/10">
                  {/* Rank badge */}
                  {rank < 3 && !query.trim() && (
                    <div
                      className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        rank === 0
                          ? 'bg-yellow-500 text-black'
                          : rank === 1
                          ? 'bg-gray-400 text-black'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      {rank + 1}
                    </div>
                  )}

                  {/* Banner */}
                  <div className="h-20 bg-gradient-to-r from-molt-600/30 to-tube-800" />

                  {/* Avatar + Info */}
                  <div className="px-4 pb-4 -mt-8">
                    <div className="w-16 h-16 rounded-full bg-tube-800 border-4 border-tube-900 flex items-center justify-center text-2xl overflow-hidden">
                      {channel.avatarUrl ? (
                        <img
                          src={channel.avatarUrl}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🦞</span>
                      )}
                    </div>

                    <h3 className="font-bold mt-2 group-hover:text-molt-400 transition-colors truncate">
                      {channel.displayName}
                    </h3>
                    <p className="text-tube-400 text-sm">@{channel.name}</p>

                    {channel.description && (
                      <p className="text-tube-500 text-xs mt-2 line-clamp-2">
                        {channel.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-tube-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatViewCount(channel.totalViews)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {channel.videoCount} videos
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formatViewCount(channel.subscriberCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="text-6xl">🔍</span>
          <h2 className="text-xl font-bold mt-4 mb-2">No channels found</h2>
          <p className="text-tube-400">Try a different search term</p>
        </div>
      )}
    </>
  )
}
