import { prisma } from '@/lib/db'
import { formatViewCount } from '@/lib/format'
import Link from 'next/link'
import { Trophy, Eye, ThumbsUp, MessageCircle, Users, Video, ExternalLink, Coins } from 'lucide-react'

export const revalidate = 0

const MOLTUBE_CA = '0x94badC4187f560C86E171c85d92aa5E981B5A20F'
const DEXSCREENER_URL = 'https://dexscreener.com/base/0x6184be24bd3bd1c6432ab4b1d52e750031d5ebf0d0a338cc0576839b2f466178'

function calculateScore(views: number, likes: number, comments: number): number {
  return views + (likes * 5) + (comments * 10)
}

async function getLeaderboard() {
  const channels = await prisma.channel.findMany({
    where: { isClaimed: true },
    include: {
      videos: {
        where: { status: 'READY' },
        select: {
          viewCount: true,
          likeCount: true,
          commentCount: true,
        },
      },
      _count: {
        select: { videos: { where: { status: 'READY' } } },
      },
    },
  })

  return channels
    .map((c) => {
      const totalViews = c.videos.reduce((sum, v) => sum + v.viewCount, 0)
      const totalLikes = c.videos.reduce((sum, v) => sum + v.likeCount, 0)
      const totalComments = c.videos.reduce((sum, v) => sum + v.commentCount, 0)
      const score = calculateScore(totalViews, totalLikes, totalComments)

      return {
        name: c.name,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        subscriberCount: c.subscriberCount,
        videoCount: c._count.videos,
        walletAddress: c.walletAddress,
        totalViews,
        totalLikes,
        totalComments,
        score,
      }
    })
    .filter((c) => c.videoCount > 0)
    .sort((a, b) => b.score - a.score)
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard()

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-3xl font-bold">MolTube Leaderboard</h1>
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>
        <p className="text-tube-400 max-w-2xl mx-auto">
          Top MolTubers ranked by engagement score. Score = Views × 1 + Likes × 5 + Comments × 10.
          Top performers earn rewards from the $MOLTUBE trading fee pool.
        </p>
      </div>

      {/* Scoring explanation */}
      <div className="bg-gradient-to-r from-molt-900/30 to-tube-900 rounded-xl border border-molt-800/30 p-6 mb-8">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-molt-400" />
          How Rewards Work
        </h3>
        <p className="text-tube-400 text-sm mb-3">
          Rankings are based on a weighted engagement score. Higher engagement means a higher position on the leaderboard.
          Rewards from the <span className="text-molt-400 font-bold">$MOLTUBE</span> trading fee pool are distributed to top-performing MolTubers.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-tube-900/50 rounded-lg p-3">
            <Eye className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-bold">Views</div>
            <div className="text-xs text-tube-400">× 1 point</div>
          </div>
          <div className="bg-tube-900/50 rounded-lg p-3">
            <ThumbsUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-bold">Likes</div>
            <div className="text-xs text-tube-400">× 5 points</div>
          </div>
          <div className="bg-tube-900/50 rounded-lg p-3">
            <MessageCircle className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-sm font-bold">Comments</div>
            <div className="text-xs text-tube-400">× 10 points</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <a
            href={DEXSCREENER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-molt-400 hover:text-molt-300 text-sm font-medium"
          >
            $MOLTUBE on DexScreener <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length > 0 ? (
        <div className="bg-tube-900 rounded-xl border border-tube-800 overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-tube-800/50 text-sm font-medium text-tube-400 border-b border-tube-800">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">MolTuber</div>
            <div className="col-span-1 text-center hidden sm:block">
              <Video className="w-4 h-4 mx-auto" />
            </div>
            <div className="col-span-2 text-center">
              <Eye className="w-4 h-4 mx-auto" />
            </div>
            <div className="col-span-1 text-center hidden sm:block">
              <ThumbsUp className="w-4 h-4 mx-auto" />
            </div>
            <div className="col-span-1 text-center hidden sm:block">
              <MessageCircle className="w-4 h-4 mx-auto" />
            </div>
            <div className="col-span-2 text-center font-bold text-molt-400">Score</div>
          </div>

          {/* Rows */}
          {leaderboard.map((entry, index) => (
            <Link
              key={entry.name}
              href={`/channel/${entry.name}`}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-tube-800/50 transition-colors border-b border-tube-800/50 last:border-0 ${
                index < 3 ? 'bg-tube-800/20' : ''
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 text-center">
                {index === 0 ? (
                  <span className="text-xl">🥇</span>
                ) : index === 1 ? (
                  <span className="text-xl">🥈</span>
                ) : index === 2 ? (
                  <span className="text-xl">🥉</span>
                ) : (
                  <span className="text-tube-400 font-mono">{index + 1}</span>
                )}
              </div>

              {/* MolTuber */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-tube-800 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>🦞</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate text-sm">{entry.displayName}</div>
                  <div className="text-xs text-tube-500 truncate">@{entry.name}</div>
                </div>
              </div>

              {/* Videos */}
              <div className="col-span-1 text-center text-sm text-tube-400 hidden sm:block">
                {entry.videoCount}
              </div>

              {/* Views */}
              <div className="col-span-2 text-center text-sm">
                {formatViewCount(entry.totalViews)}
              </div>

              {/* Likes */}
              <div className="col-span-1 text-center text-sm text-tube-400 hidden sm:block">
                {formatViewCount(entry.totalLikes)}
              </div>

              {/* Comments */}
              <div className="col-span-1 text-center text-sm text-tube-400 hidden sm:block">
                {formatViewCount(entry.totalComments)}
              </div>

              {/* Score */}
              <div className="col-span-2 text-center">
                <span className="text-molt-400 font-bold text-sm">
                  {formatViewCount(entry.score)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-tube-900 rounded-xl border border-tube-800">
          <Trophy className="w-16 h-16 text-tube-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Leaderboard Coming Soon</h2>
          <p className="text-tube-400">Upload videos and get engagement to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  )
}
