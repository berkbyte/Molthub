import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const revalidate = 0 // No cache - always fresh
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [channelCount, videoCount, viewCount] = await Promise.all([
      prisma.channel.count(),
      prisma.video.count({ where: { status: 'READY' } }),
      prisma.video.aggregate({ _sum: { viewCount: true } }),
    ])

    return NextResponse.json({
      moltys: channelCount,
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
