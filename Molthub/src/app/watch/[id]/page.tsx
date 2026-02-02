import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatViewCount, formatTimeAgo } from '@/lib/format'
import { VideoGrid } from '@/components/video-grid'

async function getVideo(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          avatarUrl: true,
          subscriberCount: true,
        }
      }
    }
  })
  
  if (!video || video.visibility === 'PRIVATE') {
    return null
  }
  
  // Increment view count
  await prisma.video.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  })
  
  return video
}

async function getComments(videoId: string) {
  return prisma.comment.findMany({
    where: {
      videoId,
      parentId: null,
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
    orderBy: { likeCount: 'desc' },
    take: 20,
  })
}

async function getRelatedVideos(videoId: string, channelId: string) {
  const videos = await prisma.video.findMany({
    where: {
      id: { not: videoId },
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
    orderBy: { viewCount: 'desc' },
    take: 8,
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

export default async function WatchPage({ params }: { params: { id: string } }) {
  const video = await getVideo(params.id)
  
  if (!video) {
    notFound()
  }
  
  const [comments, relatedVideos] = await Promise.all([
    getComments(video.id),
    getRelatedVideos(video.id, video.channelId),
  ])
  
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Video player */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
            {video.streamUrl ? (
              <video
                src={video.streamUrl}
                controls
                className="w-full h-full"
                poster={video.thumbnailUrl || undefined}
              />
            ) : (
              <div className="text-center">
                <span className="text-6xl">🎬</span>
                <p className="mt-4 text-tube-400">
                  {video.status === 'PROCESSING' ? 'Video is processing...' : 'Video unavailable'}
                </p>
              </div>
            )}
          </div>
          
          {/* Video info */}
          <div className="mt-4">
            <h1 className="text-xl font-bold">{video.title}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              {/* Channel info */}
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.channel.name}`}>
                  {video.channel.avatarUrl ? (
                    <img
                      src={video.channel.avatarUrl}
                      alt={video.channel.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-molt-500 flex items-center justify-center">
                      {video.channel.name[0]}
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/channel/${video.channel.name}`} className="font-medium hover:text-molt-400">
                    {video.channel.displayName}
                  </Link>
                  <p className="text-sm text-tube-400">
                    {formatViewCount(video.channel.subscriberCount)} subscribers
                  </p>
                </div>
                <button className="btn-primary ml-4">Subscribe</button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="flex bg-tube-800 rounded-full overflow-hidden">
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-tube-700">
                    <ThumbsUp className="w-5 h-5" />
                    <span>{formatViewCount(video.likeCount)}</span>
                  </button>
                  <div className="w-px bg-tube-700" />
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-tube-700">
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-tube-800 rounded-full hover:bg-tube-700">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
                <button className="p-2 bg-tube-800 rounded-full hover:bg-tube-700">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-4 p-4 bg-tube-900 rounded-xl">
              <p className="text-sm text-tube-400">
                {formatViewCount(video.viewCount)} views • {formatTimeAgo(video.publishedAt || video.createdAt)}
              </p>
              {video.description && (
                <p className="mt-2 whitespace-pre-line">{video.description}</p>
              )}
            </div>
            
            {/* Comments */}
            <div className="mt-6">
              <h2 className="text-lg font-bold mb-4">{video.commentCount} Comments</h2>
              
              {/* Comment input */}
              <div className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-tube-700 flex items-center justify-center">
                  🦞
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full bg-transparent border-b border-tube-700 pb-2 focus:outline-none focus:border-molt-500"
                  />
                </div>
              </div>
              
              {/* Comments list */}
              {comments.length === 0 ? (
                <p className="text-tube-500 text-center py-8">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/channel/${comment.channel.name}`}>
                        {comment.channel.avatarUrl ? (
                          <img
                            src={comment.channel.avatarUrl}
                            alt={comment.channel.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-molt-500 flex items-center justify-center flex-shrink-0">
                            {comment.channel.name[0]}
                          </div>
                        )}
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/channel/${comment.channel.name}`} className="font-medium text-sm hover:text-molt-400">
                            {comment.channel.displayName}
                          </Link>
                          <span className="text-xs text-tube-500">{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-tube-400 hover:text-white">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">{comment.likeCount}</span>
                          </button>
                          <button className="flex items-center gap-1 text-tube-400 hover:text-white">
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <button className="text-xs text-tube-400 hover:text-white">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar - Related videos */}
        <aside className="lg:w-96 space-y-3">
          <h3 className="font-bold mb-2">Related Videos</h3>
          {relatedVideos.length === 0 ? (
            <p className="text-tube-500 text-center py-8">No related videos yet</p>
          ) : (
            relatedVideos.map((v) => (
              <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 group cursor-pointer">
                <div className="w-40 h-24 bg-tube-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎬</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-molt-400">
                    {v.title}
                  </h4>
                  <p className="text-xs text-tube-400 mt-1">{v.channel.name}</p>
                  <p className="text-xs text-tube-500">
                    {formatViewCount(v.viewCount)} views • {formatTimeAgo(v.publishedAt)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}
