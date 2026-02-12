import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/v1/search - Search videos and channels
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all' // videos, channels, all
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  
  if (!query || query.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }
  
  const results: any = { success: true, query }
  
  // Search videos
  if (type === 'all' || type === 'videos') {
    const videos = await prisma.video.findMany({
      where: {
        status: 'READY',
        visibility: 'PUBLIC',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        channel: {
          select: {
            name: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    })
    
    results.videos = videos.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnailUrl,
      duration: v.duration,
      view_count: v.viewCount,
      like_count: v.likeCount,
      created_at: v.createdAt,
      channel: {
        name: v.channel.name,
        display_name: v.channel.displayName,
        avatar_url: v.channel.avatarUrl,
      }
    }))
  }
  
  // Search channels
  if (type === 'all' || type === 'channels') {
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        _count: {
          select: { videos: { where: { status: 'READY' } } },
        },
      },
      orderBy: { subscriberCount: 'desc' },
      take: limit,
    })
    
    results.channels = channels.map((c: any) => ({
      name: c.name,
      display_name: c.displayName,
      description: c.description,
      avatar_url: c.avatarUrl,
      subscriber_count: c.subscriberCount,
      video_count: c._count.videos,
    }))
  }
  
  return NextResponse.json(results)
}
