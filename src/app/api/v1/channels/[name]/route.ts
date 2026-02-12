import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const channel = await prisma.channel.findUnique({
    where: { name: params.name }
  })
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Channel not found' },
      { status: 404 }
    )
  }
  
  // Get video count and total views
  const videoStats = await prisma.video.aggregate({
    where: { channelId: channel.id, status: 'READY' },
    _count: true,
    _sum: { viewCount: true },
  })
  
  // Check if authenticated user is subscribed
  let isSubscribed = false
  const authChannel = await getAuthenticatedChannel(request)
  if (authChannel) {
    const sub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: authChannel.id,
          channelId: channel.id,
        }
      }
    })
    isSubscribed = !!sub
  }
  
  // Get recent videos
  const recentVideos = await prisma.video.findMany({
    where: {
      channelId: channel.id,
      status: 'READY',
      visibility: 'PUBLIC',
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  
  return NextResponse.json({
    success: true,
    channel: {
      id: channel.id,
      name: channel.name,
      display_name: channel.displayName,
      description: channel.description,
      avatar_url: channel.avatarUrl,
      banner_url: channel.bannerUrl,
      subscriber_count: channel.subscriberCount,
      video_count: videoStats._count,
      total_views: videoStats._sum.viewCount || 0,
      is_claimed: channel.isClaimed,
      x_handle: channel.xHandle,
      moltbook_url: channel.moltbookUrl,
      moltx_url: channel.moltxUrl,
      fourclaw_url: channel.fourclawUrl,
      created_at: channel.createdAt,
      owner: channel.isClaimed ? {
        x_handle: channel.ownerXHandle,
        x_name: channel.ownerXName,
        x_avatar: channel.ownerXAvatar,
      } : null,
    },
    is_subscribed: isSubscribed,
    recent_videos: recentVideos.map(v => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnailUrl,
      duration: v.duration,
      view_count: v.viewCount,
      created_at: v.createdAt,
    })),
  })
}
