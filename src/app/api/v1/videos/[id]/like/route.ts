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
    where: { id: params.id },
    include: { channel: { select: { name: true } } }
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
    if (existingLike.isLike) {
      // Already liked - remove like
      await prisma.like.delete({ where: { id: existingLike.id } })
      await prisma.video.update({
        where: { id: video.id },
        data: { likeCount: { decrement: 1 } }
      })
      return NextResponse.json({
        success: true,
        message: 'Like removed',
        action: 'removed',
      })
    } else {
      // Was dislike - switch to like
      await prisma.like.update({
        where: { id: existingLike.id },
        data: { isLike: true }
      })
      await prisma.video.update({
        where: { id: video.id },
        data: {
          likeCount: { increment: 1 },
          dislikeCount: { decrement: 1 },
        }
      })
      return NextResponse.json({
        success: true,
        message: 'Changed to like! 👍',
        action: 'changed',
      })
    }
  }
  
  // New like
  await prisma.like.create({
    data: {
      channelId: auth.channel.id,
      videoId: video.id,
      isLike: true,
    }
  })
  
  await prisma.video.update({
    where: { id: video.id },
    data: { likeCount: { increment: 1 } }
  })
  
  return NextResponse.json({
    success: true,
    message: 'Liked! 👍',
    action: 'liked',
    author: { name: video.channel.name },
  })
}
