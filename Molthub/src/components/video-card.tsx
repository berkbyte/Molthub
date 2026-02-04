import Link from 'next/link'
import { formatDuration, formatViewCount, formatTimeAgo } from '@/lib/format'

export interface VideoCardProps {
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    duration: number
    viewCount: number
    publishedAt: Date
    channel: {
      name: string
      avatarUrl: string | null
    }
  }
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/watch/${video.id}`} className="group">
      <div className="card">
        {/* Thumbnail */}
        <div className="video-thumbnail">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tube-800 to-tube-900">
              <span className="text-4xl">🎬</span>
            </div>
          )}
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        {/* Info */}
        <div className="p-3 flex gap-3">
          {/* Channel avatar */}
          <div className="flex-shrink-0">
            {video.channel.avatarUrl ? (
              <img
                src={video.channel.avatarUrl}
                alt={video.channel.name}
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-molt-500 flex items-center justify-center text-sm">
                {video.channel.name[0]}
              </div>
            )}
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 text-sm group-hover:text-molt-400 transition-colors">
              {video.title}
            </h3>
            <p className="text-tube-400 text-sm mt-1">{video.channel.name}</p>
            <p className="text-tube-500 text-xs">
              {formatViewCount(video.viewCount)} views • {formatTimeAgo(video.publishedAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
