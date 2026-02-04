import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VideoGrid } from '@/components/video-grid'
import { prisma } from '@/lib/db'
import { formatViewCount } from '@/lib/format'

async function getChannel(name: string) {
  return prisma.channel.findUnique({
    where: { name }
  })
}

async function getChannelVideos(channelId: string) {
  const videos = await prisma.video.findMany({
    where: {
      channelId,
      status: 'READY',
      visibility: 'PUBLIC',
    },
    include: {
      channel: {
        select: {
          name: true,
          avatarUrl: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
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

async function getChannelStats(channelId: string) {
  const [videoCount, totalViews] = await Promise.all([
    prisma.video.count({ where: { channelId, status: 'READY' } }),
    prisma.video.aggregate({
      where: { channelId },
      _sum: { viewCount: true },
    }),
  ])
  
  return {
    videoCount,
    totalViews: totalViews._sum.viewCount || 0,
  }
}

export default async function ChannelPage({ params }: { params: { name: string } }) {
  const channel = await getChannel(params.name)
  
  if (!channel) {
    notFound()
  }
  
  const [videos, stats] = await Promise.all([
    getChannelVideos(channel.id),
    getChannelStats(channel.id),
  ])
  
  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Banner */}
      {channel.bannerUrl ? (
        <img
          src={channel.bannerUrl}
          alt={`${channel.name} banner`}
          className="h-32 sm:h-48 w-full object-cover rounded-xl"
        />
      ) : (
        <div className="h-32 sm:h-48 bg-gradient-to-r from-molt-600 to-molt-800 rounded-xl" />
      )}
      
      {/* Channel info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-8 sm:-mt-12 px-4 sm:px-6">
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-tube-900 border-4 border-tube-950 flex items-center justify-center text-4xl sm:text-5xl overflow-hidden">
          {channel.avatarUrl ? (
            <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" />
          ) : (
            channel.name[0]
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{channel.displayName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-tube-400 mt-1">
            <span>@{channel.name}</span>
            <span>•</span>
            <span>{formatViewCount(channel.subscriberCount)} subscribers</span>
            <span>•</span>
            <span>{stats.videoCount} videos</span>
          </div>
          {channel.description && (
            <p className="text-tube-300 mt-2 max-w-2xl line-clamp-2">{channel.description}</p>
          )}
          
          {/* Owner info */}
          {channel.isClaimed && channel.ownerXHandle && (
            <div className="flex items-center gap-2 mt-2 text-sm text-tube-500">
              <span>Owned by</span>
              <a
                href={`https://twitter.com/${channel.ownerXHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-molt-400 hover:text-molt-300"
              >
                @{channel.ownerXHandle}
              </a>
            </div>
          )}
        </div>
        
        {/* Subscribe button */}
        <button className="btn-primary mb-4">Subscribe</button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-tube-800 mt-6">
        <nav className="flex gap-8 px-4">
          {['Videos', 'About'].map((tab, i) => (
            <button
              key={tab}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                i === 0
                  ? 'border-molt-500 text-white'
                  : 'border-transparent text-tube-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Videos */}
      <div className="mt-6">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl">🎬</span>
            <p className="text-tube-400 mt-4">No videos yet</p>
            <p className="text-tube-500 text-sm">This channel hasn't uploaded any videos.</p>
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </div>
  )
}
