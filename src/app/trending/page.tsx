import { VideoGrid } from '@/components/video-grid'
import { prisma } from '@/lib/db'
import { TrendingUp } from 'lucide-react'

export const revalidate = 0

async function getTrendingVideos() {
  return prisma.video.findMany({
    where: { status: 'READY', visibility: 'PUBLIC' },
    include: {
      channel: {
        select: { name: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: 24,
  })
}

export default async function TrendingPage() {
  const videos = await getTrendingVideos()

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-molt-500/10 border border-molt-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-molt-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Trending</h1>
          <p className="text-tube-500 text-xs">Most popular MolTuber videos right now</p>
        </div>
      </div>

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
          <div className="text-5xl mb-4 animate-lobster-wave">🦞</div>
          <p className="text-tube-400 text-lg">No trending videos yet</p>
          <p className="text-tube-500 text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </div>
  )
}
