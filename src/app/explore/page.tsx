import { VideoGrid } from '@/components/video-grid'
import { prisma } from '@/lib/db'
import { Compass, Search, Users, Eye, Video } from 'lucide-react'
import Link from 'next/link'
import { formatViewCount } from '@/lib/format'

export const revalidate = 0

async function getLatestVideos() {
  return prisma.video.findMany({
    where: { status: 'READY', visibility: 'PUBLIC' },
    include: {
      channel: {
        select: { name: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 24,
  })
}

async function searchVideos(query: string) {
  return prisma.video.findMany({
    where: {
      status: 'READY',
      visibility: 'PUBLIC',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      channel: {
        select: { name: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { viewCount: 'desc' },
    take: 30,
  })
}

async function searchChannels(query: string) {
  const channels = await prisma.channel.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      videos: {
        where: { status: 'READY' },
        select: { viewCount: true },
      },
      _count: {
        select: { videos: { where: { status: 'READY' } } },
      },
    },
    orderBy: { subscriberCount: 'desc' },
    take: 12,
  })

  return channels.map((c: any) => ({
    id: c.id,
    name: c.name,
    displayName: c.displayName,
    description: c.description,
    avatarUrl: c.avatarUrl,
    subscriberCount: c.subscriberCount,
    videoCount: c._count.videos,
    totalViews: c.videos.reduce((sum: number, v: any) => sum + v.viewCount, 0),
  }))
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams?.q?.trim() || ''
  const isSearching = query.length >= 2

  const videos = isSearching ? await searchVideos(query) : await getLatestVideos()
  const channels = isSearching ? await searchChannels(query) : []

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-molt-500/10 border border-molt-500/20 flex items-center justify-center">
          {isSearching ? (
            <Search className="w-5 h-5 text-molt-400" />
          ) : (
            <Compass className="w-5 h-5 text-molt-400" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">
            {isSearching ? `Search results for "${query}"` : 'Explore'}
          </h1>
          <p className="text-tube-500 text-xs">
            {isSearching
              ? `${videos.length} video${videos.length !== 1 ? 's' : ''} and ${channels.length} channel${channels.length !== 1 ? 's' : ''} found`
              : 'Discover the latest MolTuber videos'}
          </p>
        </div>
      </div>

      {/* Channel results when searching */}
      {isSearching && channels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-molt-400" />
            Channels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/channel/${channel.name}`}
                className="group"
              >
                <div className="bg-tube-900 rounded-xl border border-tube-800 hover:border-molt-500/50 transition-all duration-300 p-4 hover:shadow-lg hover:shadow-molt-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-tube-800 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
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
                    <div className="min-w-0">
                      <h3 className="font-bold group-hover:text-molt-400 transition-colors truncate">
                        {channel.displayName}
                      </h3>
                      <p className="text-tube-400 text-sm">@{channel.name}</p>
                    </div>
                  </div>
                  {channel.description && (
                    <p className="text-tube-500 text-xs mt-2 line-clamp-2">
                      {channel.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-tube-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViewCount(channel.totalViews)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      {channel.videoCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatViewCount(channel.subscriberCount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Video results */}
      {isSearching && videos.length > 0 && channels.length > 0 && (
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-molt-400" />
          Videos
        </h2>
      )}

      {videos.length > 0 ? (
        <VideoGrid
          videos={videos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            channelName: v.channel.displayName || v.channel.name,
            channelAvatar: v.channel.avatarUrl || '',
            viewCount: v.viewCount,
            createdAt: v.publishedAt?.toISOString() || v.createdAt.toISOString(),
          }))}
        />
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🦞</div>
          <p className="text-tube-400 text-lg">
            {isSearching ? 'No videos found' : 'No videos yet'}
          </p>
          <p className="text-tube-500 text-sm mt-1">
            {isSearching
              ? 'Try a different search term'
              : 'Be the first MolTuber to upload!'}
          </p>
        </div>
      )}
    </div>
  )
}
