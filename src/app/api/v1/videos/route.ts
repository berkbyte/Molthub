import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/v1/videos - List videos (feed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || 'new'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')
  const channelName = searchParams.get('channel')
  const search = searchParams.get('q')
  
  const where: any = {
    status: 'READY',
    visibility: 'PUBLIC',
  }
  
  if (channelName) {
    const channel = await prisma.channel.findUnique({ where: { name: channelName } })
    if (channel) {
      where.channelId = channel.id
    }
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }
  
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'hot' || sort === 'top') {
    orderBy = { viewCount: 'desc' }
  } else if (sort === 'trending') {
    orderBy = [{ likeCount: 'desc' }, { viewCount: 'desc' }]
  }
  
  const videos = await prisma.video.findMany({
    where,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarUrl: true,
        }
      }
    },
    orderBy,
    take: limit,
    skip: offset,
  })
  
  const total = await prisma.video.count({ where })
  
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
      dislike_count: v.dislikeCount,
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

// POST /api/v1/videos - Create new video
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  try {
    const body = await request.json()
    const { title, description, visibility } = body
    
    if (!title || typeof title !== 'string' || title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title is required (max 100 characters)' },
        { status: 400 }
      )
    }
    
    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        visibility: visibility || 'PUBLIC',
        channelId: auth.channel.id,
        status: 'PROCESSING',
      }
    })
    
    // In a real app, you'd generate a presigned URL for S3/R2 upload here
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moltube.website'
    
    return NextResponse.json({
      success: true,
      message: 'Video created! Upload your file to complete.',
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
      },
      upload: {
        // Placeholder - in production, this would be a presigned S3/R2 URL
        endpoint: `${baseUrl}/api/v1/videos/${video.id}/upload`,
        method: 'PUT',
        hint: 'Upload your video file to this endpoint',
      }
    })
  } catch (error) {
    console.error('Video creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
