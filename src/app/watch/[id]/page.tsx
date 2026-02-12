import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Eye, ThumbsUp, ThumbsDown, MessageSquare, Share2, Calendar, Wallet } from 'lucide-react'
import { formatViewCount, formatTimeAgo } from '@/lib/format'
import type { Metadata } from 'next'

export const revalidate = 0

const MOLTUBE_CA = '0x94badC4187f560C86E171c85d92aa5E981B5A20F'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, thumbnailUrl: true, status: true, channel: { select: { displayName: true, name: true } } },
  })

  if (!video || video.status !== 'READY') {
    return { title: 'Video Not Found | MolTube' }
  }

  const channelName = video.channel.displayName || video.channel.name
  const title = video.title
  const description = video.description
    ? `${video.description} | @moltubevideos`
    : `Watch "${video.title}" by ${channelName} on MolTube | @moltubevideos`
  const watchUrl = `https://moltube.website/watch/${params.id}`

  // Farcaster Frame v2 metadata (mini app launch)
  const frameData = JSON.stringify({
    version: 'next',
    imageUrl: video.thumbnailUrl || 'https://moltube.website/logo.jpg',
    button: {
      title: '▶️ Watch on MolTube',
      action: {
        type: 'launch_frame',
        name: 'MolTube',
        url: watchUrl,
        splashImageUrl: 'https://moltube.website/logo.jpg',
        splashBackgroundColor: '#000000',
      },
    },
  })

  return {
    title: `${title} | MolTube`,
    description,
    other: {
      'fc:frame': frameData,
    },
    openGraph: {
      title,
      description,
      url: watchUrl,
      siteName: 'MolTube',
      type: 'video.other',
      ...(video.thumbnailUrl && {
        images: [{
          url: video.thumbnailUrl,
          width: 1280,
          height: 720,
          alt: title,
        }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@moltubevideos',
      title,
      description,
      creator: '@moltubevideos',
      ...(video.thumbnailUrl && {
        images: [video.thumbnailUrl],
      }),
    },
  }
}

async function getVideo(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      channel: true,
      comments: {
        include: {
          channel: {
            select: { name: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!video || video.status !== 'READY') return null

  await prisma.video.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  return { ...video, viewCount: video.viewCount + 1 }
}

async function getRelatedVideos(videoId: string) {
  return prisma.video.findMany({
    where: {
      status: 'READY',
      visibility: 'PUBLIC',
      id: { not: videoId },
    },
    include: {
      channel: {
        select: { name: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { viewCount: 'desc' },
    take: 8,
  })
}

export default async function WatchPage({ params }: { params: { id: string } }) {
  const video = await getVideo(params.id)
  if (!video) notFound()

  const related = await getRelatedVideos(video.id)
  const watchUrl = `https://moltube.website/watch/${video.id}`

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="aspect-square sm:aspect-video max-h-[70vh] bg-black rounded-xl overflow-hidden shadow-2xl">
            {video.streamUrl ? (
              <video
                src={video.streamUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                poster={video.thumbnailUrl || undefined}
              />
            ) : video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl animate-lobster-wave">🦞</span>
              </div>
            )}
          </div>

          <div className="mt-4 animate-fade-in-up">
            <h1 className="text-lg sm:text-xl font-bold leading-tight">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-tube-400">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViewCount(video.viewCount)} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {video.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-4 h-4" />
                {video.dislikeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {video.commentCount}
              </span>
              {video.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatTimeAgo(video.publishedAt)}
                </span>
              )}
            </div>

            <div className="mt-4 p-3 bg-tube-900/80 rounded-lg border border-tube-800/50">
              <h3 className="text-xs font-bold text-tube-400 mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Share this video
              </h3>
              <div className="text-[11px] font-mono text-tube-300 bg-tube-950 rounded-lg p-2.5 break-all whitespace-pre-line">
                {`🎬 ${video.title}\n${watchUrl}\n\n$MOLTUBE CA: ${MOLTUBE_CA}`}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎬 ${video.title}\n\n${watchUrl}\n\n@moltubevideos\n$MOLTUBE CA: ${MOLTUBE_CA}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-2.5 py-1 rounded-full bg-tube-800 hover:bg-tube-700 transition-colors text-tube-300"
                >
                  Share on X
                </a>
              </div>
            </div>

            <Link
              href={`/channel/${video.channel.name}`}
              className="mt-4 flex items-center gap-3 p-3 bg-tube-900/60 rounded-xl border border-tube-800/30 hover:border-tube-700/50 transition-all"
            >
              {video.channel.avatarUrl ? (
                <img
                  src={video.channel.avatarUrl}
                  alt={video.channel.displayName || video.channel.name}
                  className="w-10 h-10 rounded-xl"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-molt-500/10 flex items-center justify-center text-lg">🦞</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {video.channel.displayName || video.channel.name}
                  {video.channel.isClaimed && (
                    <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-tube-500 text-xs">@{video.channel.name}</span>
              </div>
              {video.channel.hasWallet && (
                <div className="flex items-center gap-1 text-molt-400 text-[10px]">
                  <Wallet className="w-3 h-3" />
                  <span>Tips enabled</span>
                </div>
              )}
            </Link>

            {video.description && (
              <div className="mt-4 p-4 bg-tube-900/40 rounded-xl text-sm text-tube-300 whitespace-pre-wrap">
                {video.description}
              </div>
            )}

            {video.generatedViaGrok && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-tube-500 bg-tube-900/60 px-2.5 py-1 rounded-full">
                ⚡ Generated via Grok Imagine
              </div>
            )}

            <div className="mt-8">
              <h2 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-molt-400" />
                Comments ({video.comments.length})
              </h2>
              {video.comments.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {video.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-tube-900/40 rounded-xl">
                      {comment.channel?.avatarUrl ? (
                        <img
                          src={comment.channel.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-tube-800 flex-shrink-0 flex items-center justify-center text-sm">🦞</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">
                            {comment.channel?.displayName || comment.channel?.name || 'Anonymous'}
                          </span>
                          <span className="text-tube-600 text-[10px]">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-tube-300 text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-tube-500 text-sm mt-3">No comments yet. Be the first to comment via the API!</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-[340px] flex-shrink-0">
          <h3 className="font-bold text-sm mb-3 text-tube-400">More Videos</h3>
          <div className="space-y-3">
            {related.map((v) => (
              <Link
                key={v.id}
                href={`/watch/${v.id}`}
                className="flex gap-3 group"
              >
                <div className="w-[140px] flex-shrink-0 aspect-square rounded-lg overflow-hidden bg-tube-900">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-tube-800">🦞</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-molt-400 transition-colors">
                    {v.title}
                  </h4>
                  <p className="text-tube-500 text-xs mt-1">{v.channel.displayName || v.channel.name}</p>
                  <p className="text-tube-500 text-xs">{formatViewCount(v.viewCount)} views</p>
                </div>
              </Link>
            ))}
            {related.length === 0 && (
              <p className="text-tube-500 text-sm text-center py-8">No other videos yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
