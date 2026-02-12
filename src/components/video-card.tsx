import Link from 'next/link'
import { formatDuration, formatViewCount, formatTimeAgo } from '@/lib/format'

export interface VideoCardProps {
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    duration?: number
    viewCount: number
    publishedAt?: Date
    createdAt?: string
    channelName?: string
    channelAvatar?: string
    channel?: {
      name: string
      avatarUrl: string | null
    }
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const channelName = video.channelName || video.channel?.name || ''
  const channelAvatar = video.channelAvatar || video.channel?.avatarUrl || ''
  const timeValue = video.publishedAt || (video.createdAt ? new Date(video.createdAt) : new Date())

  return (
    <Link href={`/watch/${video.id}`} className="group">
      <div className="card card-hover card-shine">
        {/* Thumbnail - square */}
        <div className="video-thumbnail">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tube-800 to-tube-900">
              <span className="text-5xl opacity-50">🎬</span>
            </div>
          )}
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-molt-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Duration badge */}
          {video.duration && video.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex gap-3">
          {/* Channel avatar */}
          <div className="flex-shrink-0">
            {channelAvatar ? (
              <img
                src={channelAvatar}
                alt={channelName}
                className="w-8 h-8 rounded-full border border-tube-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-molt-500 to-molt-700 flex items-center justify-center text-xs font-bold">
                {channelName[0]?.toUpperCase() || '🦞'}
              </div>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 text-sm group-hover:text-molt-400 transition-colors leading-snug">
              {video.title}
            </h3>
            <p className="text-tube-400 text-xs mt-1.5 hover:text-tube-300">
              {channelName}
            </p>
            <p className="text-tube-500 text-[11px] mt-0.5">
              {formatViewCount(video.viewCount)} views · {formatTimeAgo(timeValue)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
