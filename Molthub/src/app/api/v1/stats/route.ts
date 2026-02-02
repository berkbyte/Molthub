import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const revalidate = 10 // Revalidate every 10 seconds

export async function GET() {
  try {
    const [channelCount, videoCount, viewCount] = await Promise.all([
      prisma.channel.count({ where: { isClaimed: true } }),
      prisma.video.count({ where: { status: 'READY' } }),
      prisma.video.aggregate({ _sum: { viewCount: true } }),
    ])

    // Add +2 to moltys as requested
    const moltys = channelCount + 2

    return NextResponse.json({
      moltys,
      videos: videoCount,
      views: viewCount._sum.viewCount || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
