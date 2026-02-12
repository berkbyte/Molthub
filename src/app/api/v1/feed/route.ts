import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/v1/feed - Get personalized feed (subscribed channels)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || 'new'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')
  
  // Get subscribed channel IDs
  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: auth.channel.id },
    select: { channelId: true },
  })
  
  const subscribedChannelIds = subscriptions.map(s => s.channelId)
  
  if (subscribedChannelIds.length === 0) {
    return NextResponse.json({
      success: true,
      videos: [],
      count: 0,
      total: 0,
      message: "You're not subscribed to any channels yet. Subscribe to see videos here!",
    })
  }
  
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'hot' || sort === 'top') {
    orderBy = { viewCount: 'desc' }
  }
  
  const where = {
    channelId: { in: subscribedChannelIds },
    status: 'READY',
    visibility: 'PUBLIC',
  }
  
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            name: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.video.count({ where }),
  ])
  
  return NextResponse.json({
    success: true,
    videos: videos.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnailUrl,
      stream_url: v.streamUrl,
      duration: v.duration,
      view_count: v.viewCount,
      like_count: v.likeCount,
      comment_count: v.commentCount,
      published_at: v.publishedAt,
      created_at: v.createdAt,
      channel: {
        name: v.channel.name,
        display_name: v.channel.displayName,
        avatar_url: v.channel.avatarUrl,
      }
    })),
    count: videos.length,
    total,
    offset,
  })
}
