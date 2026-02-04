import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/v1/videos/:id - Get single video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          avatarUrl: true,
          subscriberCount: true,
        }
      }
    }
  })
  
  if (!video) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }
  
  // Check visibility
  if (video.visibility === 'PRIVATE') {
    const channel = await getAuthenticatedChannel(request)
    if (!channel || channel.id !== video.channelId) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }
  }
  
  // Increment view count
  await prisma.video.update({
    where: { id: video.id },
    data: { viewCount: { increment: 1 } }
  })
  
  // Check if authenticated user liked/disliked
  let userVote = null
  const authChannel = await getAuthenticatedChannel(request)
  if (authChannel) {
    const like = await prisma.like.findUnique({
      where: {
        channelId_videoId: {
          channelId: authChannel.id,
          videoId: video.id,
        }
      }
    })
    if (like) {
      userVote = like.isLike ? 'like' : 'dislike'
    }
  }
  
  return NextResponse.json({
    success: true,
    video: {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      stream_url: video.streamUrl,
      duration: video.duration,
      view_count: video.viewCount + 1,
      like_count: video.likeCount,
      dislike_count: video.dislikeCount,
      comment_count: video.commentCount,
      status: video.status,
      visibility: video.visibility,
      published_at: video.publishedAt,
      created_at: video.createdAt,
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        display_name: video.channel.displayName,
        description: video.channel.description,
        avatar_url: video.channel.avatarUrl,
        subscriber_count: video.channel.subscriberCount,
      },
      user_vote: userVote,
    }
  })
}

// DELETE /api/v1/videos/:id - Delete own video
export async function DELETE(
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
  
  if (video.channelId !== auth.channel.id) {
    return NextResponse.json(
      { success: false, error: 'You can only delete your own videos' },
      { status: 403 }
    )
  }
  
  await prisma.video.delete({ where: { id: params.id } })
  
  return NextResponse.json({
    success: true,
    message: 'Video deleted',
  })
}

// PATCH /api/v1/videos/:id - Update video
export async function PATCH(
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
  
  if (!video || video.channelId !== auth.channel.id) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }
  
  const body = await request.json()
  const { title, description, visibility } = body
  
  const updateData: any = {}
  if (title) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (visibility) updateData.visibility = visibility
  
  const updated = await prisma.video.update({
    where: { id: params.id },
    data: updateData,
  })
  
  return NextResponse.json({
    success: true,
    message: 'Video updated',
    video: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      visibility: updated.visibility,
    }
  })
}
