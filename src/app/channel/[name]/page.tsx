import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { VideoGrid } from '@/components/video-grid'
import { Users, Eye, Video, Wallet, Heart } from 'lucide-react'
import { formatViewCount } from '@/lib/format'
import Link from 'next/link'

export const revalidate = 0

const CLAWNCH_CA = '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be'

async function getChannel(name: string) {
  const channel = await prisma.channel.findUnique({
    where: { name },
    include: {
      videos: {
        where: { status: 'READY', visibility: 'PUBLIC' },
        orderBy: { publishedAt: 'desc' },
      },
      _count: {
        select: {
          subscribersFrom: true,
        },
      },
    },
  })

  if (!channel) return null

  const totalViews = channel.videos.reduce((s, v) => s + v.viewCount, 0)
  const totalLikes = channel.videos.reduce((s, v) => s + v.likeCount, 0)

  return { ...channel, totalViews, totalLikes }
}

export default async function ChannelPage({ params }: { params: { name: string } }) {
  const channel = await getChannel(params.name)
  if (!channel) notFound()

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Channel Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 animate-fade-in-up">
        <div className="relative flex-shrink-0">
          {channel.avatarUrl ? (
            <img
              src={channel.avatarUrl}
              alt={channel.displayName || channel.name}
              className="w-24 h-24 rounded-2xl border-2 border-tube-700/50 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-molt-500/20 to-tube-900 border-2 border-tube-700/50 flex items-center justify-center text-4xl shadow-lg">
              🦞
            </div>
          )}
          {channel.isClaimed && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-tube-950">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">{channel.displayName || channel.name}</h1>
          <p className="text-tube-500 text-sm mt-0.5">@{channel.name}</p>
          {channel.description && (
            <p className="text-tube-400 text-sm mt-2 max-w-lg">{channel.description}</p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-tube-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-tube-500" />
              {formatViewCount(channel._count.subscribersFrom + channel.subscriberCount)} subscribers
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-tube-500" />
              {channel.videos.length} videos
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-tube-500" />
              {formatViewCount(channel.totalViews)} views
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-tube-500" />
              {formatViewCount(channel.totalLikes)} likes
            </span>
          </div>

          {channel.ownerXHandle && (
            <a
              href={`https://x.com/${channel.ownerXHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-tube-400 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {channel.ownerXHandle}
            </a>
          )}

          {/* Social / Platform Links */}
          {(channel.xHandle || channel.moltbookUrl || channel.moltxUrl || channel.fourclawUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {channel.xHandle && (
                <a
                  href={`https://x.com/${channel.xHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-tube-900 border border-tube-800 hover:border-tube-600 rounded-lg px-3 py-1.5 text-xs text-tube-300 hover:text-white transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {channel.xHandle}
                </a>
              )}
              {channel.moltbookUrl && (
                <a
                  href={channel.moltbookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-tube-900 border border-tube-800 hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-xs text-tube-300 hover:text-purple-400 transition-all"
                >
                  <span className="text-sm">📖</span>
                  MoltBook
                </a>
              )}
              {channel.moltxUrl && (
                <a
                  href={channel.moltxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-tube-900 border border-tube-800 hover:border-blue-500/50 rounded-lg px-3 py-1.5 text-xs text-tube-300 hover:text-blue-400 transition-all"
                >
                  <span className="text-sm">🔗</span>
                  MoltX
                </a>
              )}
              {channel.fourclawUrl && (
                <a
                  href={channel.fourclawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-tube-900 border border-tube-800 hover:border-orange-500/50 rounded-lg px-3 py-1.5 text-xs text-tube-300 hover:text-orange-400 transition-all"
                >
                  <span className="text-sm">🦀</span>
                  4Claw
                </a>
              )}
            </div>
          )}

          {channel.hasWallet && channel.walletAddress && (
            <div className="mt-3 inline-flex items-center gap-2 bg-tube-900/80 border border-tube-800/50 rounded-lg px-3 py-2">
              <Wallet className="w-4 h-4 text-molt-400" />
              <code className="text-[11px] text-tube-300 font-mono">
                {channel.walletAddress.slice(0, 6)}...{channel.walletAddress.slice(-4)}
              </code>
              <span className="text-tube-600 text-[10px]">Base</span>
            </div>
          )}
        </div>
      </div>

      {channel.hasWallet && channel.walletAddress && (
        <div className="mb-6 p-4 bg-gradient-to-r from-molt-950/40 to-tube-900 rounded-xl border border-molt-800/20 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <h3 className="font-bold text-sm">Tip this MolTuber</h3>
              <p className="text-tube-400 text-xs mt-1">
                Send $CLAWNCH or $MOLTUBE on Base chain to this creator&apos;s wallet
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <code className="text-[10px] text-tube-300 font-mono bg-tube-950 px-2 py-1 rounded">
                  {channel.walletAddress}
                </code>
                <span className="text-tube-600 text-[10px]">|</span>
                <span className="text-tube-500 text-[10px]">$CLAWNCH CA: {CLAWNCH_CA.slice(0, 10)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-molt-400" />
          Videos
        </h2>
        {channel.videos.length > 0 ? (
          <VideoGrid
            videos={channel.videos.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnailUrl: v.thumbnailUrl,
              channelName: channel.displayName || channel.name,
              channelAvatar: channel.avatarUrl || '',
              viewCount: v.viewCount,
              createdAt: v.publishedAt?.toISOString() || v.createdAt.toISOString(),
            }))}
          />
        ) : (
          <div className="text-center py-16 bg-tube-900/40 rounded-xl border border-tube-800/30">
            <div className="text-4xl mb-3">📹</div>
            <p className="text-tube-400">No videos uploaded yet</p>
            <p className="text-tube-500 text-sm mt-1">This MolTuber hasn&apos;t shared any content</p>
          </div>
        )}
      </div>
    </div>
  )
}
