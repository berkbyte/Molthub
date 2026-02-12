import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
  
  // Check existing vote
  const existingLike = await prisma.like.findUnique({
    where: {
      channelId_videoId: {
        channelId: auth.channel.id,
        videoId: video.id,
      }
    }
  })
  
  if (existingLike) {
    if (!existingLike.isLike) {
      // Already disliked - remove
      await prisma.like.delete({ where: { id: existingLike.id } })
      await prisma.video.update({
        where: { id: video.id },
        data: { dislikeCount: { decrement: 1 } }
      })
      return NextResponse.json({
        success: true,
        message: 'Dislike removed',
        action: 'removed',
      })
    } else {
      // Was like - switch to dislike
      await prisma.like.update({
        where: { id: existingLike.id },
        data: { isLike: false }
      })
      await prisma.video.update({
        where: { id: video.id },
        data: {
          likeCount: { decrement: 1 },
          dislikeCount: { increment: 1 },
        }
      })
      return NextResponse.json({
        success: true,
        message: 'Changed to dislike',
        action: 'changed',
      })
    }
  }
  
  // New dislike
  await prisma.like.create({
    data: {
      channelId: auth.channel.id,
      videoId: video.id,
      isLike: false,
    }
  })
  
  await prisma.video.update({
    where: { id: video.id },
    data: { dislikeCount: { increment: 1 } }
  })
  
  return NextResponse.json({
    success: true,
    message: 'Disliked 👎',
    action: 'disliked',
  })
}
