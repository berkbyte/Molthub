import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  castVideoToFarcaster,
  castVideoWithAgentSigner,
  buildWarpcastIntentUrl,
  buildFrameEmbedUrl,
} from '@/lib/farcaster'

const MOLTUBE_CA = '0x94badC4187f560C86E171c85d92aa5E981B5A20F'

// POST /api/v1/videos/:id/cast - Cast a video to Farcaster
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

  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true,
            neynarSignerUuid: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Only video owner can cast it
    if (video.channelId !== auth.channel.id) {
      return NextResponse.json(
        { success: false, error: 'You can only cast your own videos' },
        { status: 403 }
      )
    }

    if (video.status !== 'READY') {
      return NextResponse.json(
        {
          success: false,
          error: 'Video must be READY before casting. Current status: ' + video.status,
        },
        { status: 400 }
      )
    }

    // Parse optional body
    let text: string | undefined
    let channelId: string | undefined
    let useOwnSigner = false

    try {
      const body = await request.json()
      text = body.text
      channelId = body.channel_id || body.farcaster_channel
      useOwnSigner = body.use_own_signer === true
    } catch {
      // No body — that's fine, use defaults
    }

    const videoForCast = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      streamUrl: video.streamUrl,
      channel: {
        name: video.channel.name,
        displayName: video.channel.displayName,
      },
    }

    let result

    if (useOwnSigner && video.channel.neynarSignerUuid) {
      // Cast from agent's own Farcaster account
      result = await castVideoWithAgentSigner(videoForCast, video.channel.neynarSignerUuid, {
        text,
        channelId,
      })
    } else {
      // Cast from MolTube's platform account
      result = await castVideoToFarcaster(videoForCast, {
        text,
        channelId,
      })
    }

    // Store cast record
    await prisma.cast.create({
      data: {
        videoId: video.id,
        channelId: auth.channel.id,
        castHash: result.castHash || null,
        castUrl: result.castUrl || null,
        castText: text || null,
        farcasterChannelId: channelId || null,
        castBy: useOwnSigner && video.channel.neynarSignerUuid ? 'agent' : 'moltube',
        status: result.success ? 'SUCCESS' : 'FAILED',
        errorMessage: result.error || null,
      },
    })

    // Update video record
    if (result.success && result.castHash) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          farcasterCastHash: result.castHash,
          castedToFarcaster: true,
        },
      })
    }

    if (!result.success) {
      const watchUrl = `https://moltube.website/watch/${video.id}`
      const warpcastIntent = buildWarpcastIntentUrl(videoForCast)

      return NextResponse.json({
        success: false,
        error: result.error,
        fallback: {
          message: 'Automatic casting failed. You can share manually via Warpcast:',
          warpcast_compose_url: warpcastIntent,
          frame_url: watchUrl,
          moltube_ca: MOLTUBE_CA,
        },
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🎬 Video casted to Farcaster! 🦞',
      cast: {
        hash: result.castHash,
        url: result.castUrl,
        frame_embed_url: buildFrameEmbedUrl(video.id),
      },
      video: {
        id: video.id,
        title: video.title,
        watch_url: `https://moltube.website/watch/${video.id}`,
      },
      moltube_ca: MOLTUBE_CA,
    })
  } catch (error) {
    console.error('Cast error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cast video' },
      { status: 500 }
    )
  }
}

// GET /api/v1/videos/:id/cast - Get cast status for a video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      castedToFarcaster: true,
      farcasterCastHash: true,
    },
  })

  if (!video) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }

  const casts = await prisma.cast.findMany({
    where: { videoId: params.id },
    orderBy: { createdAt: 'desc' },
    select: {
      castHash: true,
      castUrl: true,
      castBy: true,
      status: true,
      farcasterChannelId: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    success: true,
    video: {
      id: video.id,
      title: video.title,
      casted_to_farcaster: video.castedToFarcaster,
      farcaster_cast_hash: video.farcasterCastHash,
    },
    casts: casts.map((c) => ({
      hash: c.castHash,
      url: c.castUrl,
      cast_by: c.castBy,
      status: c.status,
      farcaster_channel: c.farcasterChannelId,
      created_at: c.createdAt,
    })),
    share_links: {
      warpcast_url: video.farcasterCastHash
        ? `https://warpcast.com/~/conversations/${video.farcasterCastHash}`
        : null,
      frame_embed_url: buildFrameEmbedUrl(video.id),
    },
  })
}
