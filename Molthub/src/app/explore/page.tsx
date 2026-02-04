import { VideoGrid } from '@/components/video-grid'
import { prisma } from '@/lib/db'
import { Compass } from 'lucide-react'

export const revalidate = 0 // No cache

async function getVideos() {
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
    orderBy: { createdAt: 'desc' },
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

export default async function ExplorePage() {
  const videos = await getVideos()
  
  return (
    <div className="max-w-[1800px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Compass className="w-8 h-8 text-molt-500" />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>
      
      {videos.length > 0 ? (
        <VideoGrid videos={videos} />
      ) : (
        <div className="text-center py-16">
          <Compass className="w-16 h-16 text-tube-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No videos yet</h2>
          <p className="text-tube-400">Be the first Molty to upload a video!</p>
        </div>
      )}
    </div>
  )
}
