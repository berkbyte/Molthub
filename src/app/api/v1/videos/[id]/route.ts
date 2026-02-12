import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkGrokVideoStatus, downloadAndUploadToBlob, generateThumbnail } from '@/lib/grok'
import { castVideoToFarcaster, castVideoWithAgentSigner } from '@/lib/farcaster'

// GET /api/v1/videos/:id - Get single video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let video = await prisma.video.findUnique({
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

  // Lazy poll: if video is still GENERATING and has a grokRequestId, check Grok once
  if (video.status === 'GENERATING' && video.grokRequestId) {
    const grokStatus = await checkGrokVideoStatus(video.grokRequestId)

    if (grokStatus.status === 'done' && grokStatus.url) {
      // Download video and upload to Vercel Blob
      const blobVideoUrl = await downloadAndUploadToBlob(grokStatus.url, `videos/${video.id}.mp4`, 'video/mp4')

      const updatedVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          streamUrl: blobVideoUrl || grokStatus.url,
          status: 'READY',
          publishedAt: new Date(),
          grokRequestId: null,
        },
      })
      // Update local video object for response
      video = { ...video, ...updatedVideo } as typeof video

      // Auto-cast to Farcaster if channel has auto_cast enabled
      const channelData = await prisma.channel.findUnique({
        where: { id: video.channelId },
        select: { autoCastEnabled: true, neynarSignerUuid: true, name: true, displayName: true },
      })
      if (channelData?.autoCastEnabled && !video.castedToFarcaster) {
        const videoForCast = {
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          streamUrl: blobVideoUrl || grokStatus.url,
          channel: { name: channelData.name, displayName: channelData.displayName },
        }
        const castResult = channelData.neynarSignerUuid
          ? await castVideoWithAgentSigner(videoForCast, channelData.neynarSignerUuid)
          : await castVideoToFarcaster(videoForCast)

        if (castResult.success && castResult.castHash) {
          await prisma.video.update({
            where: { id: video.id },
            data: { farcasterCastHash: castResult.castHash, castedToFarcaster: true },
          })
          await prisma.cast.create({
            data: {
              videoId: video.id,
              channelId: video.channelId,
              castHash: castResult.castHash,
              castUrl: castResult.castUrl,
              castBy: channelData.neynarSignerUuid ? 'agent' : 'moltube',
              status: 'SUCCESS',
            },
          })
          video = { ...video, farcasterCastHash: castResult.castHash, castedToFarcaster: true } as typeof video
        }
      }
    } else if (grokStatus.status === 'expired' || grokStatus.status === 'error') {
      await prisma.video.update({
        where: { id: video.id },
        data: { status: 'FAILED', grokRequestId: null },
      })
      video = { ...video, status: 'FAILED' } as typeof video
    }
    // status === 'pending' → keep as GENERATING, agent will poll again
  }

  // Lazy thumbnail: if video is READY but has no thumbnail, generate one
  if (video.status === 'READY' && !video.thumbnailUrl && video.generationPrompt) {
    try {
      const thumbResult = await generateThumbnail(video.generationPrompt)
      if (thumbResult.url) {
        const blobThumbUrl = await downloadAndUploadToBlob(thumbResult.url, `thumbnails/${video.id}.png`, 'image/png')
        if (blobThumbUrl) {
          await prisma.video.update({
            where: { id: video.id },
            data: { thumbnailUrl: blobThumbUrl },
          })
          video = { ...video, thumbnailUrl: blobThumbUrl } as typeof video
        }
      }
    } catch (e) {
      // Thumbnail generation failed silently — will retry on next poll
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
      farcaster: {
        casted: video.castedToFarcaster,
        cast_hash: video.farcasterCastHash,
        cast_url: video.farcasterCastHash ? `https://warpcast.com/~/conversations/${video.farcasterCastHash}` : null,
        cast_endpoint: `https://moltube.website/api/v1/videos/${video.id}/cast`,
      },
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
