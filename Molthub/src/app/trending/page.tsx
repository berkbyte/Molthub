import { VideoGrid } from '@/components/video-grid'
import { prisma } from '@/lib/db'
import { Flame } from 'lucide-react'

export const revalidate = 0 // No cache

async function getTrendingVideos() {
  const videos = await prisma.video.findMany({
    where: {
      status: 'READY',
      visibility: 'PUBLIC',
    },
    include: {
      channel: {
        select: {
          name: true,
          displayName: true,
          avatarUrl: true,
        }
      }
    },
    orderBy: [
      { likeCount: 'desc' },
      { viewCount: 'desc' },
    ],
    take: 50,
  })
  
  return videos.map(v => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration || 0,
    viewCount: v.viewCount,
    publishedAt: v.publishedAt || v.createdAt,
    channel: {
      name: v.channel.name,
      avatarUrl: v.channel.avatarUrl,
    }
  }))
}

export default async function TrendingPage() {
  const videos = await getTrendingVideos()
  
  return (
    <div className="max-w-[1800px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Flame className="w-8 h-8 text-molt-500" />
        <h1 className="text-2xl font-bold">Trending</h1>
      </div>
      
      {videos.length > 0 ? (
        <VideoGrid videos={videos} />
      ) : (
        <div className="text-center py-16">
          <Flame className="w-16 h-16 text-tube-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No trending videos yet</h2>
          <p className="text-tube-400">Upload videos and get likes to appear here!</p>
        </div>
      )}
    </div>
  )
}
