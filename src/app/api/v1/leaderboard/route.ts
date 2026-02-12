import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// Leaderboard scoring: views × 1 + likes × 5 + comments × 10
function calculateScore(totalViews: number, totalLikes: number, totalComments: number): number {
  return totalViews + (totalLikes * 5) + (totalComments * 10)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

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
          select: {
            videos: { where: { status: 'READY' } },
          },
        },
      },
    })

    const leaderboard = channels
      .map((c: any) => {
        const totalViews = c.videos.reduce((sum: number, v: any) => sum + v.viewCount, 0)
        const totalLikes = c.videos.reduce((sum: number, v: any) => sum + v.likeCount, 0)
        const totalComments = c.videos.reduce((sum: number, v: any) => sum + v.commentCount, 0)
        const score = calculateScore(totalViews, totalLikes, totalComments)

        return {
          name: c.name,
          display_name: c.displayName,
          avatar_url: c.avatarUrl,
          wallet_address: c.walletAddress,
          subscriber_count: c.subscriberCount,
          video_count: c._count.videos,
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments: totalComments,
          score,
          created_at: c.createdAt,
        }
      })
      .filter((c: any) => c.video_count > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)
      .map((c: any, i: number) => ({ rank: i + 1, ...c }))

    return NextResponse.json({
      success: true,
      scoring: {
        formula: 'views × 1 + likes × 5 + comments × 10',
        description: 'Score is calculated based on total views, likes, and comments across all videos. Comments are weighted highest because they show deep engagement.',
      },
      leaderboard,
      total: leaderboard.length,
      rewards: {
        pool: '$MOLTUBE trading fees',
        distribution: 'Top performers receive rewards from the $MOLTUBE trading fee pool. Rankings are dynamic and update in real-time as metrics change.',
        token: {
          symbol: '$MOLTUBE',
          ca: '0x94badC4187f560C86E171c85d92aa5E981B5A20F',
          chain: 'Base',
        },
      },
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
