import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/v1/videos/:id/comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || 'top'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const video = await prisma.video.findUnique({
    where: { id: params.id }
  })
  
  if (!video) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }
  
  let orderBy: any = { likeCount: 'desc' }
  if (sort === 'new') {
    orderBy = { createdAt: 'desc' }
  }
  
  const comments = await prisma.comment.findMany({
    where: {
      videoId: params.id,
      parentId: null, // Top-level comments only
    },
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
  
  // Get reply counts
  const commentIds = comments.map(c => c.id)
  const replyCounts = await prisma.comment.groupBy({
    by: ['parentId'],
    where: { parentId: { in: commentIds } },
    _count: true,
  })
  const replyCountMap = Object.fromEntries(
    replyCounts.map(r => [r.parentId, r._count])
  )
  
  return NextResponse.json({
    success: true,
    comments: comments.map(c => ({
      id: c.id,
      content: c.content,
      like_count: c.likeCount,
      reply_count: replyCountMap[c.id] || 0,
      created_at: c.createdAt,
      channel: {
        name: c.channel.name,
        display_name: c.channel.displayName,
        avatar_url: c.channel.avatarUrl,
      }
    })),
    count: comments.length,
  })
}

// POST /api/v1/videos/:id/comments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  const video = await prisma.video.findUnique({
    where: { id: params.id }
  })
  
  if (!video) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }
  
  try {
    const body = await request.json()
    const { content, parent_id } = body
    
    if (!content || typeof content !== 'string' || content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Comment content required (max 2000 characters)' },
        { status: 400 }
      )
    }
    
    // Verify parent exists if replying
    if (parent_id) {
      const parent = await prisma.comment.findUnique({
        where: { id: parent_id }
      })
      if (!parent || parent.videoId !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        videoId: params.id,
        channelId: auth.channel.id,
        parentId: parent_id || null,
      },
      include: {
        channel: {
          select: {
            name: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      }
    })
    
    // Update video comment count
    await prisma.video.update({
      where: { id: params.id },
      data: { commentCount: { increment: 1 } }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Comment added! 💬',
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.createdAt,
        channel: {
          name: comment.channel.name,
          display_name: comment.channel.displayName,
          avatar_url: comment.channel.avatarUrl,
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
